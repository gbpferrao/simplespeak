import { forwardRef, useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { Application, Container, Graphics, Sprite, Text, Texture, WebGLRenderer } from 'pixi.js'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { imageFor, learningFor } from '../../../core/presentation/selectors'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { boardCardOpacity } from '../domain/boardVisuals'
import {
  HPM_CUE_CORNER_DELTAS,
  HPM_CUE_OUT_DURATION,
  HPM_CUE_PAUSE_MS,
  HPM_CUE_RETURN_DURATION,
  nextRandomCornerIndex,
} from '../domain/hpmCueMotion'
import { CARD_OVERVIEW_ZOOM, CARD_SIZE, GROUP_LABEL_FADE_END, GROUP_LABEL_FADE_START, type BoardCamera } from './boardGeometry'

const CARD_HALF = CARD_SIZE / 2
const BOARD_PIXEL_RATIO = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
const GROUP_LABEL_OPACITY_STEPS = 24
const pixiTextureCache = new Map<string, Texture>()
const pixiImageCache = new Map<string, HTMLImageElement>()
const statusColors: Record<string, string> = {
  new: '#c9cdd9',
  emerging: '#e8c15e',
  familiar: '#8fb7ed',
  anchored: '#86cda7',
}

export interface PixiBoardCanvasHandle {
  setCamera: (camera: BoardCamera) => void
}

interface PixiBoardCanvasProps {
  width: number
  height: number
  camera: BoardCamera
  state: PersistedState
  cards: WordCard[]
  focusedCardId: string | null
  activeCardId: string | null
  runActive: boolean
  revealed: boolean
  speedCueActive: boolean
  onUnavailable: () => void
}

interface PixiCardNode {
  root: Container
  base: Container
  marker: Graphics
  fallback: Text
  reveal: Container
  targetText: Text
  originText: Text
  noteText: Text
  image: Sprite | null
  revealImage: Sprite | null
  imagePath: string | undefined
  baseX: number
  baseY: number
}

function hexColor(value: string): number {
  const normalized = value.replace('#', '')
  return Number.parseInt(normalized.length === 3 ? normalized.split('').map((part) => part + part).join('') : normalized, 16)
}

function roundedRect(width: number, height: number, color: number, alpha: number, radius: number): Graphics {
  return new Graphics().roundRect(0, 0, width, height, radius).fill({ color, alpha })
}

function createText(text: string, style: Record<string, unknown>): Text {
  return new Text({ text, style })
}

function replaceImage(container: Container, previous: Sprite | null, source: string | undefined, alpha = 1): Sprite | null {
  previous?.destroy()
  if (!source) return null

  let texture = pixiTextureCache.get(source)
  if (!texture) {
    let image = pixiImageCache.get(source)
    if (!image) {
      image = new window.Image()
      image.decoding = 'async'
      image.src = source
      pixiImageCache.set(source, image)
    }
    texture = Texture.from(image, true)
    pixiTextureCache.set(source, texture)
  }
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5)
  sprite.width = CARD_SIZE
  sprite.height = CARD_SIZE
  sprite.alpha = alpha
  container.addChildAt(sprite, 0)
  return sprite
}

