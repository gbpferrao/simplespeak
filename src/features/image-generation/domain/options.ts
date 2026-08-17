import type { ImageEffort, ImageResolution } from '../../../core/contracts/types'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { translate } from '../../../core/i18n/i18n'

export function imageResolutionLabel(resolution: ImageResolution, locale: SupportedLocale = 'en-US'): string {
  const labels: Record<ImageResolution, string> = {
    '512': `512px - ${translate(locale, 'image.quickLight')}`,
    '1K': `1K - ${translate(locale, 'image.standardRecommended')}`,
    '2K': `2K - ${translate(locale, 'image.detailedHeavier')}`,
  }
  return labels[resolution]
}

export function imageEffortLabel(effort: ImageEffort, locale: SupportedLocale = 'en-US'): string {
  return effort === 'high' ? translate(locale, 'image.highEffort') : translate(locale, 'image.minimalEffort')
}
