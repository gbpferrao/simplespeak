import { memo, useEffect, useState } from 'react'
import { Group, Image as KonvaImage, Text } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Image'
import 'konva/lib/shapes/Text'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { CARD_SIZE, type BoardImageResolution } from './boardGeometry'

interface BoardCardNodeProps {
  card: WordCard
  state: PersistedState
  focused: boolean
  runMode?: boolean
  runActive?: boolean
  revealed?: boolean
  cardOpacity?: number
  imageResolution?: BoardImageResolution
}

const CARD_HALF = CARD_SIZE / 2
const MASK_INK_GROWTH = 0.18
const MASK_ALPHA_THRESHOLD = 8
const imageCache = new Map<string, HTMLCanvasElement>()
const MAX_IMAGE_CACHE = 96
const IMAGE_RENDER_SIZE: Record<BoardImageResolution, number | null> = {
  full: null,
  medium: 320,
  thumb: 96,
}

function boardAssetSource(source: string | undefined, resolution: BoardImageResolution): string | undefined {
  if (!source || resolution === 'full' || !source.startsWith('/simplespeak-images/')) return source
  const fileName = source.slice('/simplespeak-images/'.length)
  if (!fileName.toLowerCase().endsWith('.png')) return source
  const directory = resolution === 'medium' ? 'medium' : 'thumb'
  return `/simplespeak-images/${directory}/${fileName.slice(0, -4)}.jpg`
}

function trimImageCache(): void {
  while (imageCache.size > MAX_IMAGE_CACHE) {
    const oldest = imageCache.keys().next().value
    if (!oldest) return
    imageCache.delete(oldest)
  }
}

function colorParts(color: string): [number, number, number] {
  const match = color.trim().match(/^#([0-9a-f]{6})$/i)
  if (!match) return [118, 87, 217]
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ]
}

function estimateGrowRadius(alpha: Uint8ClampedArray, width: number, height: number): number {
  let inkArea = 0
  let boundaryEdges = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width) + x
      if (alpha[index] <= MASK_ALPHA_THRESHOLD) continue
      inkArea += 1
      if (x === 0 || alpha[index - 1] <= MASK_ALPHA_THRESHOLD) boundaryEdges += 1
      if (x === width - 1 || alpha[index + 1] <= MASK_ALPHA_THRESHOLD) boundaryEdges += 1
      if (y === 0 || alpha[index - width] <= MASK_ALPHA_THRESHOLD) boundaryEdges += 1
      if (y === height - 1 || alpha[index + width] <= MASK_ALPHA_THRESHOLD) boundaryEdges += 1
    }
  }

  // For a line-like shape, 2 * area / perimeter approximates its stroke
  // width. Growing both sides by 9% therefore creates an 18% thicker stroke.
  const estimatedStrokeWidth = boundaryEdges > 0 ? (2 * inkArea) / boundaryEdges : 1
  const maximumRadius = Math.max(1, Math.min(16, Math.round(Math.min(width, height) * 0.014)))
  return Math.max(1, Math.min(maximumRadius, Math.round(estimatedStrokeWidth * MASK_INK_GROWTH * 0.5)))
}

function maxFilterHorizontal(source: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source.length)
  const deque = new Int32Array(width)
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width
    let head = 0
    let tail = 0
    let next = 0
    for (let x = 0; x < width; x += 1) {
      const right = Math.min(width - 1, x + radius)
      while (next <= right) {
        while (head < tail && source[rowStart + deque[tail - 1]] <= source[rowStart + next]) tail -= 1
        deque[tail] = next
        tail += 1
        next += 1
      }
      const left = x - radius
      while (head < tail && deque[head] < left) head += 1
      output[rowStart + x] = source[rowStart + deque[head]]
    }
  }
  return output
}

function maxFilterVertical(source: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source.length)
  const deque = new Int32Array(height)
  for (let x = 0; x < width; x += 1) {
    let head = 0
    let tail = 0
    let next = 0
    for (let y = 0; y < height; y += 1) {
      const bottom = Math.min(height - 1, y + radius)
      while (next <= bottom) {
        while (head < tail && source[(deque[tail - 1] * width) + x] <= source[(next * width) + x]) tail -= 1
        deque[tail] = next
        tail += 1
        next += 1
      }
      const top = y - radius
      while (head < tail && deque[head] < top) head += 1
      output[(y * width) + x] = source[(deque[head] * width) + x]
    }
  }
  return output
}

function growMask(source: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  return maxFilterVertical(maxFilterHorizontal(source, width, height, radius), width, height, radius)
}

