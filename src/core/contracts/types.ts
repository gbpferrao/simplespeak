export type View = 'board' | 'history' | 'settings'

export type CardStatus = 'new' | 'emerging' | 'familiar' | 'anchored'
export type ReviewOutcome = 'hit' | 'miss' | 'reveal' | 'typed'
export type RunPreset = 'scene' | 'due-nearby' | 'all' | 'custom'
export type ImageResolution = '512' | '1K' | '2K'
export type ImageEffort = 'minimal' | 'high'
export type { SupportedLocale } from '../i18n/i18n'
import type { SupportedLocale } from '../i18n/i18n'

export interface Scene {
  id: string
  name: string
  kicker: string
  description: string
  x: number
  y: number
  width: number
  height: number
  accent: string
}

export interface WordCard {
  id: string
  target: string
  origin: string
  partOfSpeech: string
  sceneId: string
  x: number
  y: number
  imagePath?: string
  sense?: string
  answers?: string[]
  example?: {
    target?: string
    origin?: string
  }
  note?: string
  imagePrompt?: string
}

export interface ReviewEvent {
  id: string
  cardId: string
  runId: string
  outcome: ReviewOutcome
  revealed: boolean
  responseMs: number | null
  stabilityBefore: number
  stabilityAfter: number
  occurredAt: number
}

export interface LearningState {
  status: CardStatus
  stabilityDays: number
  difficulty: number
  lastReviewedAt: number | null
  nextDueAt: number | null
  reviewCount: number
  lapseCount: number
  lastOutcome: ReviewOutcome | null
  history: ReviewEvent[]
}

export interface RunRecord {
  id: string
  preset: RunPreset
  label: string
  sceneId: string | null
  cardIds: string[]
  completedCardIds: string[]
  hits: number
  misses: number
  reveals: number
  durationMs: number
  startedAt: number
  finishedAt: number
}

export interface GenerationRecord {
  id: string
  cardId: string
  prompt: string
  modelId: string
  resolution: ImageResolution
  succeeded: boolean
  occurredAt: number
  error: string | null
}

export interface Settings {
  uiLocale: SupportedLocale
  modelId: string
  effort: ImageEffort
  resolution: ImageResolution
  aspectRatio: '1:1'
  innerPrompt: string
  timeframeDays: number
  dailyTarget: number
}

export interface PersistedState {
  version: 1
  learning: Record<string, LearningState>
  notes: Record<string, string>
  images: Record<string, string>
  runs: RunRecord[]
  generations: GenerationRecord[]
  settings: Settings
}
