import type { PersistedState } from '../../../core/contracts/types'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { isDue } from '../../study/domain/scheduler'
import { retentionBand } from '../../study/domain/retentionBands'
import { createEmptyLearning } from '../../../core/persistence/localStateRepository'

export interface ProgressStats {
  total: number
  anchored: number
  familiar: number
  due: number
  bundledImages: number
  reviewed: number
  reviewedToday: number
  coverage: number
  totalReviews: number
  averageAccuracy: number
  acquired: number
  dueBand: number
  lost: number
  notStarted: number
  needsReturn: number
}

export function progressStats(state: PersistedState, now = Date.now()): ProgressStats {
  const cards = starterPack.cards
  const getLearning = (cardId: string) => state.learning[cardId] ?? createEmptyLearning()
  const anchored = cards.filter((card) => getLearning(card.id).status === 'anchored').length
  const familiar = cards.filter((card) => getLearning(card.id).status === 'familiar').length
  const due = cards.filter((card) => isDue(getLearning(card.id), now)).length
  const bundledImages = cards.filter((card) => Boolean(state.images[card.id])).length
  const reviewed = cards.filter((card) => getLearning(card.id).reviewCount > 0).length
  const reviewedToday = cards.filter((card) => {
    const timestamp = getLearning(card.id).lastReviewedAt
    return timestamp !== null && now - timestamp < 24 * 60 * 60 * 1000
  }).length
  const retentionCounts = cards.reduce((counts, card) => {
    counts[retentionBand(getLearning(card.id), now)] += 1
    return counts
  }, { acquired: 0, due: 0, lost: 0, new: 0 })
  const totalReviews = cards.reduce((sum, card) => sum + getLearning(card.id).reviewCount, 0)
  const totalHits = state.runs.reduce((sum, run) => sum + run.hits, 0)
  const totalAttempts = state.runs.reduce((sum, run) => sum + run.hits + run.misses, 0)
  return {
    total: cards.length,
    anchored,
    familiar,
    due,
    bundledImages,
    reviewed,
    reviewedToday,
    coverage: cards.length ? Math.round((anchored / cards.length) * 100) : 0,
    totalReviews,
    averageAccuracy: totalAttempts ? Math.round((totalHits / totalAttempts) * 100) : 0,
    acquired: retentionCounts.acquired,
    dueBand: retentionCounts.due,
    lost: retentionCounts.lost,
    notStarted: retentionCounts.new,
    needsReturn: retentionCounts.lost + retentionCounts.new,
  }
}
