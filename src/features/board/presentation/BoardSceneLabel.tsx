import type { CSSProperties } from 'react'
import type { PersistedState, Scene } from '../../../core/contracts/types'
import { learningFor } from '../../../core/presentation/selectors'
import { starterPack } from '../../language-packs/data/starterPack'

interface BoardSceneLabelProps {
  scene: Scene
  state: PersistedState
  selected: boolean
  onSelect: () => void
}

export function BoardSceneLabel({ scene, state, selected, onSelect }: BoardSceneLabelProps) {
  const cards = starterPack.cards.filter((card) => card.sceneId === scene.id)
  const anchored = cards.filter((card) => learningFor(state, card.id).status === 'anchored').length
  const style = { left: scene.x, top: scene.y, width: scene.width, '--scene-accent': scene.accent } as CSSProperties
  return <><div className="scene-boundary" style={{ left: scene.x + 8, top: scene.y + 42, width: scene.width - 16, height: scene.height - 50, '--scene-accent': scene.accent } as CSSProperties} /><button className={`scene-label ${selected ? 'selected' : ''}`} type="button" onClick={onSelect} style={style} aria-label={`Select scene ${scene.name}`}><span className="scene-label-accent" /><span className="scene-label-copy"><small>{scene.kicker}</small><strong>{scene.name}</strong></span><span className="scene-label-count">{anchored}/{cards.length}</span></button></>
}