function makeColorMask(image: HTMLImageElement, color: string, resolution: BoardImageResolution): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const maxDimension = IMAGE_RENDER_SIZE[resolution]
  const scale = maxDimension ? Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight)) : 1
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) return canvas

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = resolution === 'full' ? 'high' : 'medium'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const [red, green, blue] = colorParts(color)
  const alpha = new Uint8ClampedArray(canvas.width * canvas.height)
  for (let index = 0; index < pixels.data.length; index += 4) {
    const luminance = (pixels.data[index] * 0.299) + (pixels.data[index + 1] * 0.587) + (pixels.data[index + 2] * 0.114)
    const sourceAlpha = pixels.data[index + 3] / 255
    const pixelAlpha = luminance >= 245
      ? 0
      : Math.max(0, Math.min(255, Math.round((255 - luminance) * 1.45 * sourceAlpha)))
    alpha[index / 4] = pixelAlpha
  }

  const grownAlpha = growMask(alpha, canvas.width, canvas.height, estimateGrowRadius(alpha, canvas.width, canvas.height))
  for (let index = 0; index < pixels.data.length; index += 4) {
    pixels.data[index] = red
    pixels.data[index + 1] = green
    pixels.data[index + 2] = blue
    pixels.data[index + 3] = grownAlpha[index / 4]
  }
  context.putImageData(pixels, 0, 0)
  return canvas
}

function useColorMask(source: string | undefined, color: string, resolution: BoardImageResolution): HTMLCanvasElement | null {
  const imageSource = boardAssetSource(source, resolution)
  const cacheKey = imageSource ? `${imageSource}|${color}|${resolution}` : ''
  const [image, setImage] = useState<HTMLCanvasElement | null>(() => cacheKey ? imageCache.get(cacheKey) ?? null : null)

  useEffect(() => {
    if (!imageSource) {
      setImage(null)
      return
    }

    const cached = imageCache.get(cacheKey)
    if (cached) {
      setImage(cached)
      return
    }

    let active = true
    const loadedImage = new window.Image()
    loadedImage.decoding = 'async'
    loadedImage.onload = () => {
      const masked = makeColorMask(loadedImage, color, resolution)
      imageCache.set(cacheKey, masked)
      trimImageCache()
      if (active) setImage(masked)
    }
    loadedImage.onerror = () => {
      if (active) setImage(null)
    }
    loadedImage.src = imageSource

    return () => {
      active = false
      loadedImage.onload = null
      loadedImage.onerror = null
    }
  }, [cacheKey, color, imageSource, resolution])

  return image
}

function BoardCardNodeBase({ card, state, focused, runActive = false, revealed = false, cardOpacity = 0.94, imageResolution = 'full' }: BoardCardNodeProps) {
  const scene = starterPack.scenes.find((candidate) => candidate.id === card.sceneId)
  const sceneColor = scene?.accent ?? '#7657d9'
  const image = useColorMask(state.images[card.id] ?? card.imagePath, sceneColor, imageResolution)
  const rotation = card.id.split('').reduce((total, character) => total + character.charCodeAt(0), 0) % 5 - 2
  const visualScale = runActive ? 1.12 : focused ? 1.05 : 1
  const opacity = runActive || focused ? 1 : cardOpacity

  return (
    <Group x={card.x + CARD_HALF} y={card.y + CARD_HALF - (runActive ? 7 : 0)} scaleX={visualScale} scaleY={visualScale} rotation={focused || runActive ? 0 : rotation} opacity={opacity} name={`illustration-${card.id}`}>
      {revealed
        ? <CardReveal card={card} state={state} image={image} />
        : image
          ? <KonvaImage image={image} x={-CARD_HALF} y={-CARD_HALF} width={CARD_SIZE} height={CARD_SIZE} />
          : <Text x={-CARD_HALF} y={-24} width={CARD_SIZE} height={48} text={card.target} fill={sceneColor} fontFamily="Inter, system-ui, sans-serif" fontSize={22} fontStyle="bold" letterSpacing={-0.5} align="center" verticalAlign="middle" wrap="word" />}
    </Group>
  )
}

function CardReveal({ card, state, image }: { card: WordCard; state: PersistedState; image: HTMLCanvasElement | null }) {
  return <Group>
    {image && <KonvaImage image={image} x={-CARD_HALF} y={-CARD_HALF} width={CARD_SIZE} height={CARD_SIZE} opacity={0.22} />}
    <Text x={-CARD_HALF + 8} y={-32} width={CARD_SIZE - 16} text={card.target} fill="#26344a" fontFamily="Inter, system-ui, sans-serif" fontSize={19} fontStyle="bold" align="center" wrap="word" />
    <Text x={-CARD_HALF + 8} y={-5} width={CARD_SIZE - 16} text={card.origin} fill="#52627a" fontFamily="Inter, system-ui, sans-serif" fontSize={11} fontStyle="bold" align="center" wrap="word" />
    <Text x={-CARD_HALF + 10} y={18} width={CARD_SIZE - 20} height={34} text={state.notes[card.id] || card.note || 'No mnemonic note yet.'} fill="#738096" fontFamily="Inter, system-ui, sans-serif" fontSize={8} lineHeight={1.3} align="center" wrap="word" ellipsis />
  </Group>
}

export const BoardCardNode = memo(BoardCardNodeBase, (previous, next) => {
  const cardId = previous.card.id
  return previous.card === next.card
    && previous.focused === next.focused
    && previous.runMode === next.runMode
    && previous.runActive === next.runActive
    && previous.revealed === next.revealed
    && previous.cardOpacity === next.cardOpacity
    && previous.imageResolution === next.imageResolution
    && previous.state.learning[cardId] === next.state.learning[cardId]
    && previous.state.images[cardId] === next.state.images[cardId]
    && (!next.revealed || (previous.state.notes[cardId] ?? '') === (next.state.notes[cardId] ?? ''))
})
