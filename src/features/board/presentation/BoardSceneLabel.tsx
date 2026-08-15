import { memo, type CSSProperties } from 'react'
import type { Scene } from '../../../core/contracts/types'

interface BoardSceneLabelProps {
  scene: Scene
  anchoredCount: number
  cardCount: number
}

export const BoardSceneLabel = memo(function BoardSceneLabel({ scene, anchoredCount, cardCount }: BoardSceneLabelProps) {
  const style = { left: scene.x, top: scene.y, width: scene.width, '--scene-accent': scene.accent } as CSSProperties
  return <><div className="scene-boundary" style={{ left: scene.x + 8, top: scene.y + 42, width: scene.width - 16, height: scene.height - 50, '--scene-accent': scene.accent } as CSSProperties} /><div className="scene-label" style={style} aria-label={`${scene.name} scene`}><span className="scene-label-accent" /><span className="scene-label-copy"><small>{scene.kicker}</small><strong>{scene.name}</strong></span><span className="scene-label-count">{anchoredCount}/{cardCount}</span></div></>
})
