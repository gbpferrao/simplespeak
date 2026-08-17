import type { WordCard } from '../../../core/contracts/types'
import { CARD_SIZE, MAX_ZOOM, MIN_ZOOM, type BoardCamera } from '../presentation/boardGeometry'

export interface BoardViewport {
  width: number
  height: number
}

export const BOARD_FIT_PADDING_PX = 24

/**
 * Return a camera that contains every Card's world-space rectangle in the
 * measured viewport. This is intentionally pure so the initial framing does
 * not depend on Konva or on image load timing.
 */
export function fitBoardCamera(cards: WordCard[], viewport: BoardViewport, paddingPx = BOARD_FIT_PADDING_PX): BoardCamera {
  if (cards.length === 0 || viewport.width <= 0 || viewport.height <= 0) {
    return { zoom: MIN_ZOOM, x: 0, y: 0 }
  }

  const minX = Math.min(...cards.map((card) => card.x))
  const minY = Math.min(...cards.map((card) => card.y))
  const maxX = Math.max(...cards.map((card) => card.x + CARD_SIZE))
  const maxY = Math.max(...cards.map((card) => card.y + CARD_SIZE))
  const contentWidth = Math.max(CARD_SIZE, maxX - minX)
  const contentHeight = Math.max(CARD_SIZE, maxY - minY)
  const usableWidth = Math.max(1, viewport.width - paddingPx * 2)
  const usableHeight = Math.max(1, viewport.height - paddingPx * 2)
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(usableWidth / contentWidth, usableHeight / contentHeight)))
  const contentCenterX = minX + contentWidth / 2
  const contentCenterY = minY + contentHeight / 2

  return {
    zoom,
    x: viewport.width / 2 - contentCenterX * zoom,
    y: viewport.height / 2 - contentCenterY * zoom,
  }
}
