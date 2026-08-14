import type { LearningState, PersistedState, Settings, WordCard } from '../contracts/types'

const STATE_KEY = 'simplespeak_state_v1'

export const defaultSettings: Settings = {
  modelId: 'gemini-2.5-flash-image',
  effort: 'medium',
  resolution: '1024',
  aspectRatio: '1:1',
  innerPrompt: 'Create a single memorable visual for this vocabulary card. Use one clear subject, a simple scene, strong silhouette, warm editorial lighting, no written words, no labels, no watermark, and no collage. Make the meaning immediately recognizable and suitable for a square card.',
  timeframeDays: 90,
  dailyTarget: 12,
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
  cards.forEach((card) => { learning[card.id] = createEmptyLearning() })
  return { version: 1, learning, notes: {}, images: {}, runs: [], generations: [], settings: { ...defaultSettings } }
}

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
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
      ...initial,
      ...parsed,
      learning,
      notes: parsed.notes ?? {},
      images: parsed.images ?? {},
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      generations: Array.isArray(parsed.generations) ? parsed.generations : [],
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
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