function createCardNode(card: WordCard, sceneColor: string, noMnemonic: string): PixiCardNode {
  const root = new Container()
  const base = new Container()
  const marker = new Graphics()
  const fallback = createText(card.target, {
    fontFamily: 'Atkinson Hyperlegible, system-ui, sans-serif',
    fontSize: 22,
    fontWeight: '700',
    fill: hexColor(sceneColor),
    align: 'center',
    wordWrap: true,
    wordWrapWidth: CARD_SIZE - 12,
  })
  fallback.anchor.set(0.5)
  fallback.visible = false

  const reveal = new Container()
  const targetText = createText(card.target, {
    fontFamily: 'Atkinson Hyperlegible, system-ui, sans-serif',
    fontSize: 19,
    fontWeight: '700',
    fill: 0x26344a,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: CARD_SIZE - 16,
  })
  targetText.anchor.set(0.5)
  targetText.position.set(0, -21)

  const originText = createText(card.origin, {
    fontFamily: 'Atkinson Hyperlegible, system-ui, sans-serif',
    fontSize: 11,
    fontWeight: '700',
    fill: 0x52627a,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: CARD_SIZE - 16,
  })
  originText.anchor.set(0.5)
  originText.position.set(0, 6)

  const noteText = createText(card.note || noMnemonic, {
    fontFamily: 'Atkinson Hyperlegible, system-ui, sans-serif',
    fontSize: 8,
    fill: 0x738096,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: CARD_SIZE - 20,
    lineHeight: 10,
  })
  noteText.anchor.set(0.5)
  noteText.position.set(0, 31)

  base.addChild(marker, fallback)
  reveal.addChild(targetText, originText, noteText)
  root.addChild(base, reveal)

  return {
    root,
    base,
    marker,
    fallback,
    reveal,
    targetText,
    originText,
    noteText,
    image: null,
    revealImage: null,
    imagePath: undefined,
    baseX: card.x + CARD_HALF,
    baseY: card.y + CARD_HALF,
  }
}

class PixiBoardRuntime {
  private readonly world = new Container()
  private readonly sceneLayer = new Container()
  private readonly cardLayer = new Container()
  private readonly sceneNodes = new Map<string, { background: Graphics; title: Text }>()
  private readonly cardNodes = new Map<string, PixiCardNode>()
  private readonly app: Application
  private activeCardId: string | null = null
  private speedCueActive = false
  private motionElapsedMs = 0
  private previousCornerIndex = -1
  private motionRunning = false

  private readonly tickMotion = (ticker: { deltaMS: number }): void => {
    const node = this.activeCardId ? this.cardNodes.get(this.activeCardId) : undefined
    if (!node) return

    const outwardMs = HPM_CUE_OUT_DURATION * 1000
    const returnMs = HPM_CUE_RETURN_DURATION * 1000
    const cycleMs = outwardMs + returnMs + HPM_CUE_PAUSE_MS
    this.motionElapsedMs += Math.min(64, ticker.deltaMS)
    while (this.motionElapsedMs >= cycleMs) {
      this.motionElapsedMs -= cycleMs
      this.previousCornerIndex = nextRandomCornerIndex(this.previousCornerIndex)
    }

    let offsetFactor = 0
    if (this.motionElapsedMs < outwardMs) {
      const progress = this.motionElapsedMs / outwardMs
      offsetFactor = 1 - ((1 - progress) ** 3)
    } else if (this.motionElapsedMs < outwardMs + returnMs) {
      const progress = (this.motionElapsedMs - outwardMs) / returnMs
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - (((-2 * progress + 2) ** 2) / 2)
      offsetFactor = 1 - eased
    }

    const corner = HPM_CUE_CORNER_DELTAS[this.previousCornerIndex]
    node.root.position.set(node.baseX + (corner.x * offsetFactor), node.baseY + (corner.y * offsetFactor))
    this.app.render()
  }

