export const BOARD_WIDTH = 2600
export const BOARD_HEIGHT = 1520
export const CARD_SIZE = 148
export const MIN_ZOOM = 0.03
export const MAX_ZOOM = 1.25
export const CARD_DETAIL_ZOOM = 0.24
// Keep the actual illustrations visible until the board is deeply zoomed out.
// Only the narrow range near MIN_ZOOM uses lightweight overview markers.
export const CARD_OVERVIEW_ZOOM = 0.045
// Scene titles become useful once several cards can be seen together, but
// remain hidden while the user is close enough to study individual cards.
export const GROUP_LABEL_FADE_START = 0.2
export const GROUP_LABEL_FADE_END = 0.07

export type BoardImageResolution = 'full' | 'medium' | 'thumb'

/**
 * Choose an asset close to the size the phone will actually draw. The world
 * Card stays 148px, so a 320px source is still comfortably sharp at medium
 * zoom while avoiding decoding the 1254px source for every visible Card.
 */
export function boardImageResolution(zoom: number, emphasized: boolean): BoardImageResolution {
  if (emphasized || zoom >= 0.42) return 'full'
  if (zoom >= 0.12) return 'medium'
  return 'thumb'
}

export interface BoardCamera {
  zoom: number
  x: number
  y: number
}
