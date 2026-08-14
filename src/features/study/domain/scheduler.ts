import type { LearningState, ReviewEvent, ReviewOutcome } from '../../../core/contracts/types'
import { DAY_MS } from '../../../core/clock/clock'

export function retrievability(learning: LearningState, now = Date.now()): number {
  if (!learning.lastReviewedAt || learning.reviewCount === 0) return 0.32
  const elapsedDays = Math.max(0, now - learning.lastReviewedAt) / DAY_MS
  return Math.max(0, Math.min(1, 2 ** (-elapsedDays / Math.max(0.35, learning.stabilityDays))))
}

export function isDue(learning: LearningState, now = Date.now()): boolean {
  if (!learning.lastReviewedAt) return true
  return (learning.nextDueAt ?? 0) <= now || retrievability(learning, now) < 0.78
}

function getStatus(reviewCount: number, stabilityDays: number): LearningState['status'] {
  if (reviewCount === 0) return 'new'
  if (reviewCount < 3 || stabilityDays < 4) return 'emerging'
  if (reviewCount < 6 || stabilityDays < 21) return 'familiar'
  return 'anchored'
}

export function applyReview(
  current: LearningState,
  cardId: string,
  runId: string,
  outcome: ReviewOutcome,
  revealed: boolean,
  responseMs: number | null,
  now = Date.now(),
): LearningState {
  const remembered = outcome === 'hit' || outcome === 'typed'
  const before = Math.max(0.35, current.stabilityDays)
  const difficultyDelta = remembered ? -0.035 : 0.075
  const difficulty = Math.max(0.08, Math.min(0.95, current.difficulty + difficultyDelta))
  const speedBonus = responseMs !== null && responseMs < 5000 ? 0.08 : 0
  const multiplier = remembered ? 1.38 + (1 - difficulty) * 0.42 + speedBonus : outcome === 'reveal' ? 0.62 : 0.52
  const after = Math.max(0.35, Math.min(365, before * multiplier + (current.reviewCount === 0 && remembered ? 0.4 : 0)))
  const nextDueAt = now + after * 0.234 * DAY_MS
  const event: ReviewEvent = {
    id: `${runId}-${cardId}-${now}`,
    cardId,
    runId,
    outcome,
    revealed,
    responseMs,
    stabilityBefore: before,
    stabilityAfter: after,
    occurredAt: now,
  }
  return {
    ...current,
    status: getStatus(current.reviewCount + 1, after),
    stabilityDays: after,
    difficulty,
    lastReviewedAt: now,
    nextDueAt,
    reviewCount: current.reviewCount + 1,
    lapseCount: current.lapseCount + (remembered ? 0 : 1),
    lastOutcome: outcome,
    history: [...current.history, event].slice(-40),
  }
}
