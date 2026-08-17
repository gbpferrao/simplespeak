import { useEffect, useMemo, useState } from 'react'
import starterPack from '../features/language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { composeImagePrompt } from '../features/image-generation/domain/promptComposer'
import { generateGoogleImage } from '../integrations/google-image/googleImageClient'
import { loadApiKey, saveApiKey } from '../features/settings/data/settingsRepository'
import { applyReview } from '../features/study/domain/scheduler'
import { selectCardsForRun } from '../features/study/domain/runSelector'
import { progressStats, type ProgressStats } from '../features/history/domain/progressStats'
import { isRemembered, makeRunRecord, runPadVolumeLevel, type RunConfig, type RunSession } from '../features/study/domain/runSession'
import { cardFor, learningFor, sceneFor } from '../core/presentation/selectors'
import { runLabelForLocale, translate } from '../core/i18n/i18n'
import { playReviewSound, setRunPadVolume, startRunPad, stopRunPad } from '../core/audio/reviewSounds'
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
  const [runConfig, setRunConfig] = useState<RunConfig>({ preset: 'due-nearby', sceneId: null, limit: 12, criteria: [] })
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

  useEffect(() => () => stopRunPad(), [])

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
    notify(translate(data.settings.uiLocale, apiKey.trim() ? 'notice.keySaved' : 'notice.keyRemoved'))
  }

  async function generateCardImage(card: WordCard, description: string): Promise<void> {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      notify(translate(data.settings.uiLocale, 'notice.addKey'))
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
      notify(translate(data.settings.uiLocale, 'notice.imageSaved', { card: card.target }))
    } catch (error) {
      const message = error instanceof Error ? error.message : translate(data.settings.uiLocale, 'notice.unknownImageError')
      const record: GenerationRecord = { ...generationBase, succeeded: false, error: message }
      setData((current) => ({ ...current, generations: [record, ...current.generations].slice(0, 120) }))
      notify(translate(data.settings.uiLocale, 'notice.imageNotChanged', { message }))
    } finally {
      setGeneratingCardId(null)
    }
  }

  function startRun(config = runConfig): void {
    const activeConfig: RunConfig = { ...config, criteria: config.criteria ?? [] }
    const cards = selectCardsForRun(starterPack.cards, data.learning, activeConfig)
    if (cards.length === 0) {
      notify(translate(data.settings.uiLocale, 'run.noCards'))
      return
    }
    const sceneName = sceneFor(starterPack.scenes, activeConfig.sceneId)?.name ?? null
    const now = Date.now()
    const session: RunSession = {
      id: newId('run'),
      preset: activeConfig.preset,
      config: activeConfig,
      label: runLabelForLocale(activeConfig.preset, sceneName, data.settings.uiLocale),
      sceneId: activeConfig.sceneId,
      cards,
      currentIndex: 0,
      revealed: false,
      typedAnswer: '',
      startedAt: now,
      responseStartedAt: now,
      correctHitTimestamps: [],
      correctStreakStartedAt: now,
      hits: 0,
      misses: 0,
      reveals: 0,
      completedIds: [],
      finished: false,
    }
    setRunConfig(activeConfig)
    setRunSession(session)
    setBoardFocusId(cards[0]?.id ?? null)
    setView('board')
    startRunPad(0)
  }

  function exitRun(): void {
    stopRunPad()
    setRunSession(null)
    setBoardFocusId(null)
    setView('board')
  }

  function continueRun(session: RunSession): void {
    const finalCard = session.currentIndex >= session.cards.length - 1
    if (finalCard) {
      const finishedAt = Date.now()
      const record = makeRunRecord({ session, completedIds: session.completedIds, hits: session.hits, misses: session.misses, reveals: session.reveals, finishedAt })
      setData((current) => ({ ...current, runs: [record, ...current.runs].slice(0, 120) }))
      stopRunPad()
      setRunSession((current) => current ? { ...session, finished: true } : current)
      notify(translate(data.settings.uiLocale, 'run.complete'))
      return
    }

    const nextCard = session.cards[session.currentIndex + 1]
    setRunPadVolume(runPadVolumeLevel(session))
    setRunSession((current) => current ? { ...current, currentIndex: current.currentIndex + 1, revealed: false, typedAnswer: '', responseStartedAt: Date.now(), hits: session.hits, misses: session.misses, reveals: session.reveals, completedIds: session.completedIds } : current)
    setBoardFocusId(nextCard?.id ?? null)
  }

  function revealRunCard(): void {
    if (!runSession || runSession.finished || runSession.revealed) return
    const card = runSession.cards[runSession.currentIndex]
    if (!card) return
    const completedAt = Date.now()
    const responseMs = completedAt - runSession.responseStartedAt
    const revealedSession: RunSession = {
      ...runSession,
      revealed: true,
      misses: runSession.misses + 1,
      reveals: runSession.reveals + 1,
      correctHitTimestamps: [],
      correctStreakStartedAt: completedAt,
      completedIds: [...runSession.completedIds, card.id],
    }

    setData((current) => ({
      ...current,
      learning: { ...current.learning, [card.id]: applyReview(learningFor(current, card.id), card.id, runSession.id, 'reveal', true, responseMs) },
    }))
    setFeedback('miss')
    playReviewSound('miss')
    setRunPadVolume(0)
    window.setTimeout(() => setFeedback(null), 650)
    setRunSession(revealedSession)
  }

  function answerRun(outcome: ReviewOutcome, revealed: boolean): void {
    if (!runSession || runSession.finished) return
    if (runSession.revealed) {
      continueRun(runSession)
      return
    }
    const card = runSession.cards[runSession.currentIndex]
    if (!card) return
    const completedAt = Date.now()
    const responseMs = completedAt - runSession.responseStartedAt
    const remembered = isRemembered(outcome)
    const nextHits = runSession.hits + (remembered ? 1 : 0)
    const nextMisses = runSession.misses + (remembered ? 0 : 1)
    const nextReveals = runSession.reveals + (revealed ? 1 : 0)
    const nextCorrectHitTimestamps = remembered ? [...runSession.correctHitTimestamps, completedAt] : []
    const nextCorrectStreakStartedAt = remembered
      ? (runSession.correctHitTimestamps.length ? runSession.correctStreakStartedAt : runSession.responseStartedAt)
      : completedAt
    const completedIds = [...runSession.completedIds, card.id]

    setData((current) => ({
      ...current,
      learning: { ...current.learning, [card.id]: applyReview(learningFor(current, card.id), card.id, runSession.id, outcome, revealed, responseMs) },
    }))
    setFeedback(remembered ? 'hit' : 'miss')
    playReviewSound(remembered ? 'hit' : 'miss')
    window.setTimeout(() => setFeedback(null), 650)

    continueRun({ ...runSession, hits: nextHits, misses: nextMisses, reveals: nextReveals, correctHitTimestamps: nextCorrectHitTimestamps, correctStreakStartedAt: nextCorrectStreakStartedAt, completedIds, revealed })
  }

  function setTypedAnswer(value: string): void {
    setRunSession((current) => current ? { ...current, typedAnswer: value } : current)
  }

  function saveNote(cardId: string, note: string): void {
    setData((current) => ({ ...current, notes: { ...current.notes, [cardId]: note } }))
    notify(translate(data.settings.uiLocale, 'notice.noteSaved'))
  }

  function resetLearning(): void {
    if (!window.confirm(translate(data.settings.uiLocale, 'notice.confirmReset'))) return
    const fresh = makeInitialState(starterPack.cards)
    stopRunPad()
    setData((current) => ({ ...fresh, settings: current.settings }))
    setRunSession(null)
    setView('board')
    notify(translate(data.settings.uiLocale, 'notice.resetDone'))
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
