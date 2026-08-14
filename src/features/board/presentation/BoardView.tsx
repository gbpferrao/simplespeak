import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { Compass } from 'lucide-react'
import type { PersistedState } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import { starterPack } from '../../language-packs/data/starterPack'
import type { RunConfig } from '../../study/domain/runSession'
import { BoardCardNode } from './BoardCardNode'
import { BoardRunBar } from './BoardRunBar'
import { BoardSceneLabel } from './BoardSceneLabel'
import { CanvasToolbar } from './CanvasToolbar'

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
}

export function BoardView({ state, stats, search, selectedSceneId, setSelectedSceneId, focusId, setFocusId, onSelectCard, onStartRun, onOpenRun }: BoardViewProps) {
  const [zoom, setZoom] = useState(0.63)
  const [offset, setOffset] = useState({ x: -18, y: -10 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const movedRef = useRef(false)

  const visibleCards = useMemo(() => starterPack.cards.filter((card) => {
    const query = search.trim().toLocaleLowerCase()
    const sceneMatch = selectedSceneId ? card.sceneId === selectedSceneId : true
    if (!query) return sceneMatch
    return sceneMatch && `${card.target} ${card.origin} ${card.exampleTarget}`.toLocaleLowerCase().includes(query)
  }), [search, selectedSceneId])

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
    if (focusId) focusCard(focusId)
    // This effect is an imperative camera command. Zoom is intentionally captured
    // when the focus target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

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
    setZoom(0.63)
    setOffset({ x: -18, y: -10 })
    setFocusId(null)
  }

  return (
    <section className="view board-view canvas-page">
      <div className="canvas-topline">
        <div className="canvas-context"><span className="eyebrow"><Compass size={14} /> Atlas workspace</span><strong>English foundations</strong><span>English to Portugues (BR)</span></div>
        <div className="canvas-summary"><span>{stats.reviewed}/{stats.total} touched</span><span>{stats.generated} visuals</span><span>{stats.due} due</span></div>
      </div>
      <div className="board-shell">
        <div className="board-frame">
          <CanvasToolbar selectedSceneId={selectedSceneId} setSelectedSceneId={setSelectedSceneId} visibleCount={visibleCards.length} zoom={zoom} onZoomOut={() => setZoom((current) => Math.max(0.38, current - 0.08))} onZoomIn={() => setZoom((current) => Math.min(1.25, current + 0.08))} onFocus={() => focusCard(focusId ?? visibleCards[0]?.id ?? null)} onOverview={resetOverview} />
          <div className="board-viewport" ref={viewportRef} onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            <div className="board-stage" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
              <svg className="atlas-paths" width={BOARD_WIDTH} height={BOARD_HEIGHT} viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} aria-hidden="true">{starterPack.scenes.slice(0, -1).map((scene, index) => { const next = starterPack.scenes[index + 1]; return <line key={`${scene.id}-${next.id}`} x1={scene.x + scene.width / 2} y1={scene.y + scene.height / 2} x2={next.x + next.width / 2} y2={next.y + next.height / 2} /> })}</svg>
              {starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} state={state} selected={selectedSceneId === scene.id} onSelect={() => setSelectedSceneId(scene.id)} />)}
              {visibleCards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={focusId === card.id} onClick={() => { if (movedRef.current) { movedRef.current = false; return } setFocusId(card.id); onSelectCard(card.id) }} />)}
            </div>
            <div className="board-help"><span>Drag to move</span><span>Scroll to zoom</span><span>Tap a Card to open it</span></div>
          </div>
        </div>
      </div>
      <BoardRunBar state={state} stats={stats} selectedSceneId={selectedSceneId} onStartRun={onStartRun} onOpenRun={onOpenRun} />
    </section>
  )
}
