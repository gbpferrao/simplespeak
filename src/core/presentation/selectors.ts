import type { LearningState, PersistedState, Scene, WordCard } from '../contracts/types'
import { createEmptyLearning } from '../persistence/localStateRepository'

export function learningFor(state: PersistedState, cardId: string): LearningState {
  return state.learning[cardId] ?? createEmptyLearning()
}

export function sceneFor(scenes: Scene[], sceneId: string | null): Scene | null {
  return scenes.find((scene) => scene.id === sceneId) ?? null
}

export function cardFor(cards: WordCard[], cardId: string | null): WordCard | null {
  return cards.find((card) => card.id === cardId) ?? null
}

/**
 * The current Pack owns the native asset path for a Card. Older local state
 * may still contain a stale path or an older retained image, so Pack assets
 * take precedence whenever the current Card declares one.
 */
export function imageFor(state: PersistedState, card: WordCard): string | undefined {
  return card.imagePath ?? state.images[card.id]
}
