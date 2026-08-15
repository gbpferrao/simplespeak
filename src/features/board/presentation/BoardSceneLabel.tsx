import type { CSSProperties } from 'react'
import type { PersistedState, Scene } from '../../../core/contracts/types'
import { learningFor } from '../../../core/presentation/selectors'
import { starterPack } from '../../language-packs/data/starterPack'

interface BoardSceneLabelProps {
  scene: Scene
  state: PersistedState
}

export function BoardSceneLabel({ scene, state }: BoardSceneLabelProps) {
  const cards = starterPack.cards.filter((card) => card.sceneId === scene.id)
  const anchored = cards.filter((card) => learningFor(state, card.id).status === 'anchored').length
  const style = { left: scene.x, top: scene.y, width: scene.width, '--scene-accent': scene.accent } as CSSProperties
  return <><div className="scene-boundary" style={{ left: scene.x + 8, top: scene.y + 42, width: scene.width - 16, height: scene.height - 50, '--scene-accent': scene.accent } as CSSProperties} /><div className="scene-label" style={style} aria-label={`${scene.name} scene`}><span className="scene-label-accent" /><span className="scene-label-copy"><small>{scene.kicker}</small><strong>{scene.name}</strong></span><span className="scene-label-count">{anchored}/{cards.length}</span></div></>
}
