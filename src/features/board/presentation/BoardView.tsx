import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import type { PersistedState, ReviewOutcome } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import { starterPack } from '../../language-packs/data/starterPack'
import type { RunConfig, RunSession } from '../../study/domain/runSession'
import { BoardCardNode } from './BoardCardNode'
import { BoardRunBar } from './BoardRunBar'
import { BoardSceneLabel } from './BoardSceneLabel'
import { CanvasToolbar } from './CanvasToolbar'
import { BoardRunOverlay } from '../../study/presentation/BoardRunOverlay'

const BOARD_WIDTH = 2600
const BOARD_HEIGHT = 1520
const CARD_WIDTH = 148
const CARD_HEIGHT = 170

interface BoardViewProps {
  state: PersistedState
  stats: ProgressStats
  search: string
  selectedSceneId: string | null
  setSelectedSceneId: (sceneId: string | null) => void
  focusId: string | null
  setFocusId: (cardId: string | null) => void
  onSelectCard: (cardId: string) => void
  onStartRun: (config: RunConfig) => void
  onOpenRun: () => void
  runSession: RunSession | null
  onReveal: () => void
  onAnswer: (outcome: ReviewOutcome, revealed: boolean) => void
  onTypedChange: (value: string) => void
  onExitRun: () => void
}

export function BoardView({ state, stats, search, selectedSceneId, setSelectedSceneId, focusId, setFocusId, onSelectCard, onStartRun, onOpenRun, runSession, onReveal, onAnswer, onTypedChange, onExitRun }: BoardViewProps) {
  const [zoom, setZoom] = useState(0.63)
  const [offset, setOffset] = useState({ x: -18, y: -10 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const movedRef = useRef(false)
  const activeCardId = runSession?.cards[runSession.currentIndex]?.id ?? null
  const cameraFocusId = runSession ? activeCardId : focusId
  const runCardIds = useMemo(() => new Set(runSession?.cards.map((card) => card.id) ?? []), [runSession])

  const visibleCards = useMemo(() => starterPack.cards.filter((card) => {
    const query = search.trim().toLocaleLowerCase()
    if (runSession && runCardIds.has(card.id)) return true
    const sceneMatch = selectedSceneId ? card.sceneId === selectedSceneId : true
    if (!query) return sceneMatch
    return sceneMatch && `${card.target} ${card.origin} ${card.exampleTarget}`.toLocaleLowerCase().includes(query)
  }), [runCardIds, runSession, search, selectedSceneId])

  function focusCard(cardId: string | null): void {
    if (!cardId) return
    const card = starterPack.cards.find((candidate) => candidate.id === cardId)
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!card || !bounds) return
    const nextZoom = Math.max(0.72, zoom)
    setZoom(nextZoom)
    setOffset({ x: bounds.width / 2 - (card.x + CARD_WIDTH / 2) * nextZoom, y: bounds.height / 2 - (card.y + CARD_HEIGHT / 2) * nextZoom })
  }

  useEffect(() => {
    if (cameraFocusId) focusCard(cameraFocusId)
    // This effect is an imperative camera command. Zoom is intentionally captured
    // when the focus target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFocusId, runSession?.id])

  function handleWheel(event: WheelEvent<HTMLDivElement>): void {
    event.preventDefault()
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!bounds) return
    const factor = event.deltaY > 0 ? 0.92 : 1.08
    const nextZoom = Math.max(0.38, Math.min(1.25, zoom * factor))
    const cursorX = event.clientX - bounds.left
    const cursorY = event.clientY - bounds.top
    setOffset({ x: cursorX - (cursorX - offset.x) * (nextZoom / zoom), y: cursorY - (cursorY - offset.y) * (nextZoom / zoom) })
    setZoom(nextZoom)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    const target = event.target as HTMLElement
    if (target.closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    movedRef.current = false
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: offset.x, originY: offset.y }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true
    setOffset({ x: drag.originX + dx, y: drag.originY + dy })
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
  }

  function resetOverview(): void {
    if (runSession && activeCardId) {
      focusCard(activeCardId)
      return
    }
    setZoom(0.63)
    setOffset({ x: -18, y: -10 })
    setFocusId(null)
  }

  return (
    <section className="view board-view board-page" aria-label="SimpleSpeak board">
      <div className={`board-frame ${runSession ? 'is-run-active' : ''}`}>
        <div className="board-viewport" ref={viewportRef} onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            <div className="board-stage" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
              <svg className="board-paths" width={BOARD_WIDTH} height={BOARD_HEIGHT} viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} aria-hidden="true">{starterPack.scenes.slice(0, -1).map((scene, index) => { const next = starterPack.scenes[index + 1]; return <line key={`${scene.id}-${next.id}`} x1={scene.x + scene.width / 2} y1={scene.y + scene.height / 2} x2={next.x + next.width / 2} y2={next.y + next.height / 2} /> })}</svg>
              {starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} state={state} selected={selectedSceneId === scene.id} onSelect={() => setSelectedSceneId(scene.id)} />)}
              {visibleCards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={cameraFocusId === card.id} runActive={runSession ? activeCardId === card.id : false} revealed={runSession?.revealed === true && activeCardId === card.id} onClick={() => { if (movedRef.current) { movedRef.current = false; return } if (!runSession) setFocusId(card.id); onSelectCard(card.id) }} />)}
            </div>
          <div className="board-help"><span>Drag to move</span><span>Scroll to zoom</span><span>{runSession ? 'Focused Card is the prompt' : 'Tap a Card to open it'}</span></div>
        </div>
        <CanvasToolbar selectedSceneId={selectedSceneId} setSelectedSceneId={setSelectedSceneId} visibleCount={visibleCards.length} zoom={zoom} onZoomOut={() => setZoom((current) => Math.max(0.38, current - 0.08))} onZoomIn={() => setZoom((current) => Math.min(1.25, current + 0.08))} onFocus={() => focusCard(cameraFocusId ?? visibleCards[0]?.id ?? null)} onOverview={resetOverview} />
        {runSession ? <BoardRunOverlay session={runSession} state={state} onReveal={onReveal} onAnswer={onAnswer} onTypedChange={onTypedChange} onOpenCard={onSelectCard} onExitRun={onExitRun} /> : <BoardRunBar state={state} stats={stats} selectedSceneId={selectedSceneId} onStartRun={onStartRun} onOpenRun={onOpenRun} />}
      </div>
    </section>
  )
}
