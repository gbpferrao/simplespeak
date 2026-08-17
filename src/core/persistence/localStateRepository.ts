import type { LearningState, PersistedState, RunConfig, RunCriterion, RunPreset, RunRecord, RunStatus, Settings, WordCard } from '../contracts/types'
import { DEFAULT_LOCALE, normalizeLocale } from '../i18n/i18n'

const STATE_KEY = 'simplespeak_state_v1'

export const defaultSettings: Settings = {
  uiLocale: DEFAULT_LOCALE,
  timeframeDays: 90,
  dailyTarget: 12,
}

function normalizeSettings(value: Partial<Settings> | undefined): Settings {
  const candidate = value ?? {}
  return {
    uiLocale: normalizeLocale(candidate.uiLocale),
    timeframeDays: Number.isFinite(candidate.timeframeDays) ? Math.max(1, Number(candidate.timeframeDays)) : defaultSettings.timeframeDays,
    dailyTarget: Number.isFinite(candidate.dailyTarget) ? Math.max(1, Number(candidate.dailyTarget)) : defaultSettings.dailyTarget,
  }
}

function normalizeRunPreset(value: unknown): RunPreset {
  return value === 'scene' || value === 'due-nearby' || value === 'all' || value === 'custom' ? value : 'due-nearby'
}

function normalizeRunStatus(value: unknown): RunStatus {
  return value === 'unfinished' ? 'unfinished' : 'completed'
}

function normalizeRunCriterion(value: unknown, index: number): RunCriterion | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<RunCriterion>
  const kind = candidate.kind === 'scene' || candidate.kind === 'part-of-speech' || candidate.kind === 'retention' ? candidate.kind : null
  if (!kind) return null
  const mode = candidate.mode === 'subtract' ? 'subtract' : 'add'
  const id = typeof candidate.id === 'string' && candidate.id ? candidate.id : `criterion-${index}`
  const criterion: RunCriterion = { id, mode, kind }
  if (typeof candidate.value === 'string') criterion.value = candidate.value
  if (kind === 'retention') {
    const minRetention = Number.isFinite(candidate.minRetention) ? Math.max(0, Math.min(100, Number(candidate.minRetention))) : 0
    const maxRetention = Number.isFinite(candidate.maxRetention) ? Math.max(minRetention, Math.min(100, Number(candidate.maxRetention))) : 100
    criterion.minRetention = minRetention
    criterion.maxRetention = maxRetention
  }
  return criterion
}

function normalizeRunConfig(value: unknown, fallback: RunConfig): RunConfig {
  const candidate = value && typeof value === 'object' ? value as Partial<RunConfig> : {}
  const rawCriteria = Array.isArray(candidate.criteria) ? candidate.criteria : []
  return {
    preset: normalizeRunPreset(candidate.preset ?? fallback.preset),
    sceneId: typeof candidate.sceneId === 'string' ? candidate.sceneId : fallback.sceneId,
    limit: Number.isFinite(candidate.limit) ? Math.max(1, Math.min(60, Number(candidate.limit))) : fallback.limit,
    criteria: rawCriteria.map(normalizeRunCriterion).filter((criterion): criterion is RunCriterion => Boolean(criterion)),
  }
}

function normalizeRuns(value: unknown): RunRecord[] {
  if (!Array.isArray(value)) return []
  return value.map((run) => {
    const candidate = run as RunRecord
    const fallback: RunConfig = {
      preset: normalizeRunPreset(candidate.preset),
      sceneId: typeof candidate.sceneId === 'string' ? candidate.sceneId : null,
      limit: Array.isArray(candidate.cardIds) && candidate.cardIds.length > 0 ? candidate.cardIds.length : 12,
      criteria: [],
    }
    return { ...candidate, status: normalizeRunStatus(candidate.status), config: normalizeRunConfig(candidate.config, fallback) }
  })
}

export function createEmptyLearning(): LearningState {
  return {
    status: 'new',
    stabilityDays: 1,
    difficulty: 0.5,
    lastReviewedAt: null,
    nextDueAt: null,
    reviewCount: 0,
    lapseCount: 0,
    lastOutcome: null,
    history: [],
  }
}

export function makeInitialState(cards: WordCard[]): PersistedState {
  const learning: Record<string, LearningState> = {}
  const images: Record<string, string> = {}
  cards.forEach((card) => {
    learning[card.id] = createEmptyLearning()
    if (card.imagePath) images[card.id] = card.imagePath
  })
  return { version: 1, learning, notes: {}, images, runs: [], settings: { ...defaultSettings } }
}

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function normalizeImages(cards: WordCard[], value: unknown): Record<string, string> {
  const images: Record<string, string> = {}
  if (value && typeof value === 'object') {
    for (const [cardId, imagePath] of Object.entries(value)) {
      if (typeof imagePath === 'string' && imagePath.trim()) images[cardId] = imagePath
    }
  }
  for (const card of cards) {
    if (card.imagePath) images[card.id] = card.imagePath
  }
  return images
}

export async function loadPersistedState(cards: WordCard[]): Promise<PersistedState> {
  if (!isBrowserStorageAvailable()) return makeInitialState(cards)
  try {
    const raw = window.localStorage.getItem(STATE_KEY)
    if (!raw) return makeInitialState(cards)
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const initial = makeInitialState(cards)
    const learning = { ...initial.learning, ...(parsed.learning ?? {}) }
    cards.forEach((card) => {
      const candidate = learning[card.id]
      learning[card.id] = candidate && typeof candidate === 'object'
        ? { ...createEmptyLearning(), ...candidate, history: Array.isArray(candidate.history) ? candidate.history : [] }
        : createEmptyLearning()
    })
    return {
      version: 1,
      learning,
      notes: parsed.notes ?? {},
      images: normalizeImages(cards, parsed.images),
      runs: normalizeRuns(parsed.runs),
      settings: normalizeSettings(parsed.settings),
    }
  } catch {
    return makeInitialState(cards)
  }
}

export function savePersistedState(state: PersistedState): void {
  if (!isBrowserStorageAvailable()) return
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // A large inline image may exceed browser quota. The in-memory state remains usable.
  }
}
