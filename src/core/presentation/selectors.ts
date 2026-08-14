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
