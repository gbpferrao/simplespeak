import { memo, useMemo } from 'react'
import { Circle, Group, Shape } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Circle'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { CARD_SIZE } from './boardGeometry'

const sceneColors = new Map(starterPack.scenes.map((scene) => [scene.id, scene.accent]))
const statusColors: Record<string, string> = {
  new: '#c9cdd9',
  emerging: '#e8c15e',
  familiar: '#8fb7ed',
  anchored: '#86cda7',
}

interface BoardCardOverviewNodeProps {
  card: WordCard
  state: PersistedState
}

/**
 * A single low-detail illustration marker used while the board is zoomed out
 * enough that the source image is no longer legible. It has no card surface.
 */
function BoardCardOverviewNodeBase({ card, state }: BoardCardOverviewNodeProps) {
  const sceneColor = sceneColors.get(card.sceneId) ?? '#8b93a5'
  const statusColor = statusColors[state.learning[card.id]?.status ?? 'new']

  return <Group x={card.x + (CARD_SIZE / 2)} y={card.y + (CARD_SIZE / 2)} listening={false} name={`illustration-overview-${card.id}`}>
    <Circle radius={8} fill={sceneColor} opacity={0.72} perfectDrawEnabled={false} />
    <Circle radius={11} stroke={statusColor} strokeWidth={2} opacity={0.82} perfectDrawEnabled={false} />
  </Group>
}

export const BoardCardOverviewNode = memo(BoardCardOverviewNodeBase, (previous, next) => {
  const cardId = previous.card.id
  return previous.card === next.card
    && previous.state.learning[cardId] === next.state.learning[cardId]
})

interface BoardCardOverviewLayerProps {
  cards: WordCard[]
  state: PersistedState
}

interface OverviewMarker {
  x: number
  y: number
  sceneColor: string
  statusColor: string
}

/**
 * Deep zoom uses one Konva Shape for all visible cards. The marker geometry
 * stays in the same world coordinates, so the board still communicates its
 * density and scene structure while avoiding hundreds of React/Konva nodes.
 */
export function BoardCardOverviewLayer({ cards, state }: BoardCardOverviewLayerProps) {
  const learning = state.learning
  const markers = useMemo<OverviewMarker[]>(() => cards.map((card) => ({
    x: card.x + (CARD_SIZE / 2),
    y: card.y + (CARD_SIZE / 2),
    sceneColor: sceneColors.get(card.sceneId) ?? '#8b93a5',
    statusColor: statusColors[learning[card.id]?.status ?? 'new'],
  })), [cards, learning])

  return <Shape
    listening={false}
    sceneFunc={(context) => {
      for (const marker of markers) {
        context.globalAlpha = 0.58
        context.fillStyle = marker.sceneColor
        context.beginPath()
        context.arc(marker.x, marker.y, 8, 0, Math.PI * 2)
        context.fill()
        context.globalAlpha = 0.92
        context.strokeStyle = marker.statusColor
        context.lineWidth = 2
        context.beginPath()
        context.arc(marker.x, marker.y, 11, 0, Math.PI * 2)
        context.stroke()
      }
      context.globalAlpha = 1
    }}
  />
}
