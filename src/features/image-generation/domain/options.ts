import type { ImageEffort, ImageResolution } from '../../../core/contracts/types'

export function imageResolutionLabel(resolution: ImageResolution): string {
  const labels: Record<ImageResolution, string> = {
    '512': '512px - quick and light',
    '1K': '1K - standard (recommended)',
    '2K': '2K - detailed and heavier',
  }
  return labels[resolution]
}

export function imageEffortLabel(effort: ImageEffort): string {
  return effort === 'high' ? 'High - more composition thinking' : 'Minimal - quick card visuals'
}
