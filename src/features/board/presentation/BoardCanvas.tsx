import { useMemo, type RefObject } from 'react'
import Konva from 'konva/lib/Core'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import { Layer, Stage } from 'react-konva/lib/ReactKonvaCore'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { BoardCardNode } from './BoardCardNode'
import { BoardCardOverviewLayer } from './BoardCardOverview'
import { BoardSceneLabel } from './BoardSceneLabel'
import { CARD_OVERVIEW_ZOOM, GROUP_LABEL_FADE_END, GROUP_LABEL_FADE_START, type BoardCamera } from './boardGeometry'

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
  const groupLabelOpacity = Math.max(0, Math.min(1, (GROUP_LABEL_FADE_START - camera.zoom) / (GROUP_LABEL_FADE_START - GROUP_LABEL_FADE_END)))
  const sceneLabelNodes = useMemo(() => starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} />), [])
  const sceneTitleNodes = useMemo(() => starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} showBackground={false} titleOpacity={groupLabelOpacity * 0.58} />), [groupLabelOpacity])
  const detailLevel = camera.zoom < CARD_OVERVIEW_ZOOM ? 'overview' : 'full'
  const cardOpacity = 0.94 - (groupLabelOpacity * 0.2)
  const importantCards = useMemo(() => cards.filter((card) => card.id === focusedCardId || card.id === activeCardId), [activeCardId, cards, focusedCardId])
  const backgroundCards = useMemo(() => cards.filter((card) => card.id !== focusedCardId && card.id !== activeCardId), [activeCardId, cards, focusedCardId])

  return (
    <Stage ref={stageRef} width={width} height={height} x={camera.x} y={camera.y} scaleX={camera.zoom} scaleY={camera.zoom} pixelRatio={BOARD_PIXEL_RATIO} listening={false}>
      <Layer listening={false} imageSmoothingEnabled>
        {sceneLabelNodes}
      </Layer>
      <Layer listening={false} imageSmoothingEnabled>
        {detailLevel === 'overview' && <BoardCardOverviewLayer cards={backgroundCards} state={state} />}
        {detailLevel === 'full' && backgroundCards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={false} runMode={runActive} runActive={false} revealed={false} cardOpacity={cardOpacity} />)}
      </Layer>
      {/*
       * Keep emphasized Cards in their own top layer at every zoom level.
       * In particular, a Run normally focuses at >= 0.72, so rendering these
       * only in the overview branch makes the current Card disappear.
      */}
      <Layer listening={false} imageSmoothingEnabled>
        {importantCards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={focusedCardId === card.id} runMode={runActive} runActive={activeCardId === card.id} revealed={revealed && activeCardId === card.id} cardOpacity={1} />)}
      </Layer>
      <Layer listening={false} imageSmoothingEnabled>
        {sceneTitleNodes}
      </Layer>
    </Stage>
  )
}
