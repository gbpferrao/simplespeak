import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { Focus } from 'lucide-react'
import type { PersistedState, ReviewOutcome } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import { starterPack } from '../../language-packs/data/starterPack'
import type { RunConfig, RunSession } from '../../study/domain/runSession'
import { BoardCardNode } from './BoardCardNode'
import { BoardRunBar } from './BoardRunBar'
import { BoardSceneLabel } from './BoardSceneLabel'
import { BoardRunOverlay } from '../../study/presentation/BoardRunOverlay'

const BOARD_WIDTH = 2600
const BOARD_HEIGHT = 1520
const CARD_WIDTH = 148
const CARD_HEIGHT = 148
const MIN_ZOOM = 0.12
const MAX_ZOOM = 1.25
const SCENE_CARD_COUNTS = new Map(starterPack.scenes.map((scene) => [scene.id, starterPack.cards.filter((card) => card.sceneId === scene.id).length]))

interface BoardPointer {
  x: number
  y: number
  startX: number
  startY: number
  panEligible: boolean
}

interface PanGesture {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

interface PinchGesture {
  startDistance: number
  startZoom: number
  anchorX: number
  anchorY: number
}

interface BoardCamera {
  zoom: number
  x: number
  y: number
}

interface BoardViewProps {
  state: PersistedState
  stats: ProgressStats
  search: string
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

export function BoardView({ state, stats, search, focusId, setFocusId, onSelectCard, onStartRun, onOpenRun, runSession, onReveal, onAnswer, onTypedChange, onExitRun }: BoardViewProps) {
  const [camera, setCamera] = useState<BoardCamera>({ zoom: 0.63, x: -18, y: -10 })
  const cameraRef = useRef<BoardCamera>({ zoom: 0.63, x: -18, y: -10 })
  const [cameraAnimating, setCameraAnimating] = useState(false)
  const cameraAnimatingRef = useRef(false)
  const cameraAnimationRef = useRef<number | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<PanGesture | null>(null)
  const pointersRef = useRef(new Map<number, BoardPointer>())
  const pinchRef = useRef<PinchGesture | null>(null)
  const movedRef = useRef(false)
  const activeCardId = runSession?.cards[runSession.currentIndex]?.id ?? null
  const cameraFocusId = runSession ? activeCardId : focusId
  const runCards = runSession?.cards ?? null
  const runCardIds = useMemo(() => new Set(runCards?.map((card) => card.id) ?? []), [runCards])
  const learningState = state.learning
  const sceneAnchoredCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const card of starterPack.cards) {
      if (learningState[card.id]?.status !== 'anchored') continue
      counts.set(card.sceneId, (counts.get(card.sceneId) ?? 0) + 1)
    }
    return counts
  }, [learningState])

  const visibleCards = useMemo(() => starterPack.cards.filter((card) => {
    const query = search.trim().toLocaleLowerCase()
    if (runCardIds.has(card.id)) return true
    if (!query) return true
    return `${card.target} ${card.origin} ${card.exampleTarget}`.toLocaleLowerCase().includes(query)
  }), [runCardIds, search])

  function updateCamera(nextZoom: number, nextOffset: { x: number; y: number }, animate = false): void {
    if (cameraAnimationRef.current !== null) {
      window.clearTimeout(cameraAnimationRef.current)
      cameraAnimationRef.current = null
    }
    if (animate) {
      if (!cameraAnimatingRef.current) {
        cameraAnimatingRef.current = true
        setCameraAnimating(true)
      }
      cameraAnimationRef.current = window.setTimeout(() => {
        cameraAnimationRef.current = null
        cameraAnimatingRef.current = false
        setCameraAnimating(false)
      }, 420)
    } else if (cameraAnimatingRef.current) {
      cameraAnimatingRef.current = false
      setCameraAnimating(false)
    }
    const nextCamera = { zoom: nextZoom, x: nextOffset.x, y: nextOffset.y }
    cameraRef.current = nextCamera
    setCamera(nextCamera)
  }

  function pointerPair(): [BoardPointer, BoardPointer] | null {
    const points = Array.from(pointersRef.current.values())
    return points.length >= 2 ? [points[0], points[1]] : null
  }

  function pointerDistance([first, second]: [BoardPointer, BoardPointer]): number {
    return Math.hypot(second.x - first.x, second.y - first.y)
  }

  function pointerCenter([first, second]: [BoardPointer, BoardPointer]): { x: number; y: number } {
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!bounds) return { x: 0, y: 0 }
    return { x: (first.x + second.x) / 2 - bounds.left, y: (first.y + second.y) / 2 - bounds.top }
  }

  function focusCard(cardId: string | null): void {
    if (!cardId) return
    const card = starterPack.cards.find((candidate) => candidate.id === cardId)
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!card || !bounds) return
    const nextZoom = Math.max(0.72, cameraRef.current.zoom)
    updateCamera(nextZoom, { x: bounds.width / 2 - (card.x + CARD_WIDTH / 2) * nextZoom, y: bounds.height / 2 - (card.y + CARD_HEIGHT / 2) * nextZoom }, true)
  }

  useEffect(() => {
    if (cameraFocusId) focusCard(cameraFocusId)
    // This effect is an imperative camera command. Zoom is intentionally captured
    // when the focus target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFocusId, runSession?.id])

  useEffect(() => () => {
    if (cameraAnimationRef.current !== null) window.clearTimeout(cameraAnimationRef.current)
    cameraAnimatingRef.current = false
  }, [])

  function handleWheel(event: WheelEvent<HTMLDivElement>): void {
    event.preventDefault()
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!bounds) return
    const factor = event.deltaY > 0 ? 0.92 : 1.08
    const currentZoom = cameraRef.current.zoom
    const currentOffset = cameraRef.current
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * factor))
    const cursorX = event.clientX - bounds.left
    const cursorY = event.clientY - bounds.top
    updateCamera(nextZoom, { x: cursorX - (cursorX - currentOffset.x) * (nextZoom / currentZoom), y: cursorY - (cursorY - currentOffset.y) * (nextZoom / currentZoom) })
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    const target = event.target as HTMLElement
    const isInteractive = Boolean(target.closest('button, input, select, textarea'))
    if (isInteractive && event.pointerType !== 'touch') return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, panEligible: !isInteractive })
    event.currentTarget.setPointerCapture(event.pointerId)
    movedRef.current = false
    if (pointersRef.current.size === 1) {
      dragRef.current = isInteractive ? null : { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: cameraRef.current.x, originY: cameraRef.current.y }
      return
    }
    if (pointersRef.current.size >= 2) {
      const pair = pointerPair()
      const distance = pair ? pointerDistance(pair) : 0
      const center = pair ? pointerCenter(pair) : { x: 0, y: 0 }
      const currentZoom = cameraRef.current.zoom
      if (pair && distance > 0) pinchRef.current = { startDistance: distance, startZoom: currentZoom, anchorX: (center.x - cameraRef.current.x) / currentZoom, anchorY: (center.y - cameraRef.current.y) / currentZoom }
      dragRef.current = null
      movedRef.current = true
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const pointer = pointersRef.current.get(event.pointerId)
    if (!pointer) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    if (pinchRef.current && pointersRef.current.size >= 2) {
      const pair = pointerPair()
      if (!pair || !viewportRef.current) return
      const center = pointerCenter(pair)
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.startZoom * (pointerDistance(pair) / pinchRef.current.startDistance)))
      updateCamera(nextZoom, { x: center.x - pinchRef.current.anchorX * nextZoom, y: center.y - pinchRef.current.anchorY * nextZoom })
      movedRef.current = true
      return
    }
    const drag = dragRef.current
    if (!drag || pointersRef.current.size !== 1 || drag.pointerId !== event.pointerId) {
      if (Math.abs(event.clientX - pointer.startX) + Math.abs(event.clientY - pointer.startY) > 4) movedRef.current = true
      return
    }
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true
    updateCamera(cameraRef.current.zoom, { x: drag.originX + dx, y: drag.originY + dy })
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    const remaining = Array.from(pointersRef.current.entries())[0]
    if (remaining) {
      const [pointerId, pointer] = remaining
      dragRef.current = pointer.panEligible ? { pointerId, startX: pointer.x, startY: pointer.y, originX: cameraRef.current.x, originY: cameraRef.current.y } : null
    } else {
      dragRef.current = null
    }
  }

  return (
    <section className="view board-view board-page" aria-label="SimpleSpeak board">
      <div className={`board-frame ${runSession ? 'is-run-active' : ''}`}>
        <div className="board-viewport" ref={viewportRef} onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            <div className={`board-stage ${cameraAnimating ? 'is-camera-animating' : ''}`} style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})` }}>
              <svg className="board-paths" width={BOARD_WIDTH} height={BOARD_HEIGHT} viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} aria-hidden="true">{starterPack.scenes.slice(0, -1).map((scene, index) => { const next = starterPack.scenes[index + 1]; return <line key={`${scene.id}-${next.id}`} x1={scene.x + scene.width / 2} y1={scene.y + scene.height / 2} x2={next.x + next.width / 2} y2={next.y + next.height / 2} /> })}</svg>
              {starterPack.scenes.map((scene) => <BoardSceneLabel key={scene.id} scene={scene} anchoredCount={sceneAnchoredCounts.get(scene.id) ?? 0} cardCount={SCENE_CARD_COUNTS.get(scene.id) ?? 0} />)}
              {visibleCards.map((card) => <BoardCardNode key={card.id} card={card} state={state} focused={cameraFocusId === card.id} runMode={Boolean(runSession)} runActive={runSession ? activeCardId === card.id : false} revealed={runSession?.revealed === true && activeCardId === card.id} onClick={() => { if (movedRef.current) { movedRef.current = false; return } if (!runSession) setFocusId(card.id); onSelectCard(card.id) }} />)}
            </div>
          <div className="board-help"><span>Drag to move</span><span>Scroll or pinch to zoom</span><span>{runSession ? 'Focused Card is the prompt' : 'Tap a Card to open it'}</span></div>
        </div>
        {runSession && <button className="run-focus-button" type="button" onClick={() => focusCard(activeCardId)} aria-label="Focus current card" title="Focus current card"><Focus size={15} /></button>}
        {runSession ? <BoardRunOverlay session={runSession} state={state} onReveal={onReveal} onAnswer={onAnswer} onTypedChange={onTypedChange} onOpenCard={onSelectCard} onExitRun={onExitRun} /> : <BoardRunBar state={state} stats={stats} onStartRun={onStartRun} onOpenRun={onOpenRun} />}
      </div>
    </section>
  )
}
