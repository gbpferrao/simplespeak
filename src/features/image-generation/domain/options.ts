import type { ImageResolution } from '../../../core/contracts/types'

export function imageResolutionLabel(resolution: ImageResolution): string {
  return `${resolution}px square`
}
