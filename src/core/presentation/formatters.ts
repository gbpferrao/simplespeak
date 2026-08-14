import { DAY_MS } from '../clock/clock'

export function humanize(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function formatRelativeDate(timestamp: number | null): string {
  if (!timestamp) return 'Not reviewed yet'
  const days = Math.round((timestamp - Date.now()) / DAY_MS)
  if (Math.abs(days) < 1) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1) return `In ${days} days`
  return `${Math.abs(days)} days ago`
}

export function statusLabel(status: LearningStateStatus): string {
  switch (status) {
    case 'new': return 'New'
    case 'emerging': return 'Emerging'
    case 'familiar': return 'Familiar'
    case 'anchored': return 'Anchored'
  }
}

type LearningStateStatus = 'new' | 'emerging' | 'familiar' | 'anchored'
