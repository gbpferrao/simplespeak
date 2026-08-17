export type View = 'board' | 'history' | 'settings'

export type CardStatus = 'new' | 'emerging' | 'familiar' | 'anchored'
export type ReviewOutcome = 'hit' | 'miss' | 'reveal' | 'typed'
export type RunPreset = 'scene' | 'due-nearby' | 'all' | 'custom'
export type RunStatus = 'completed' | 'unfinished'
export type RunFilterMode = 'add' | 'subtract'
export type RunCriterionKind = 'scene' | 'part-of-speech' | 'retention'
export interface RunCriterion {
  id: string
  mode: RunFilterMode
  kind: RunCriterionKind
  value?: string
  minRetention?: number
  maxRetention?: number
}
export interface RunConfig {
  preset: RunPreset
  sceneId: string | null
  limit: number
  criteria: RunCriterion[]
}
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
  status: RunStatus
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
  config?: RunConfig
}

export interface Settings {
  uiLocale: SupportedLocale
}

export interface PersistedState {
  version: 1
  learning: Record<string, LearningState>
  notes: Record<string, string>
  images: Record<string, string>
  runs: RunRecord[]
  settings: Settings
}
