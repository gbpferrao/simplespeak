import type { PersistedState, ReviewOutcome, RunConfig, RunPreset, RunStatus, WordCard } from '../../../core/contracts/types'
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
  hitTimestamps: number[]
  hitRateStartedAt: number
  hits: number
  misses: number
  reveals: number
  completedIds: string[]
  finished: boolean
}

export const RUN_SPEED_WINDOW_SIZE = 5
export const RUN_HIT_RATE_JITTER_THRESHOLD = 20
export const RUN_PAD_MAX_HITS_PER_MINUTE = 30
export const RUN_GOOD_ACCURACY = 0.6
export const RUN_EXCELLENT_ACCURACY = 0.9

export function rollingHitRatePerMinute(session: Pick<RunSession, 'hitRateStartedAt' | 'hitTimestamps'>, now = Date.now()): number {
  const timestamps = session.hitTimestamps.slice(-RUN_SPEED_WINDOW_SIZE)
  if (timestamps.length === 0) return 0
  const windowStart = timestamps.length === 1 ? session.hitRateStartedAt : timestamps[0]
  const elapsedMs = Math.max(1000, now - windowStart)
  return timestamps.length * 60_000 / elapsedMs
}

export function runHitRateCueActive(session: Pick<RunSession, 'hitRateStartedAt' | 'hitTimestamps'>, now = Date.now()): boolean {
  return session.hitTimestamps.length >= 2 && rollingHitRatePerMinute(session, now) >= RUN_HIT_RATE_JITTER_THRESHOLD
}

export function runPadVolumeLevel(session: Pick<RunSession, 'hitRateStartedAt' | 'hitTimestamps'>, now = Date.now()): number {
  return Math.max(0, Math.min(1, rollingHitRatePerMinute(session, now) / RUN_PAD_MAX_HITS_PER_MINUTE))
}

export type RunFinishTier = 'bad' | 'good' | 'excellent'

export function runFinishTier(hits: number, misses: number): RunFinishTier {
  const total = hits + misses
  const accuracy = total > 0 ? hits / total : 0
  if (accuracy >= RUN_EXCELLENT_ACCURACY) return 'excellent'
  if (accuracy >= RUN_GOOD_ACCURACY) return 'good'
  return 'bad'
}

export function runLabel(config: RunConfig, sceneName: string | null, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return runLabelForLocale(config.preset, sceneName, locale)
}

export function isRemembered(outcome: ReviewOutcome): boolean {
  return outcome === 'hit' || outcome === 'typed'
}

export interface RunRecordInput {
  session: RunSession
  status: RunStatus
  completedIds: string[]
  hits: number
  misses: number
  reveals: number
  finishedAt: number
}

export function makeRunRecord(input: RunRecordInput): PersistedState['runs'][number] {
  return {
    id: input.session.id,
    status: input.status,
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
