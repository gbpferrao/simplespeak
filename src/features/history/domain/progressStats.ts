import type { PersistedState } from '../../../core/contracts/types'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { isDue } from '../../study/domain/scheduler'
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
  return { total: cards.length, anchored, familiar, due, bundledImages, reviewed, reviewedToday, coverage: cards.length ? Math.round((anchored / cards.length) * 100) : 0 }
}
