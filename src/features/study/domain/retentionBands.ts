import type { LearningState } from '../../../core/contracts/types'
import { retrievability } from './scheduler'

/**
 * Shared presentation bands. These describe the current signal, not a
 * permanent mastery claim. Board opacity and History use the same boundary.
 */
export const ACQUIRED_RETENTION_THRESHOLD = 0.9
export const DUE_RETENTION_THRESHOLD = 0.5

export type RetentionBand = 'acquired' | 'due' | 'lost' | 'new'

export function retentionBand(learning: LearningState, now = Date.now()): RetentionBand {
  if (learning.reviewCount === 0) return 'new'

  const score = retrievability(learning, now)
  if (score >= ACQUIRED_RETENTION_THRESHOLD) return 'acquired'
  if (score >= DUE_RETENTION_THRESHOLD) return 'due'
  return 'lost'
}
