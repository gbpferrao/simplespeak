import type { PersistedState, ReviewOutcome, RunConfig, RunPreset, WordCard } from '../../../core/contracts/types'
import { DEFAULT_LOCALE, runLabelForLocale, type SupportedLocale } from '../../../core/i18n/i18n'

export type { RunConfig } from '../../../core/contracts/types'

export interface RunSession {
  id: string
  preset: RunPreset
  config: RunConfig
  label: string
  sceneId: string | null
  cards: WordCard[]
  currentIndex: number
  revealed: boolean
  typedAnswer: string
  startedAt: number
  responseStartedAt: number
  progressTimestamps: number[]
  hits: number
  misses: number
  reveals: number
  completedIds: string[]
  finished: boolean
}

export const RUN_SPEED_WINDOW_SIZE = 5
export const RUN_SPEED_JITTER_THRESHOLD_WPM = 20

export function rollingRunSpeedWpm(session: Pick<RunSession, 'startedAt' | 'progressTimestamps'>, now = Date.now()): number {
  const timestamps = session.progressTimestamps.slice(-RUN_SPEED_WINDOW_SIZE)
  if (timestamps.length === 0) return 0
  const windowStart = timestamps.length === 1 ? session.startedAt : timestamps[0]
  const elapsedMs = Math.max(1000, now - windowStart)
  return timestamps.length * 60_000 / elapsedMs
}

export function runSpeedCueActive(session: Pick<RunSession, 'startedAt' | 'progressTimestamps'>, now = Date.now()): boolean {
  return session.progressTimestamps.length >= 2 && rollingRunSpeedWpm(session, now) >= RUN_SPEED_JITTER_THRESHOLD_WPM
}

export function runLabel(config: RunConfig, sceneName: string | null, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return runLabelForLocale(config.preset, sceneName, locale)
}

export function isRemembered(outcome: ReviewOutcome): boolean {
  return outcome === 'hit' || outcome === 'typed'
}

export interface RunRecordInput {
  session: RunSession
  completedIds: string[]
  hits: number
  misses: number
  reveals: number
  finishedAt: number
}

export function makeRunRecord(input: RunRecordInput): PersistedState['runs'][number] {
  return {
    id: input.session.id,
    preset: input.session.preset,
    label: input.session.label,
    sceneId: input.session.sceneId,
    cardIds: input.session.cards.map((card) => card.id),
    completedCardIds: input.completedIds,
    hits: input.hits,
    misses: input.misses,
    reveals: input.reveals,
    durationMs: input.finishedAt - input.session.startedAt,
    startedAt: input.session.startedAt,
    finishedAt: input.finishedAt,
    config: input.session.config,
  }
}
