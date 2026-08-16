import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import { Focus } from 'lucide-react'
import type { PersistedState, ReviewOutcome } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { RunConfig, RunSession } from '../../study/domain/runSession'
import { BoardCanvas } from './BoardCanvas'
import { CARD_SIZE, MAX_ZOOM, MIN_ZOOM, type BoardCamera } from './boardGeometry'
import { BoardRunBar } from './BoardRunBar'
import { BoardRunOverlay } from '../../study/presentation/BoardRunOverlay'

const INITIAL_CAMERA: BoardCamera = { zoom: 0.63, x: -18, y: -10 }

interface BoardPointer {
  x: number
  y: number
  startX: number
  startY: number
  panEligible: boolean
  cardId: string | null
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

interface BoardViewProps {
  state: PersistedState
  stats: ProgressStats
  focusId: string | null
  setFocusId: (cardId: string | null) => void
  onSelectCard: (cardId: string) => void
  onStartRun: (config: RunConfig) => void
  runSession: RunSession | null
  onReveal: () => void
  onAnswer: (outcome: ReviewOutcome, revealed: boolean) => void
  onTypedChange: (value: string) => void
  onExitRun: () => void
}

export function BoardView({ state, stats, focusId, setFocusId, onSelectCard, onStartRun, runSession, onReveal, onAnswer, onTypedChange, onExitRun }: BoardViewProps) {
  const [camera, setCamera] = useState<BoardCamera>(INITIAL_CAMERA)
  const cameraRef = useRef<BoardCamera>(INITIAL_CAMERA)
  const stageRef = useRef<KonvaStage | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const stageCameraFrameRef = useRef<number | null>(null)
  const cameraCommitTimeoutRef = useRef<number | null>(null)
  const dragRef = useRef<PanGesture | null>(null)
  const pointersRef = useRef(new Map<number, BoardPointer>())
  const pinchRef = useRef<PinchGesture | null>(null)
  const movedRef = useRef(false)
  const lastActivationRef = useRef<{ cardId: string; at: number } | null>(null)
  const activeCardId = runSession?.cards[runSession.currentIndex]?.id ?? null
  const cameraFocusId = runSession ? activeCardId : focusId
  const filteredCards = starterPack.cards

  // Only mount cards near the viewport. The Stage remains one unified board;
  // this just avoids decoding and hit-testing distant cards on small phones.
  const canvasCards = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return filteredCards
    const padding = Math.max(180, Math.min(280, Math.max(viewportSize.width, viewportSize.height) / camera.zoom * 0.18))
    const left = -camera.x / camera.zoom - padding
    const top = -camera.y / camera.zoom - padding
    const right = (viewportSize.width - camera.x) / camera.zoom + padding
    const bottom = (viewportSize.height - camera.y) / camera.zoom + padding
    return filteredCards.filter((card) => card.id === cameraFocusId || (card.x + CARD_SIZE >= left && card.x <= right && card.y + CARD_SIZE >= top && card.y <= bottom))
  }, [camera, cameraFocusId, filteredCards, viewportSize])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const viewportElement = viewport

    function measure(): void {
      setViewportSize({ width: viewportElement.clientWidth, height: viewportElement.clientHeight })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewportElement)
    return () => observer.disconnect()
  }, [])

  function cancelCameraAnimation(): void {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  function applyCameraToStage(): void {
    const stage = stageRef.current
    if (!stage) return
    const nextCamera = cameraRef.current
    stage.position({ x: nextCamera.x, y: nextCamera.y })
    stage.scale({ x: nextCamera.zoom, y: nextCamera.zoom })
    stage.batchDraw()
  }

  function scheduleStageCameraFrame(): void {
    if (stageCameraFrameRef.current !== null) return
    stageCameraFrameRef.current = window.requestAnimationFrame(() => {
      stageCameraFrameRef.current = null
      applyCameraToStage()
    })
  }

  function cancelCameraCommit(): void {
    if (cameraCommitTimeoutRef.current === null) return
    window.clearTimeout(cameraCommitTimeoutRef.current)
    cameraCommitTimeoutRef.current = null
  }

  function commitCameraState(): void {
    cancelCameraCommit()
    const nextCamera = { ...cameraRef.current }
    setCamera((previous) => previous.zoom === nextCamera.zoom && previous.x === nextCamera.x && previous.y === nextCamera.y ? previous : nextCamera)
  }

  function scheduleCameraCommit(): void {
    if (cameraCommitTimeoutRef.current !== null) return
    cameraCommitTimeoutRef.current = window.setTimeout(() => {
      cameraCommitTimeoutRef.current = null
      commitCameraState()
    }, 120)
  }

  function updateCamera(nextZoom: number, nextOffset: { x: number; y: number }): void {
    cancelCameraAnimation()
    cameraRef.current = { zoom: nextZoom, x: nextOffset.x, y: nextOffset.y }
    scheduleStageCameraFrame()
    scheduleCameraCommit()
  }

  function animateCamera(nextZoom: number, nextOffset: { x: number; y: number }): void {
    cancelCameraAnimation()
    const from = cameraRef.current
    const startedAt = performance.now()
    const duration = 420

    function frame(now: number): void {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      cameraRef.current = {
        zoom: from.zoom + (nextZoom - from.zoom) * eased,
        x: from.x + (nextOffset.x - from.x) * eased,
        y: from.y + (nextOffset.y - from.y) * eased,
      }
      scheduleStageCameraFrame()
      if (progress < 1) animationFrameRef.current = window.requestAnimationFrame(frame)
      else {
        animationFrameRef.current = null
        commitCameraState()
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(frame)
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

  function cardAtPoint(clientX: number, clientY: number): string | null {
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!bounds) return null
    const worldX = (clientX - bounds.left - cameraRef.current.x) / cameraRef.current.zoom
    const worldY = (clientY - bounds.top - cameraRef.current.y) / cameraRef.current.zoom
    return filteredCards.find((card) => worldX >= card.x && worldX <= card.x + CARD_SIZE && worldY >= card.y && worldY <= card.y + CARD_SIZE)?.id ?? null
  }

  function focusCard(cardId: string | null): void {
    if (!cardId) return
    const card = starterPack.cards.find((candidate) => candidate.id === cardId)
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!card || !bounds) return
    const nextZoom = Math.max(0.72, cameraRef.current.zoom)
    animateCamera(nextZoom, { x: bounds.width / 2 - (card.x + CARD_SIZE / 2) * nextZoom, y: bounds.height / 2 - (card.y + CARD_SIZE / 2) * nextZoom })
  }

  useEffect(() => {
    if (cameraFocusId) focusCard(cameraFocusId)
    // This is an imperative camera command. Its current camera is read from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFocusId, runSession?.id])

  useEffect(() => () => {
    cancelCameraAnimation()
    cancelCameraCommit()
    if (stageCameraFrameRef.current !== null) window.cancelAnimationFrame(stageCameraFrameRef.current)
  }, [])

  function handleWheel(event: WheelEvent<HTMLDivElement>): void {
    event.preventDefault()
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!bounds) return
    const factor = event.deltaY > 0 ? 0.92 : 1.08
    const currentCamera = cameraRef.current
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentCamera.zoom * factor))
    const cursorX = event.clientX - bounds.left
    const cursorY = event.clientY - bounds.top
    updateCamera(nextZoom, { x: cursorX - (cursorX - currentCamera.x) * (nextZoom / currentCamera.zoom), y: cursorY - (cursorY - currentCamera.y) * (nextZoom / currentCamera.zoom) })
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    const cardId = cardAtPoint(event.clientX, event.clientY)
    // A pointer-down on an illustration is still a pan candidate. We decide
    // between pan and activation only after movement crosses the threshold.
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, panEligible: true, cardId })
    event.currentTarget.setPointerCapture(event.pointerId)
    movedRef.current = false
    if (pointersRef.current.size === 1) {
      dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: cameraRef.current.x, originY: cameraRef.current.y }
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
    const pointer = pointersRef.current.get(event.pointerId)
    const shouldActivate = Boolean(pointer?.cardId && !movedRef.current && pointersRef.current.size === 1)
    const activatedCardId = pointer?.cardId ?? null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    const remaining = Array.from(pointersRef.current.entries())[0]
    if (remaining) {
      const [pointerId, pointer] = remaining
      dragRef.current = pointer.panEligible ? { pointerId, startX: pointer.x, startY: pointer.y, originX: cameraRef.current.x, originY: cameraRef.current.y } : null
    } else {
      dragRef.current = null
      commitCameraState()
    }
    if (shouldActivate && activatedCardId) handleCardActivate(activatedCardId)
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>): void {
    movedRef.current = true
    handlePointerUp(event)
  }

  function handleCardActivate(cardId: string): void {
    if (movedRef.current) return
    const now = performance.now()
    if (lastActivationRef.current?.cardId === cardId && now - lastActivationRef.current.at < 300) return
    lastActivationRef.current = { cardId, at: now }
    if (!runSession) setFocusId(cardId)
    onSelectCard(cardId)
  }

  return (
    <section className="view board-view board-page" aria-label="SimpleSpeak board">
      <div className={`board-frame ${runSession ? 'is-run-active' : ''}`}>
        <div className="board-viewport" ref={viewportRef} onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}>
          <div className="board-canvas" role="application" aria-label="Interactive vocabulary board">
            <BoardCanvas width={Math.max(1, viewportSize.width)} height={Math.max(1, viewportSize.height)} camera={camera} stageRef={stageRef} state={state} cards={canvasCards} focusedCardId={cameraFocusId} activeCardId={activeCardId} runActive={Boolean(runSession)} revealed={runSession?.revealed === true} />
          </div>
        </div>
        {runSession && <button className="run-focus-button" type="button" onClick={() => focusCard(activeCardId)} aria-label="Focus current card" title="Focus current card"><Focus size={15} /></button>}
        {!runSession && <BoardRunBar state={state} stats={stats} onStartRun={onStartRun} />}
        {runSession && <BoardRunOverlay session={runSession} state={state} onReveal={onReveal} onAnswer={onAnswer} onTypedChange={onTypedChange} onOpenCard={onSelectCard} onExitRun={onExitRun} />}
      </div>
    </section>
  )
}
