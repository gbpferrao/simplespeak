import { useMemo, type RefObject } from 'react'
import Konva from 'konva/lib/Core'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import { Layer, Shape, Stage } from 'react-konva/lib/ReactKonvaCore'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { BoardCardNode } from './BoardCardNode'
import { BoardCardOverviewLayer } from './BoardCardOverview'
import { BoardSceneLabel } from './BoardSceneLabel'
import { boardImageResolution, CARD_OVERVIEW_ZOOM, CARD_SIZE, GROUP_LABEL_FADE_END, GROUP_LABEL_FADE_START, type BoardCamera } from './boardGeometry'

// Render the board at a denser backing resolution so the illustrations stay
// smooth while the camera downsamples them. Cap this at 2x: it is enough for
// the phone display without multiplying the large board's memory cost by 3x.
const BOARD_PIXEL_RATIO = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
Konva.pixelRatio = BOARD_PIXEL_RATIO

interface BoardCanvasProps {
  width: number
  height: number
  camera: BoardCamera
  stageRef: RefObject<KonvaStage | null>
  state: PersistedState
  cards: WordCard[]
  focusedCardId: string | null
  activeCardId: string | null
  runActive: boolean
  revealed: boolean
}

export function BoardCanvas({ width, height, camera, stageRef, state, cards, focusedCardId, activeCardId, runActive, revealed }: BoardCanvasProps) {
  const gridDots = useMemo(() => createGridDots(width, height, camera, cards), [width, height, camera, cards])
  const groupLabelOpacity = Math.max(0, Math.min(1, (GROUP_LABEL_FADE_START - camera.zoom) / (GROUP_LABEL_FADE_START - GROUP_LABEL_FADE_END)))
  const sceneLabelNodes = useMemo(() => starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} />), [])
  const sceneTitleNodes = useMemo(() => starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} showBackground={false} titleOpacity={groupLabelOpacity * 0.58} />), [groupLabelOpacity])
  const detailLevel = camera.zoom < CARD_OVERVIEW_ZOOM ? 'overview' : 'full'
  const cardOpacity = 0.94 - (groupLabelOpacity * 0.2)
  const importantCards = useMemo(() => cards.filter((card) => card.id === focusedCardId || card.id === activeCardId), [activeCardId, cards, focusedCardId])
  const backgroundCards = useMemo(() => cards.filter((card) => card.id !== focusedCardId && card.id !== activeCardId), [activeCardId, cards, focusedCardId])
  const backgroundImageResolution = boardImageResolution(camera.zoom, false)

  return (
    <Stage ref={stageRef} width={width} height={height} x={camera.x} y={camera.y} scaleX={camera.zoom} scaleY={camera.zoom} pixelRatio={BOARD_PIXEL_RATIO} listening={false}>
      <Layer listening={false} imageSmoothingEnabled>
        <Shape
          listening={false}
          sceneFunc={(context) => {
            context.fillStyle = '#aeb1b3'
            context.beginPath()
            for (const dot of gridDots) {
              context.moveTo(dot.x + dot.radius, dot.y)
              context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2)
            }
            context.fill()
          }}
          opacity={0.3}
        />
        {sceneLabelNodes}
      </Layer>
      <Layer listening={false} imageSmoothingEnabled>
        {detailLevel === 'overview' && <BoardCardOverviewLayer cards={backgroundCards} state={state} />}
        {detailLevel === 'full' && backgroundCards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={false} runMode={runActive} runActive={false} revealed={false} cardOpacity={cardOpacity} imageResolution={backgroundImageResolution} />)}
      </Layer>
      {/*
       * Keep emphasized Cards in their own top layer at every zoom level.
       * In particular, a Run normally focuses at >= 0.72, so rendering these
       * only in the overview branch makes the current Card disappear.
       */}
      <Layer listening={false} imageSmoothingEnabled>
        {importantCards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={focusedCardId === card.id} runMode={runActive} runActive={activeCardId === card.id} revealed={revealed && activeCardId === card.id} cardOpacity={1} imageResolution={boardImageResolution(camera.zoom, true)} />)}
      </Layer>
      <Layer listening={false} imageSmoothingEnabled>
        {sceneTitleNodes}
      </Layer>
    </Stage>
  )
}

function createGridDots(width: number, height: number, camera: BoardCamera, cards: WordCard[]) {
  if (width <= 0 || height <= 0) return []

  // Every zoom-out octave doubles world spacing, keeping the grid legible
  // without flooding a small screen with thousands of tiny points.
  const octave = Math.max(0, Math.min(6, Math.floor(Math.log2(1 / camera.zoom))))
  const spacing = 44 * 2 ** octave
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

  return dots.filter((dot) => !cards.some((card) => {
    const padding = dot.radius
    return dot.x + padding >= card.x
      && dot.x - padding <= card.x + CARD_SIZE
      && dot.y + padding >= card.y
      && dot.y - padding <= card.y + CARD_SIZE
  }))
}
