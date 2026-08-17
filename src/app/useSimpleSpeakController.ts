import { useEffect, useMemo, useRef, useState } from 'react'
import starterPack from '../features/language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { applyReview } from '../features/study/domain/scheduler'
import { materializeRunConfig, selectCardsForRun, UNLIMITED_RUN_LIMIT } from '../features/study/domain/runSelector'
import { progressStats, type ProgressStats } from '../features/history/domain/progressStats'
import { isRemembered, makeRunRecord, runFinishTier, runPadVolumeLevel, type RunConfig, type RunSession } from '../features/study/domain/runSession'
import { isAnswerCorrect } from '../features/vocabulary/domain/answerMatcher'
import { cardFor, learningFor, sceneFor } from '../core/presentation/selectors'
import { runLabelForLocale, translate } from '../core/i18n/i18n'
import { playReviewSound, playRunFinishSound, setRunPadVolume, startRunPad, stopRunPad } from '../core/audio/reviewSounds'
import { loadPersistedState, makeInitialState, savePersistedState } from '../core/persistence/localStateRepository'
import type { PersistedState, ReviewOutcome, Settings, View, WordCard } from '../core/contracts/types'
import type { AppNotification, NotificationTone } from './notifications'

const MAX_NOTIFICATIONS = 3
const NOTIFICATION_LIFETIME_MS = 4600

export type Feedback = 'hit' | 'miss' | null

