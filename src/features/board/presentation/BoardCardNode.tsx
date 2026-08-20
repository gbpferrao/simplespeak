import { memo, useEffect, useRef, useState } from 'react'
import { Group, Image as KonvaImage, Text } from 'react-konva/lib/ReactKonvaCore'
import type { Group as KonvaGroup } from 'konva/lib/Group'
import { Easings, Tween } from 'konva/lib/Tween'
import 'konva/lib/shapes/Image'
import 'konva/lib/shapes/Text'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { imageFor, learningFor } from '../../../core/presentation/selectors'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { CARD_SIZE } from './boardGeometry'
import { useI18n } from '../../../core/i18n/i18n'
import { boardCardOpacity } from '../domain/boardVisuals'
import {
  HPM_CUE_CORNER_DELTAS,
  HPM_CUE_OUT_DURATION,
  HPM_CUE_PAUSE_MS,
  HPM_CUE_RETURN_DURATION,
  nextRandomCornerIndex,
} from '../domain/hpmCueMotion'

interface BoardCardNodeProps {
  card: WordCard
  state: PersistedState
  focused: boolean
  runMode?: boolean
  runActive?: boolean
  speedCue?: boolean
  revealed?: boolean
  cardOpacity?: number
}

const CARD_HALF = CARD_SIZE / 2
const imageCache = new Map<string, HTMLImageElement>()
const MAX_IMAGE_CACHE = 96

function trimImageCache(): void {
  while (imageCache.size > MAX_IMAGE_CACHE) {
    const oldest = imageCache.keys().next().value
    if (!oldest) return
    imageCache.delete(oldest)
  }
}

function useBoardImage(source: string | undefined): HTMLImageElement | null {
  // Pack illustrations are pre-colored, transparent WebP assets. Bundled
  // card images are already finished visuals. Both paths therefore use the
  // same immutable source at every zoom level: no JPEG tier swap, canvas
  // rasterization, mask filter, or color pass occurs during interaction.
  const imageSource = source
  const cacheKey = imageSource ?? ''
  const [image, setImage] = useState<HTMLImageElement | null>(() => cacheKey ? imageCache.get(cacheKey) ?? null : null)

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
      imageCache.set(cacheKey, loadedImage)
      trimImageCache()
      if (active) setImage(loadedImage)
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
  }, [cacheKey, imageSource])

  return image
}

