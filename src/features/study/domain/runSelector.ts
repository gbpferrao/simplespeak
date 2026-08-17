import type { LearningState, RunConfig, RunCriterion, RunPreset, WordCard } from '../../../core/contracts/types'
import { createEmptyLearning } from '../../../core/persistence/localStateRepository'
import { isDue, retrievability } from './scheduler'

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
  const scoped = config.sceneId && (config.preset === 'scene' || config.preset === 'custom') ? cards.filter((card) => card.sceneId === config.sceneId) : cards
  const ranked = rankCards(scoped, learning, now)
  if (config.criteria.length === 0) {
    if (config.preset === 'due-nearby') {
    const due = ranked.filter((card) => isDue(learning[card.id] ?? createEmptyLearning(), now))
    const nearby = ranked.filter((card) => !due.some((dueCard) => dueCard.id === card.id))
      return [...due, ...nearby].slice(0, config.limit)
    }
    return ranked.slice(0, config.limit)
  }
  const fullPool = rankCards(cards, learning, now)
  const due = ranked.filter((card) => isDue(learning[card.id] ?? createEmptyLearning(), now))
  const nearby = ranked.filter((card) => !due.some((dueCard) => dueCard.id === card.id)).slice(0, config.limit)
  const baseIds = config.preset === 'due-nearby'
    ? new Set([...due, ...nearby].map((card) => card.id))
    : new Set(ranked.map((card) => card.id))
  const selectedIds = applyCriteria(fullPool, learning, config.criteria, now, baseIds)
  return fullPool.filter((card) => selectedIds.has(card.id)).slice(0, config.limit)
}

export function defaultRunConfig(preset: RunPreset = 'due-nearby', sceneId: string | null = null, limit = 12): RunConfig {
  return { preset, sceneId, limit, criteria: [] }
}
