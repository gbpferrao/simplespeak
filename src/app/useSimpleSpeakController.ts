import { useEffect, useMemo, useState } from 'react'
import starterPack from '../features/language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { composeImagePrompt } from '../features/image-generation/domain/promptComposer'
import { generateGoogleImage } from '../integrations/google-image/googleImageClient'
import { loadApiKey, saveApiKey } from '../features/settings/data/settingsRepository'
import { applyReview } from '../features/study/domain/scheduler'
import { selectCardsForRun } from '../features/study/domain/runSelector'
import { progressStats, type ProgressStats } from '../features/history/domain/progressStats'
import { isRemembered, makeRunRecord, runLabel, type RunConfig, type RunSession } from '../features/study/domain/runSession'
import { cardFor, learningFor, sceneFor } from '../core/presentation/selectors'
import { loadPersistedState, makeInitialState, savePersistedState } from '../core/persistence/localStateRepository'
import type { GenerationRecord, PersistedState, ReviewOutcome, Settings, View, WordCard } from '../core/contracts/types'

export type Feedback = 'hit' | 'miss' | null

export interface SimpleSpeakController {
  data: PersistedState
  apiKey: string
  setApiKey: (value: string) => void
  hydrated: boolean
  view: View
  setView: (view: View) => void
  selectedCardId: string | null
  setSelectedCardId: (cardId: string | null) => void
  stabilityCardId: string | null
  setStabilityCardId: (cardId: string | null) => void
  boardFocusId: string | null
  setBoardFocusId: (cardId: string | null) => void
  runSession: RunSession | null
  runConfig: RunConfig
  setRunConfig: (config: RunConfig) => void
  feedback: Feedback
  generatingCardId: string | null
  toast: string | null
  stats: ProgressStats
  selectedCard: WordCard | null
  stabilityCard: WordCard | null
  notify: (message: string) => void
  persistApiKey: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => void
  generateCardImage: (card: WordCard, description: string) => Promise<void>
  startRun: (config?: RunConfig) => void
  exitRun: () => void
  revealRunCard: () => void
  answerRun: (outcome: ReviewOutcome, revealed: boolean) => void
  setTypedAnswer: (value: string) => void
  saveNote: (cardId: string, note: string) => void
  resetLearning: () => void
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useSimpleSpeakController(): SimpleSpeakController {
  const [data, setData] = useState<PersistedState>(() => makeInitialState(starterPack.cards))
  const [apiKey, setApiKey] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [view, setView] = useState<View>('board')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [stabilityCardId, setStabilityCardId] = useState<string | null>(null)
  const [boardFocusId, setBoardFocusId] = useState<string | null>(null)
  const [runSession, setRunSession] = useState<RunSession | null>(null)
  const [runConfig, setRunConfig] = useState<RunConfig>({ preset: 'due-nearby', sceneId: null, limit: 12 })
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadPersistedState(starterPack.cards), loadApiKey()]).then(([storedState, storedApiKey]) => {
      if (cancelled) return
      setData(storedState)
      setApiKey(storedApiKey)
      setHydrated(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (hydrated) savePersistedState(data)
  }, [data, hydrated])

  const stats = useMemo(() => progressStats(data), [data])
  const selectedCard = cardFor(starterPack.cards, selectedCardId)
  const stabilityCard = cardFor(starterPack.cards, stabilityCardId)

  function notify(message: string): void {
    setToast(message)
    window.setTimeout(() => setToast((current) => current === message ? null : current), 3200)
  }

  function updateSettings(patch: Partial<Settings>): void {
    setData((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }

  async function persistApiKey(): Promise<void> {
    await saveApiKey(apiKey.trim())
    notify(apiKey.trim() ? 'Image key saved on this device.' : 'Image key removed.')
  }

  async function generateCardImage(card: WordCard, description: string): Promise<void> {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      notify('Add a Google AI API key in Settings before generating an image.')
      setView('settings')
      return
    }
    setGeneratingCardId(card.id)
    const settings = data.settings
    const prompt = composeImagePrompt({ card, description, note: data.notes[card.id] ?? '', settings, originLanguage: starterPack.originLanguage })
    const generationBase = {
      id: newId('generation'),
      cardId: card.id,
      prompt: prompt.userPrompt,
      modelId: settings.modelId,
      resolution: settings.resolution,
      occurredAt: Date.now(),
    }
    try {
      const image = await generateGoogleImage({
        apiKey: trimmedKey,
        modelId: settings.modelId,
        systemInstruction: prompt.systemInstruction,
        userPrompt: prompt.userPrompt,
        effort: settings.effort,
        resolution: settings.resolution,
        aspectRatio: settings.aspectRatio,
      })
      const record: GenerationRecord = { ...generationBase, succeeded: true, error: null }
      setData((current) => ({ ...current, images: { ...current.images, [card.id]: image }, generations: [record, ...current.generations].slice(0, 120) }))
      notify(`${card.target} image saved to this device.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown image generation error.'
      const record: GenerationRecord = { ...generationBase, succeeded: false, error: message }
      setData((current) => ({ ...current, generations: [record, ...current.generations].slice(0, 120) }))
      notify(`Image not changed: ${message}`)
    } finally {
      setGeneratingCardId(null)
    }
  }

  function startRun(config = runConfig): void {
    const cards = selectCardsForRun(starterPack.cards, data.learning, config.preset, config.sceneId, config.limit)
    if (cards.length === 0) {
      notify('No cards match this run. Try a wider preset.')
      return
    }
    const sceneName = sceneFor(starterPack.scenes, config.sceneId)?.name ?? null
    const now = Date.now()
    const session: RunSession = {
      id: newId('run'),
      preset: config.preset,
      label: runLabel(config, sceneName),
      sceneId: config.sceneId,
      cards,
      currentIndex: 0,
      revealed: false,
      typedAnswer: '',
      startedAt: now,
      responseStartedAt: now,
      hits: 0,
      misses: 0,
      reveals: 0,
      completedIds: [],
      finished: false,
    }
    setRunSession(session)
    setBoardFocusId(cards[0]?.id ?? null)
    notify(`${session.label} ready. One card at a time.`)
  }

  function exitRun(): void {
    setRunSession(null)
    setBoardFocusId(null)
    setView('board')
  }

  function revealRunCard(): void {
    setRunSession((current) => current ? { ...current, revealed: true } : current)
  }

  function answerRun(outcome: ReviewOutcome, revealed: boolean): void {
    if (!runSession || runSession.finished) return
    const card = runSession.cards[runSession.currentIndex]
    if (!card) return
    const responseMs = Date.now() - runSession.responseStartedAt
    const remembered = isRemembered(outcome)
    const nextHits = runSession.hits + (remembered ? 1 : 0)
    const nextMisses = runSession.misses + (remembered ? 0 : 1)
    const nextReveals = runSession.reveals + (revealed ? 1 : 0)
    const completedIds = [...runSession.completedIds, card.id]

    setData((current) => ({
      ...current,
      learning: { ...current.learning, [card.id]: applyReview(learningFor(current, card.id), card.id, runSession.id, outcome, revealed, responseMs) },
    }))
    setFeedback(remembered ? 'hit' : 'miss')
    window.setTimeout(() => setFeedback(null), 650)

    const finalCard = runSession.currentIndex >= runSession.cards.length - 1
    if (finalCard) {
      const finishedAt = Date.now()
      const record = makeRunRecord({ session: runSession, completedIds, hits: nextHits, misses: nextMisses, reveals: nextReveals, finishedAt })
      setData((current) => ({ ...current, runs: [record, ...current.runs].slice(0, 120) }))
      setRunSession((current) => current ? { ...current, hits: nextHits, misses: nextMisses, reveals: nextReveals, completedIds, finished: true } : current)
      notify('Run complete. The route is a little brighter.')
      return
    }
    const nextCard = runSession.cards[runSession.currentIndex + 1]
    setRunSession((current) => current ? { ...current, currentIndex: current.currentIndex + 1, revealed: false, typedAnswer: '', responseStartedAt: Date.now(), hits: nextHits, misses: nextMisses, reveals: nextReveals, completedIds } : current)
    setBoardFocusId(nextCard?.id ?? null)
  }

  function setTypedAnswer(value: string): void {
    setRunSession((current) => current ? { ...current, typedAnswer: value } : current)
  }

  function saveNote(cardId: string, note: string): void {
    setData((current) => ({ ...current, notes: { ...current.notes, [cardId]: note } }))
    notify('Mnemonic note saved.')
  }

  function resetLearning(): void {
    if (!window.confirm('Reset all review history and generated images for the starter pack?')) return
    const fresh = makeInitialState(starterPack.cards)
    setData((current) => ({ ...fresh, settings: current.settings }))
    setRunSession(null)
    setView('board')
    notify('The board is fresh again. Your image settings stayed saved.')
  }

  return {
    data,
    apiKey,
    setApiKey,
    hydrated,
    view,
    setView,
    selectedCardId,
    setSelectedCardId,
    stabilityCardId,
    setStabilityCardId,
    boardFocusId,
    setBoardFocusId,
    runSession,
    runConfig,
    setRunConfig,
    feedback,
    generatingCardId,
    toast,
    stats,
    selectedCard,
    stabilityCard,
    notify,
    persistApiKey,
    updateSettings,
    generateCardImage,
    startRun,
    exitRun,
    revealRunCard,
    answerRun,
    setTypedAnswer,
    saveNote,
    resetLearning,
  }
}
