export type BoardRendererMode = 'konva' | 'pixi'

export const BOARD_RENDERER_QUERY = 'renderer'
export const DEFAULT_BOARD_RENDERER: BoardRendererMode = 'pixi'

export function requestedBoardRenderer(): BoardRendererMode {
  if (typeof window === 'undefined') return DEFAULT_BOARD_RENDERER

  const renderer = new URLSearchParams(window.location.search).get(BOARD_RENDERER_QUERY)
  return renderer === 'konva' ? 'konva' : DEFAULT_BOARD_RENDERER
}
