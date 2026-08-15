import { memo, useEffect, useState } from 'react'
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Image'
import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { learningFor } from '../../../core/presentation/selectors'
import { starterPack } from '../../language-packs/data/starterPack'
import { CARD_SIZE } from './boardGeometry'

interface BoardCardNodeProps {
  card: WordCard
  state: PersistedState
  focused: boolean
  runMode?: boolean
  runActive?: boolean
  revealed?: boolean
}

const CARD_RADIUS = 14
const CARD_HALF = CARD_SIZE / 2
const CARD_INSET = 2
const CARD_IMAGE_SIZE = CARD_SIZE - CARD_INSET * 2
const statusColors: Record<ReturnType<typeof learningFor>['status'], string> = {
  new: '#c9cdd9',
  emerging: '#e8c15e',
  familiar: '#8fb7ed',
  anchored: '#86cda7',
}

function useCardImage(source: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(() => source ? imageCache.get(source) ?? null : null)

  useEffect(() => {
    if (!source) {
      setImage(null)
      return
    }

    const cached = imageCache.get(source)
    if (cached) {
      setImage(cached)
      return
    }

    let active = true
    const loadedImage = new window.Image()
    loadedImage.decoding = 'async'
    loadedImage.onload = () => {
      imageCache.set(source, loadedImage)
      trimImageCache()
      if (active) setImage(loadedImage)
    }
    loadedImage.onerror = () => {
      if (active) setImage(null)
    }
    loadedImage.src = source

    return () => {
      active = false
      loadedImage.onload = null
      loadedImage.onerror = null
    }
  }, [source])

  return image
}

const MAX_IMAGE_CACHE = 64
const imageCache = new Map<string, HTMLImageElement>()

function trimImageCache(): void {
  while (imageCache.size > MAX_IMAGE_CACHE) {
    const oldest = imageCache.keys().next().value
    if (!oldest) return
    imageCache.delete(oldest)
  }
}

function BoardCardNodeBase({ card, state, focused, runActive = false, revealed = false }: BoardCardNodeProps) {
  const learning = learningFor(state, card.id)
  const imageSource = state.images[card.id]
  const image = useCardImage(imageSource)
  const scene = starterPack.scenes.find((candidate) => candidate.id === card.sceneId)
  const rotation = card.id.charCodeAt(0) % 3 === 0 ? 1 : -1
  const visualScale = runActive ? 1.08 : 1
  const borderColor = focused || runActive ? '#7657d9' : statusColors[learning.status]
  const fillColor = image ? '#ffffff' : '#e9e6ef'
  const hasEmphasis = focused || runActive
  const shadowBlur = runActive ? 12 : focused ? 8 : 0
  const shadowOffsetY = runActive ? 6 : focused ? 3 : 0
  const shadowOpacity = hasEmphasis ? 0.16 : 0

  return (
    <Group x={card.x + CARD_HALF} y={card.y + CARD_HALF - (runActive ? 7 : 0)} scaleX={visualScale} scaleY={visualScale} rotation={focused || runActive ? 1 : rotation} name={`card-${card.id}`}>
      <Rect x={-CARD_HALF} y={-CARD_HALF} width={CARD_SIZE} height={CARD_SIZE} fill={fillColor} stroke={borderColor} strokeWidth={hasEmphasis ? 3 : 1.5} cornerRadius={CARD_RADIUS} shadowColor="#26344a" shadowBlur={shadowBlur} shadowOffsetY={shadowOffsetY} shadowOpacity={shadowOpacity} />
      {revealed ? <CardReveal card={card} state={state} /> : image ? <KonvaImage image={image} x={-CARD_HALF + CARD_INSET} y={-CARD_HALF + CARD_INSET} width={CARD_IMAGE_SIZE} height={CARD_IMAGE_SIZE} cornerRadius={CARD_RADIUS - 2} /> : <Text x={-CARD_HALF + 10} y={-24} width={CARD_SIZE - 20} height={48} text={card.target} fill="#26344a" fontFamily="Inter, system-ui, sans-serif" fontSize={22} fontStyle="bold" letterSpacing={-0.5} align="center" verticalAlign="middle" wrap="word" />}
      {scene && <Rect x={-CARD_HALF + 8} y={CARD_HALF - 10} width={8} height={3} fill={scene.accent} cornerRadius={2} opacity={0.75} listening={false} />}
    </Group>
  )
}

function CardReveal({ card, state }: { card: WordCard; state: PersistedState }) {
  return <>
    <Text x={-CARD_HALF + 10} y={-58} width={CARD_SIZE - 20} text="TARGET WORD" fill="#7657d9" fontFamily="Inter, system-ui, sans-serif" fontSize={8} fontStyle="bold" letterSpacing={1} />
    <Text x={-CARD_HALF + 10} y={-40} width={CARD_SIZE - 20} text={card.target} fill="#26344a" fontFamily="Inter, system-ui, sans-serif" fontSize={22} fontStyle="bold" letterSpacing={-0.5} wrap="word" />
    <Text x={-CARD_HALF + 10} y={-9} width={CARD_SIZE - 20} text={card.origin} fill="#52627a" fontFamily="Inter, system-ui, sans-serif" fontSize={11} fontStyle="bold" wrap="word" />
    <Text x={-CARD_HALF + 10} y={15} width={CARD_SIZE - 20} height={38} text={state.notes[card.id] || card.noteSeed} fill="#738096" fontFamily="Inter, system-ui, sans-serif" fontSize={8} lineHeight={1.3} wrap="word" ellipsis />
  </>
}

/**
 * Camera movement changes the Stage transform, not the card props. Keep card
 * components stable unless their own learning/image/focus state changes.
 */
export const BoardCardNode = memo(BoardCardNodeBase, (previous, next) => {
  const cardId = previous.card.id
  return previous.card === next.card
    && previous.focused === next.focused
    && previous.runMode === next.runMode
    && previous.runActive === next.runActive
    && previous.revealed === next.revealed
    && previous.state.learning[cardId] === next.state.learning[cardId]
    && previous.state.images[cardId] === next.state.images[cardId]
    && (!next.revealed || (previous.state.notes[cardId] ?? '') === (next.state.notes[cardId] ?? ''))
})
