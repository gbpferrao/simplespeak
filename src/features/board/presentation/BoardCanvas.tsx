import { useMemo } from 'react'
import { Layer, Line, Stage } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Line'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { starterPack } from '../../language-packs/data/starterPack'
import { BoardCardNode } from './BoardCardNode'
import { BoardSceneLabel } from './BoardSceneLabel'
import type { BoardCamera } from './boardGeometry'

interface BoardCanvasProps {
  width: number
  height: number
  camera: BoardCamera
  state: PersistedState
  cards: WordCard[]
  focusedCardId: string | null
  activeCardId: string | null
  runActive: boolean
  revealed: boolean
  sceneCardCounts: Map<string, number>
  sceneAnchoredCounts: Map<string, number>
  onCardActivate: (cardId: string) => void
}

export function BoardCanvas({ width, height, camera, state, cards, focusedCardId, activeCardId, runActive, revealed, sceneCardCounts, sceneAnchoredCounts, onCardActivate }: BoardCanvasProps) {
  const pathLines = useMemo(() => starterPathData().map(({ id, points }) => <Line key={id} points={points} stroke="#cbd8e7" strokeWidth={3} dash={[10, 16]} lineCap="round" listening={false} />), [])
  const sceneLabelNodes = useMemo(() => starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} anchoredCount={sceneAnchoredCounts.get(scene.id) ?? 0} cardCount={sceneCardCounts.get(scene.id) ?? 0} />), [sceneAnchoredCounts, sceneCardCounts])

  return (
    <Stage width={width} height={height} x={camera.x} y={camera.y} scaleX={camera.zoom} scaleY={camera.zoom}>
      <Layer listening={false}>
        {pathLines}
        {sceneLabelNodes}
      </Layer>
      <Layer>
        {cards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={focusedCardId === card.id} runMode={runActive} runActive={activeCardId === card.id} revealed={revealed && activeCardId === card.id} onActivate={onCardActivate} />)}
      </Layer>
    </Stage>
  )
}

function starterPathData() {
  return starterPack.scenes.slice(0, -1).map((scene, index) => {
    const next = starterPack.scenes[index + 1]
    return {
      id: `${scene.id}-${next.id}`,
      points: [scene.x + scene.width / 2, scene.y + scene.height / 2, next.x + next.width / 2, next.y + next.height / 2],
    }
  })
}
