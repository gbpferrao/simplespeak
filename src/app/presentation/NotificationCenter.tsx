import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useRef, useState, type PointerEvent } from 'react'
import type { AppNotification, NotificationTone } from '../notifications'

interface NotificationCenterProps {
  notifications: AppNotification[]
  label: string
  dismissLabel: string
  onDismiss: (id: string) => void
}

interface SwipeState {
  id: string
  startX: number
  offsetX: number
}

const SWIPE_DISTANCE = 72

function toneIcon(tone: NotificationTone) {
  if (tone === 'warning') return <AlertCircle size={17} aria-hidden="true" />
  if (tone === 'info') return <Info size={17} aria-hidden="true" />
  return <CheckCircle2 size={17} aria-hidden="true" />
}

export function NotificationCenter({ notifications, label, dismissLabel, onDismiss }: NotificationCenterProps) {
  const [swipe, setSwipe] = useState<SwipeState | null>(null)
  const swipeRef = useRef<SwipeState | null>(null)

  function startSwipe(event: PointerEvent<HTMLDivElement>, id: string): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const next = { id, startX: event.clientX, offsetX: 0 }
    swipeRef.current = next
    setSwipe(next)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveSwipe(event: PointerEvent<HTMLDivElement>, id: string): void {
    const current = swipeRef.current
    if (!current || current.id !== id) return
    const next = { ...current, offsetX: event.clientX - current.startX }
    swipeRef.current = next
    setSwipe(next)
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>, id: string): void {
    const current = swipeRef.current
    if (!current || current.id !== id) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    swipeRef.current = null
    setSwipe(null)
    if (Math.abs(current.offsetX) >= SWIPE_DISTANCE) onDismiss(id)
  }

  function cancelSwipe(event: PointerEvent<HTMLDivElement>, id: string): void {
    if (swipeRef.current?.id !== id) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    swipeRef.current = null
    setSwipe(null)
  }

  if (notifications.length === 0) return null

  return <aside className="notification-center" aria-label={label}>
    {notifications.map((notification) => {
      const offsetX = swipe?.id === notification.id ? swipe.offsetX : 0
      return <div
        className={`notification-card notification-${notification.tone}`}
        data-notification-id={notification.id}
        key={notification.id}
        role="status"
        aria-live="polite"
        onPointerDown={(event) => startSwipe(event, notification.id)}
        onPointerMove={(event) => moveSwipe(event, notification.id)}
        onPointerUp={(event) => finishSwipe(event, notification.id)}
        onPointerCancel={(event) => cancelSwipe(event, notification.id)}
        style={{ transform: `translateX(${offsetX}px)`, opacity: Math.max(.35, 1 - Math.abs(offsetX) / 220) }}
      >
        <span className="notification-icon">{toneIcon(notification.tone)}</span>
        <span className="notification-message">{notification.message}</span>
        <button
          className="notification-dismiss"
          type="button"
          aria-label={dismissLabel}
          title={dismissLabel}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDismiss(notification.id)}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    })}
  </aside>
}