  constructor(app: Application) {
    this.app = app
    this.world.addChild(this.sceneLayer, this.cardLayer)
    this.cardLayer.sortableChildren = true
    this.app.stage.addChild(this.world)

    for (const scene of starterPack.scenes) {
      const root = new Container()
      const background = roundedRect(scene.width, scene.height, hexColor(scene.accent), 0.09, 28)
      const title = createText(scene.name, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 82,
        fontWeight: '700',
        fill: hexColor(scene.accent),
        align: 'center',
        wordWrap: true,
        wordWrapWidth: scene.width - 160,
      })
      title.anchor.set(0.5)
      title.position.set(scene.width / 2, scene.height / 2)
      root.position.set(scene.x, scene.y)
      root.addChild(background, title)
      this.sceneLayer.addChild(root)
      this.sceneNodes.set(scene.id, { background, title })
    }
  }

  setCamera(camera: BoardCamera): void {
    this.world.position.set(camera.x, camera.y)
    this.world.scale.set(camera.zoom)
    this.app.render()
  }

  update({ width, height, camera, state, cards, focusedCardId, activeCardId, runActive, revealed, speedCueActive }: PixiBoardCanvasProps): void {
    this.app.renderer.resize(width, height)
    this.world.position.set(camera.x, camera.y)
    this.world.scale.set(camera.zoom)

    const rawGroupLabelOpacity = Math.max(0, Math.min(1, (GROUP_LABEL_FADE_START - camera.zoom) / (GROUP_LABEL_FADE_START - GROUP_LABEL_FADE_END)))
    const groupLabelOpacity = Math.round(rawGroupLabelOpacity * GROUP_LABEL_OPACITY_STEPS) / GROUP_LABEL_OPACITY_STEPS
    const overview = camera.zoom < CARD_OVERVIEW_ZOOM
    const cardOpacity = 0.94 - (groupLabelOpacity * 0.2)
    const visibleIds = new Set<string>()

    for (const scene of starterPack.scenes) {
      const sceneNode = this.sceneNodes.get(scene.id)
      if (!sceneNode) continue
      sceneNode.background.visible = overview
      sceneNode.title.alpha = groupLabelOpacity * 0.58
    }

    for (const card of cards) {
      visibleIds.add(card.id)
      const important = card.id === focusedCardId || card.id === activeCardId
      const sceneColor = starterPack.scenes.find((scene) => scene.id === card.sceneId)?.accent ?? '#1769e0'
      const node = this.cardNodes.get(card.id) ?? createCardNode(card, sceneColor, state.settings.uiLocale === 'pt-BR' ? 'Sem mnemônico' : 'No mnemonic')
      if (!this.cardNodes.has(card.id)) {
        this.cardNodes.set(card.id, node)
        this.cardLayer.addChild(node.root)
      }

      const learning = learningFor(state, card.id)
      const isActive = card.id === activeCardId
      const isRevealed = revealed && isActive
      const opacity = boardCardOpacity({ learning, baseOpacity: important ? 1 : cardOpacity, focused: card.id === focusedCardId, active: isActive, runMode: runActive })
      const rotation = (card.id.split('').reduce((total, character) => total + character.charCodeAt(0), 0) % 5 - 2) * (Math.PI / 180)
      const visualScale = isActive ? 1.12 : card.id === focusedCardId ? 1.05 : 1
      const showDetail = important || !overview

      node.baseX = card.x + CARD_HALF
      node.baseY = card.y + CARD_HALF - (isActive ? 7 : 0)
      node.root.position.set(node.baseX, node.baseY)
      node.root.scale.set(visualScale)
      node.root.rotation = card.id === focusedCardId || isActive ? 0 : rotation
      node.root.alpha = opacity
      node.root.zIndex = important ? 2 : 1
      node.root.visible = true
      node.marker.visible = !showDetail
      node.base.visible = showDetail && !isRevealed
      node.reveal.visible = showDetail && isRevealed

      node.fallback.visible = !node.image && !isRevealed
      node.fallback.text = card.target
      node.fallback.style.fill = hexColor(sceneColor)
      node.targetText.text = card.target
      node.originText.text = card.origin
      node.noteText.text = state.notes[card.id] || card.note || (state.settings.uiLocale === 'pt-BR' ? 'Sem mnemônico' : 'No mnemonic')

      const source = imageFor(state, card)
      if (node.imagePath !== source) {
        node.imagePath = source
        node.image = replaceImage(node.base, node.image, source)
        node.revealImage = replaceImage(node.reveal, node.revealImage, source, 0.22)
      }

      node.marker.clear()
      node.marker.circle(0, 0, 8).fill({ color: hexColor(sceneColor), alpha: 0.72 })
      node.marker.circle(0, 0, 11).stroke({ width: 2, color: hexColor(statusColors[learning.status] ?? statusColors.new), alpha: 0.82 })
    }

    for (const [cardId, node] of this.cardNodes) {
      if (!visibleIds.has(cardId)) node.root.visible = false
    }

    const activeChanged = this.activeCardId !== activeCardId
    this.activeCardId = activeCardId
    this.syncMotion(speedCueActive && !this.prefersReducedMotion(), activeChanged)
    this.app.render()
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  }

  private syncMotion(enabled: boolean, activeChanged: boolean): void {
    if (!enabled) {
      if (this.motionRunning) this.app.ticker.remove(this.tickMotion)
      this.motionRunning = false
      this.speedCueActive = false
      this.motionElapsedMs = 0
      this.previousCornerIndex = -1
      const activeNode = this.activeCardId ? this.cardNodes.get(this.activeCardId) : undefined
      if (activeNode) activeNode.root.position.set(activeNode.baseX, activeNode.baseY)
      this.app.ticker.stop()
      return
    }

    if (!this.motionRunning || activeChanged || !this.speedCueActive) {
      this.motionElapsedMs = 0
      this.previousCornerIndex = nextRandomCornerIndex(-1)
    }
    if (!this.motionRunning) {
      this.app.ticker.add(this.tickMotion)
      this.app.ticker.start()
      this.motionRunning = true
    }
    this.speedCueActive = true
  }

  destroy(): void {
    this.app.ticker.remove(this.tickMotion)
    this.app.ticker.stop()
    this.cardNodes.clear()
    this.sceneNodes.clear()
    this.world.destroy({ children: true })
  }
}

