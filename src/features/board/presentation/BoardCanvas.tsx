import { useMemo } from 'react'
import { Circle, Layer, Stage } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Circle'
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
  const gridDots = useMemo(() => createGridDots(width, height, camera), [width, height, camera])
  const sceneLabelNodes = useMemo(() => starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} anchoredCount={sceneAnchoredCounts.get(scene.id) ?? 0} cardCount={sceneCardCounts.get(scene.id) ?? 0} />), [sceneAnchoredCounts, sceneCardCounts])

  return (
    <Stage width={width} height={height} x={camera.x} y={camera.y} scaleX={camera.zoom} scaleY={camera.zoom}>
      <Layer listening={false}>
        {gridDots.map(({ x, y, radius }) => <Circle key={`${x}-${y}`} x={x} y={y} radius={radius} fill="#c9ced6" opacity={0.72} />)}
        {sceneLabelNodes}
      </Layer>
      <Layer>
        {cards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={focusedCardId === card.id} runMode={runActive} runActive={activeCardId === card.id} revealed={revealed && activeCardId === card.id} onActivate={onCardActivate} />)}
      </Layer>
    </Stage>
  )
}

function createGridDots(width: number, height: number, camera: BoardCamera) {
  if (width <= 0 || height <= 0) return []

  // Every zoom-out octave doubles world spacing, keeping the grid legible
  // without flooding a small screen with thousands of tiny points.
  const octave = Math.max(0, Math.min(4, Math.floor(Math.log2(1 / camera.zoom))))
  const spacing = 48 * 2 ** octave
  const radius = 1.35 / camera.zoom
  const left = Math.floor((-camera.x / camera.zoom) / spacing) - 1
  const right = Math.ceil(((width - camera.x) / camera.zoom) / spacing) + 1
  const top = Math.floor((-camera.y / camera.zoom) / spacing) - 1
  const bottom = Math.ceil(((height - camera.y) / camera.zoom) / spacing) + 1
  const dots: Array<{ x: number; y: number; radius: number }> = []

  for (let column = left; column <= right; column += 1) {
    for (let row = top; row <= bottom; row += 1) {
      dots.push({ x: column * spacing, y: row * spacing, radius })
    }
  }

  return dots
}
