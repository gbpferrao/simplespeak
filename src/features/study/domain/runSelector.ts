import type { LearningState, RunConfig, RunCriterion, RunPreset, WordCard } from '../../../core/contracts/types'
import { createEmptyLearning } from '../../../core/persistence/localStateRepository'
import { isDue, retrievability } from './scheduler'

/** A zero limit is retained in RunConfig as the explicit uncapped sentinel. */
export const UNLIMITED_RUN_LIMIT = 0

const DUE_NEARBY_MAX_RETENTION = 89

export function criteriaForRunPreset(preset: RunPreset, sceneId: string | null): RunCriterion[] {
  if ((preset === 'scene' || preset === 'custom') && sceneId) {
    return [{ id: `preset-scene-${sceneId}`, mode: 'add', kind: 'scene', value: sceneId }]
  }
  if (preset === 'due-nearby') {
    return [{ id: 'preset-due-nearby', mode: 'add', kind: 'retention', minRetention: 0, maxRetention: DUE_NEARBY_MAX_RETENTION }]
  }
  return []
}

/**
 * Convert legacy preset metadata into the same ordered filter list used by
 * the route editor. New routes already provide this list; old saved routes
 * get the equivalent criteria at replay time.
 */
export function materializeRunConfig(config: RunConfig): RunConfig {
  const criteria = config.criteria?.length ? config.criteria : criteriaForRunPreset(config.preset, config.sceneId)
  return { ...config, limit: config.limit ?? UNLIMITED_RUN_LIMIT, criteria }
}

function rankCards(cards: WordCard[], learning: Record<string, LearningState>, now: number): WordCard[] {
  return [...cards].sort((left, right) => {
    const leftState = learning[left.id] ?? createEmptyLearning()
    const rightState = learning[right.id] ?? createEmptyLearning()
    const leftRetrieval = retrievability(leftState, now)
    const rightRetrieval = retrievability(rightState, now)
    const leftScore = (isDue(leftState, now) ? 2 : 0) + (1 - leftRetrieval) + 1 / (leftState.stabilityDays + 1)
    const rightScore = (isDue(rightState, now) ? 2 : 0) + (1 - rightRetrieval) + 1 / (rightState.stabilityDays + 1)
    return rightScore - leftScore || left.target.localeCompare(right.target)
  })
}

function matchesCriterion(card: WordCard, criterion: RunCriterion, learning: Record<string, LearningState>, now: number): boolean {
  if (criterion.kind === 'scene') return Boolean(criterion.value && card.sceneId === criterion.value)
  if (criterion.kind === 'part-of-speech') return Boolean(criterion.value && card.partOfSpeech === criterion.value)
  const score = retrievability(learning[card.id] ?? createEmptyLearning(), now) * 100
  const min = Math.max(0, Math.min(100, criterion.minRetention ?? 0))
  const max = Math.max(min, Math.min(100, criterion.maxRetention ?? 100))
  return score >= min && score <= max
}

function applyCriteria(cards: WordCard[], learning: Record<string, LearningState>, criteria: RunCriterion[], now: number, baseIds: Set<string>): Set<string> {
  const selected = new Set(baseIds)
  criteria.forEach((criterion) => {
    const matchingIds = new Set(cards.filter((card) => matchesCriterion(card, criterion, learning, now)).map((card) => card.id))
    if (criterion.mode === 'add') {
      selected.forEach((cardId) => {
        if (!matchingIds.has(cardId)) selected.delete(cardId)
      })
    } else {
      matchingIds.forEach((cardId) => selected.delete(cardId))
    }
  })
  return selected
}

export function selectCardsForRun(cards: WordCard[], learning: Record<string, LearningState>, config: RunConfig): WordCard[] {
  const now = Date.now()
  const activeConfig = materializeRunConfig(config)
  const ranked = rankCards(cards, learning, now)
  const baseIds = new Set(cards.map((card) => card.id))
  const selectedIds = applyCriteria(cards, learning, activeConfig.criteria, now, baseIds)

  // `limit` remains in the persisted contract for older records, but route
  // presets no longer silently truncate a filter result. A route is bounded
  // by its criteria; All words intentionally returns the entire pack.
  return ranked.filter((card) => selectedIds.has(card.id))
}

export function defaultRunConfig(preset: RunPreset = 'due-nearby', sceneId: string | null = null, limit = UNLIMITED_RUN_LIMIT): RunConfig {
  return materializeRunConfig({ preset, sceneId, limit, criteria: [] })
}