export const PixiBoardCanvas = forwardRef(function PixiBoardCanvas(props: PixiBoardCanvasProps, ref: Ref<PixiBoardCanvasHandle>) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<PixiBoardRuntime | null>(null)
  const latestPropsRef = useRef(props)
  const onUnavailableRef = useRef(props.onUnavailable)
  latestPropsRef.current = props
  onUnavailableRef.current = props.onUnavailable

  useImperativeHandle(ref, () => ({
    setCamera: (camera) => runtimeRef.current?.setCamera(camera),
  }), [])

  useEffect(() => {
    let disposed = false
    let initialized = false
    const app = new Application()

    void app.init({
      width: Math.max(1, props.width),
      height: Math.max(1, props.height),
      resolution: BOARD_PIXEL_RATIO,
      autoDensity: true,
      autoStart: false,
      antialias: false,
      backgroundAlpha: 0,
      powerPreference: 'high-performance',
      preference: 'webgl',
      preferWebGLVersion: 2,
    }).then(() => {
      initialized = true
      if (disposed) return

      const renderer = app.renderer
      const isWebGL2 = renderer instanceof WebGLRenderer
        && renderer.gl instanceof WebGL2RenderingContext
      if (!isWebGL2 || !hostRef.current) throw new Error('Pixi WebGL2 renderer unavailable')

      const canvas = app.canvas
      canvas.style.display = 'block'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      hostRef.current.appendChild(canvas)
      const runtime = new PixiBoardRuntime(app)
      runtimeRef.current = runtime
      hostRef.current.dataset.pixiWebgl2 = 'ready'
      runtime.update(latestPropsRef.current)
    }).catch(() => {
      if (!disposed) onUnavailableRef.current()
    })

    return () => {
      disposed = true
      runtimeRef.current?.destroy()
      runtimeRef.current = null
      if (initialized) app.destroy({ removeView: true }, { children: true })
    }
    // The renderer is initialized once for the selected route. Live board
    // updates are applied through the separate props effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    runtimeRef.current?.update(props)
  }, [props])

  return <div ref={hostRef} className="pixi-board-host" data-pixi-webgl2="pending" aria-hidden="true" />
})
