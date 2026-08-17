import type { LearningState } from '../../../core/contracts/types'
import { retrievability } from '../../study/domain/scheduler'

/**
 * Prototype visual cues. These values affect canvas presentation only; they
 * are not Scheduler thresholds and are intentionally not persisted settings.
 */
export const BOARD_RETENTION_DIM_THRESHOLD = 0.6
export const BOARD_RETENTION_DIM_OPACITY = 0.46
export const BOARD_RUN_CONTEXT_OPACITY = 0.28

interface BoardCardOpacityOptions {
  learning: LearningState
  baseOpacity: number
  focused?: boolean
  active?: boolean
  runMode?: boolean
  now?: number
}

/**
 * Keep the active retrieval target legible, then quieten retention-fading
 * cards and non-target Run context in that order. The same rule is shared by
 * full Card nodes and the lightweight overview marker layer.
 */
export function boardCardOpacity({
  learning,
  baseOpacity,
  focused = false,
  active = false,
  runMode = false,
  now,
}: BoardCardOpacityOptions): number {
  if (focused || active) return 1

  const retentionOpacity = retrievability(learning, now) < BOARD_RETENTION_DIM_THRESHOLD
    ? BOARD_RETENTION_DIM_OPACITY
    : 1
  const runOpacity = runMode ? BOARD_RUN_CONTEXT_OPACITY : 1

  return Math.min(baseOpacity, retentionOpacity, runOpacity)
}
