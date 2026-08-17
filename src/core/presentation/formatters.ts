import { DAY_MS } from '../clock/clock'
import type { SupportedLocale } from '../i18n/i18n'
import { translate } from '../i18n/i18n'

export function humanize(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatDuration(durationMs: number, locale: SupportedLocale = 'en-US'): string {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  if (locale === 'pt-BR') return `${minutes}min ${remainder}s`
  if (locale === 'de-DE') return `${minutes} Min. ${remainder}s`
  return `${minutes}m ${remainder}s`
}

export function formatRelativeDate(timestamp: number | null, locale: SupportedLocale = 'en-US'): string {
  if (!timestamp) return translate(locale, 'format.notReviewed')
  const days = Math.round((timestamp - Date.now()) / DAY_MS)
  if (Math.abs(days) < 1) return translate(locale, 'format.today')
  if (days === 1) return translate(locale, 'format.tomorrow')
  if (days === -1) return translate(locale, 'format.yesterday')
  if (days > 1) return translate(locale, 'format.inDays', { count: days })
  return translate(locale, 'format.daysAgo', { count: Math.abs(days) })
}

export function statusLabel(status: LearningStateStatus, locale: SupportedLocale = 'en-US'): string {
  return translate(locale, `status.${status}`)
}

type LearningStateStatus = 'new' | 'emerging' | 'familiar' | 'anchored'