function BoardCardNodeBase({ card, state, focused, runMode = false, runActive = false, speedCue = false, revealed = false, cardOpacity = 0.94 }: BoardCardNodeProps) {
  const { t } = useI18n(state.settings.uiLocale)
  const scene = starterPack.scenes.find((candidate) => candidate.id === card.sceneId)
  const sceneColor = scene?.accent ?? '#1769e0'
  const image = useBoardImage(imageFor(state, card))
  const learning = learningFor(state, card.id)
  const rotation = card.id.split('').reduce((total, character) => total + character.charCodeAt(0), 0) % 5 - 2
  const visualScale = runActive ? 1.12 : focused ? 1.05 : 1
  const opacity = boardCardOpacity({ learning, baseOpacity: cardOpacity, focused, active: runActive, runMode })
  const groupRef = useRef<KonvaGroup | null>(null)
  const baseX = card.x + CARD_HALF
  const baseY = card.y + CARD_HALF - (runActive ? 7 : 0)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const node = group
    let activeTween: Tween | null = null
    let pulseTimer: number | null = null
    let cancelled = false
    let previousCornerIndex = -1

    const resetPosition = (): void => {
      group.position({ x: baseX, y: baseY })
      group.rotation(focused || runActive ? 0 : rotation)
      group.getLayer()?.batchDraw()
    }

    const cleanup = (): void => {
      cancelled = true
      if (pulseTimer !== null) window.clearTimeout(pulseTimer)
      pulseTimer = null
      activeTween?.destroy()
      activeTween = null
      resetPosition()
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (!speedCue || reducedMotion) {
      cleanup()
      return
    }

    function schedulePulse(delayMs: number): void {
      pulseTimer = window.setTimeout(runPulse, delayMs)
    }

    function runPulse(): void {
      pulseTimer = null
      if (cancelled) return

      previousCornerIndex = nextRandomCornerIndex(previousCornerIndex)
      const corner = HPM_CUE_CORNER_DELTAS[previousCornerIndex]
      let outwardTween: Tween | null = null
      outwardTween = new Tween({
        node,
        x: baseX + corner.x,
        y: baseY + corner.y,
        duration: HPM_CUE_OUT_DURATION,
        easing: Easings.EaseOut,
        onFinish: () => {
          outwardTween?.destroy()
          outwardTween = null
          if (cancelled) return

          let returnTween: Tween | null = null
          returnTween = new Tween({
            node,
            x: baseX,
            y: baseY,
            duration: HPM_CUE_RETURN_DURATION,
            easing: Easings.EaseInOut,
            onFinish: () => {
              returnTween?.destroy()
              returnTween = null
              activeTween = null
              if (!cancelled) schedulePulse(HPM_CUE_PAUSE_MS)
            },
          })
          activeTween = returnTween
          returnTween.play()
        },
      })
      activeTween = outwardTween
      outwardTween.play()
    }

    runPulse()

    return cleanup
  }, [baseX, baseY, focused, rotation, runActive, speedCue])

  return (
    <Group ref={groupRef} x={baseX} y={baseY} scaleX={visualScale} scaleY={visualScale} rotation={focused || runActive ? 0 : rotation} opacity={opacity} name={`illustration-${card.id}`}>
      {revealed
        ? <CardReveal card={card} state={state} image={image} noMnemonic={t('card.noMnemonic')} />
        : image
          ? <KonvaImage image={image} x={-CARD_HALF} y={-CARD_HALF} width={CARD_SIZE} height={CARD_SIZE} />
          : <Text x={-CARD_HALF} y={-24} width={CARD_SIZE} height={48} text={card.target} fill={sceneColor} fontFamily="Atkinson Hyperlegible, system-ui, sans-serif" fontSize={22} fontStyle="bold" letterSpacing={-0.5} align="center" verticalAlign="middle" wrap="word" />}
    </Group>
  )
}

function CardReveal({ card, state, image, noMnemonic }: { card: WordCard; state: PersistedState; image: HTMLImageElement | null; noMnemonic: string }) {
  return <Group>
    {image && <KonvaImage image={image} x={-CARD_HALF} y={-CARD_HALF} width={CARD_SIZE} height={CARD_SIZE} opacity={0.22} />}
    <Text x={-CARD_HALF + 8} y={-32} width={CARD_SIZE - 16} text={card.target} fill="#26344a" fontFamily="Atkinson Hyperlegible, system-ui, sans-serif" fontSize={19} fontStyle="bold" align="center" wrap="word" />
    <Text x={-CARD_HALF + 8} y={-5} width={CARD_SIZE - 16} text={card.origin} fill="#52627a" fontFamily="Atkinson Hyperlegible, system-ui, sans-serif" fontSize={11} fontStyle="bold" align="center" wrap="word" />
    <Text x={-CARD_HALF + 10} y={18} width={CARD_SIZE - 20} height={34} text={state.notes[card.id] || card.note || noMnemonic} fill="#738096" fontFamily="Atkinson Hyperlegible, system-ui, sans-serif" fontSize={8} lineHeight={1.3} align="center" wrap="word" ellipsis />
  </Group>
}

export const BoardCardNode = memo(BoardCardNodeBase, (previous, next) => {
  const cardId = previous.card.id
  return previous.card === next.card
    && previous.focused === next.focused
    && previous.runMode === next.runMode
    && previous.runActive === next.runActive
    && previous.speedCue === next.speedCue
    && previous.revealed === next.revealed
    && previous.cardOpacity === next.cardOpacity
    && previous.state.learning[cardId] === next.state.learning[cardId]
    && previous.state.images[cardId] === next.state.images[cardId]
    && (!next.revealed || (previous.state.notes[cardId] ?? '') === (next.state.notes[cardId] ?? ''))
})
