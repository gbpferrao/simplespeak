import type { LearningState, RunPreset, WordCard } from '../../../core/contracts/types'
import { createEmptyLearning } from '../../../core/persistence/localStateRepository'
import { isDue, retrievability } from './scheduler'

export function selectCardsForRun(
  cards: WordCard[],
  learning: Record<string, LearningState>,
  preset: RunPreset,
  sceneId: string | null,
  limit: number,
): WordCard[] {
  const now = Date.now()
  const scoped = sceneId && (preset === 'scene' || preset === 'custom') ? cards.filter((card) => card.sceneId === sceneId) : cards
  const ranked = [...scoped].sort((left, right) => {
    const leftState = learning[left.id] ?? createEmptyLearning()
    const rightState = learning[right.id] ?? createEmptyLearning()
    const leftRetrieval = retrievability(leftState, now)
    const rightRetrieval = retrievability(rightState, now)
    const leftScore = (isDue(leftState, now) ? 2 : 0) + (1 - leftRetrieval) + 1 / (leftState.stabilityDays + 1)
    const rightScore = (isDue(rightState, now) ? 2 : 0) + (1 - rightRetrieval) + 1 / (rightState.stabilityDays + 1)
    return rightScore - leftScore || left.target.localeCompare(right.target)
  })
  if (preset === 'due-nearby') {
    const due = ranked.filter((card) => isDue(learning[card.id] ?? createEmptyLearning(), now))
    const nearby = ranked.filter((card) => !due.some((dueCard) => dueCard.id === card.id))
    return [...due, ...nearby].slice(0, limit)
  }
  return ranked.slice(0, limit)
}