export interface SimpleSpeakController {
  data: PersistedState
  hydrated: boolean
  view: View
  setView: (view: View) => void
  selectedCardId: string | null
  setSelectedCardId: (cardId: string | null) => void
  boardFocusId: string | null
  setBoardFocusId: (cardId: string | null) => void
  runSession: RunSession | null
  runConfig: RunConfig
  setRunConfig: (config: RunConfig) => void
  feedback: Feedback
  notifications: AppNotification[]
  stats: ProgressStats
  selectedCard: WordCard | null
  notify: (message: string, tone?: NotificationTone) => void
  dismissNotification: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  startRun: (config?: RunConfig) => void
  endRun: () => void
  exitRun: () => void
  openRunCardDetails: () => void
  answerRun: (outcome: ReviewOutcome, revealed: boolean) => void
  submitTypedAnswer: (answer: string) => void
  setTypedAnswer: (value: string) => void
  saveNote: (cardId: string, note: string) => void
  resetLearning: () => void
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useSimpleSpeakController(): SimpleSpeakController {
  const [data, setData] = useState<PersistedState>(() => makeInitialState(starterPack.cards))
  const [hydrated, setHydrated] = useState(false)
  const [view, setView] = useState<View>('board')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [boardFocusId, setBoardFocusId] = useState<string | null>(null)
  const [runSession, setRunSession] = useState<RunSession | null>(null)
  const [runConfig, setRunConfig] = useState<RunConfig>({ preset: 'due-nearby', sceneId: null, limit: UNLIMITED_RUN_LIMIT, criteria: [] })
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const notificationTimers = useRef(new Map<string, number>())

  useEffect(() => {
    let cancelled = false
    loadPersistedState(starterPack.cards).then((storedState) => {
      if (cancelled) return
      setData(storedState)
      setHydrated(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (hydrated) savePersistedState(data)
  }, [data, hydrated])

  useEffect(() => () => {
    stopRunPad()
    notificationTimers.current.forEach((timer) => window.clearTimeout(timer))
    notificationTimers.current.clear()
  }, [])

  const stats = useMemo(() => progressStats(data), [data])
  const selectedCard = cardFor(starterPack.cards, selectedCardId)

  function dismissNotification(id: string): void {
    const timer = notificationTimers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    notificationTimers.current.delete(id)
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }

  function notify(message: string, tone: NotificationTone = 'success'): void {
    const id = newId('notification')
    setNotifications((current) => [{ id, message, tone }, ...current].slice(0, MAX_NOTIFICATIONS))
    const timer = window.setTimeout(() => {
      notificationTimers.current.delete(id)
      setNotifications((current) => current.filter((notification) => notification.id !== id))
    }, NOTIFICATION_LIFETIME_MS)
    notificationTimers.current.set(id, timer)
  }

  function updateSettings(patch: Partial<Settings>): void {
    setData((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }

  function startRun(config = runConfig): void {
    const activeConfig = materializeRunConfig({ ...config, criteria: config.criteria ?? [] })
    const cards = selectCardsForRun(starterPack.cards, data.learning, activeConfig)
    if (cards.length === 0) {
      notify(translate(data.settings.uiLocale, 'run.noCards'), 'warning')
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
      hitTimestamps: [],
      hitRateStartedAt: now,
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

  function endRun(): void {
    if (!runSession || runSession.finished) return
    const finishedAt = Date.now()
    const record = makeRunRecord({ session: runSession, status: 'unfinished', completedIds: runSession.completedIds, hits: runSession.hits, misses: runSession.misses, reveals: runSession.reveals, finishedAt })
    setData((current) => ({ ...current, runs: [record, ...current.runs].slice(0, 120) }))
    stopRunPad()
    setRunSession(null)
    setBoardFocusId(null)
    setView('board')
    notify(translate(data.settings.uiLocale, 'run.ended'))
  }

  function exitRun(): void {
    endRun()
  }

  function continueRun(session: RunSession): void {
    const finalCard = session.currentIndex >= session.cards.length - 1
    if (finalCard) {
      const finishedAt = Date.now()
      const record = makeRunRecord({ session, status: 'completed', completedIds: session.completedIds, hits: session.hits, misses: session.misses, reveals: session.reveals, finishedAt })
      setData((current) => ({ ...current, runs: [record, ...current.runs].slice(0, 120) }))
      stopRunPad()
      playRunFinishSound(runFinishTier(session.hits, session.misses))
      setRunSession((current) => current ? { ...session, finished: true } : current)
      notify(translate(data.settings.uiLocale, 'run.complete'))
      return
    }

    const nextCard = session.cards[session.currentIndex + 1]
    setRunPadVolume(runPadVolumeLevel(session))
    setRunSession((current) => current ? { ...current, currentIndex: current.currentIndex + 1, revealed: false, typedAnswer: '', responseStartedAt: Date.now(), hits: session.hits, misses: session.misses, reveals: session.reveals, hitTimestamps: session.hitTimestamps, hitRateStartedAt: session.hitRateStartedAt, completedIds: session.completedIds } : current)
    setBoardFocusId(nextCard?.id ?? null)
  }

  function openRunCardDetails(): void {
    if (!runSession || runSession.finished) return
    const card = runSession.cards[runSession.currentIndex]
    if (card) setSelectedCardId(card.id)
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
    const acceptedHit = outcome === 'hit' || outcome === 'typed'
    const remembered = isRemembered(outcome)
    const nextHits = runSession.hits + (acceptedHit ? 1 : 0)
    const nextMisses = runSession.misses + (acceptedHit ? 0 : 1)
    const nextReveals = runSession.reveals + (revealed ? 1 : 0)
    const nextHitTimestamps = remembered ? [...runSession.hitTimestamps, completedAt] : []
    const nextHitRateStartedAt = remembered
      ? (runSession.hitTimestamps.length ? runSession.hitRateStartedAt : runSession.responseStartedAt)
      : completedAt
    const completedIds = [...runSession.completedIds, card.id]

    setData((current) => ({
      ...current,
      learning: { ...current.learning, [card.id]: applyReview(learningFor(current, card.id), card.id, runSession.id, outcome, revealed, responseMs) },
    }))
    setFeedback(remembered ? 'hit' : 'miss')
    playReviewSound(remembered ? 'hit' : 'miss')
    window.setTimeout(() => setFeedback(null), 650)

    continueRun({ ...runSession, hits: nextHits, misses: nextMisses, reveals: nextReveals, hitTimestamps: nextHitTimestamps, hitRateStartedAt: nextHitRateStartedAt, completedIds, revealed })
  }

  function submitTypedAnswer(answer: string): void {
    if (!runSession || runSession.finished || runSession.revealed || !answer.trim()) return
    const card = runSession.cards[runSession.currentIndex]
    if (!card) return
    answerRun(isAnswerCorrect(card, answer) ? 'typed' : 'miss', false)
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
    hydrated,
    view,
    setView,
    selectedCardId,
    setSelectedCardId,
    boardFocusId,
    setBoardFocusId,
    runSession,
    runConfig,
    setRunConfig,
    feedback,
    notifications,
    stats,
    selectedCard,
    notify,
    dismissNotification,
    updateSettings,
    startRun,
    endRun,
    exitRun,
    openRunCardDetails,
    answerRun,
    submitTypedAnswer,
    setTypedAnswer,
    saveNote,
    resetLearning,
  }
}
