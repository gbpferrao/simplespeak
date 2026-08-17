import { memo, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { ArrowRight, Check, Eye, EyeOff, Gauge, Keyboard, LocateFixed, Play, RotateCcw, X } from 'lucide-react'
import type { PersistedState, ReviewOutcome, RunCriterion } from '../../../core/contracts/types'
import { imageFor } from '../../../core/presentation/selectors'
import type { RunSession } from '../domain/runSession'
import { runHitRateAriaLabel, runHitRateUnit, useI18n } from '../../../core/i18n/i18n'

interface BoardRunOverlayProps {
  session: RunSession
  state: PersistedState
  runHitRate: number
  speedCueActive: boolean
  onOpenCard: () => void
  onAnswer: (outcome: ReviewOutcome, revealed: boolean) => void
  onSubmitTyped: (answer: string) => void
  onTypedChange: (value: string) => void
  onFocusCurrent: () => void
  onExitRun: () => void
}

function criterionTag(criterion: RunCriterion): string {
  const value = criterion.kind === 'retention'
    ? `${criterion.minRetention ?? 0}-${criterion.maxRetention ?? 100}%`
    : criterion.value ?? ''
  return criterion.mode === 'subtract' ? `-${value}` : value
}

/**
 * The active run is deliberately an overlay on the Board. The Board card stays
 * the thing being studied; this component only supplies the small amount of
 * interaction needed to produce a retrieval signal.
 */
export const BoardRunOverlay = memo(function BoardRunOverlay({ session, state, runHitRate, speedCueActive, onOpenCard, onAnswer, onSubmitTyped, onTypedChange, onFocusCurrent, onExitRun }: BoardRunOverlayProps) {
  const { t, locale } = useI18n(state.settings.uiLocale)
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const answerInputRef = useRef<HTMLInputElement>(null)
  const preserveAnswerFocusRef = useRef(false)
  const card = session.cards[session.currentIndex]

  useEffect(() => {
    if (!preserveAnswerFocusRef.current || session.revealed || session.finished) return
    const timeout = window.setTimeout(() => {
      preserveAnswerFocusRef.current = false
      const input = answerInputRef.current
      if (!input) return
      input.focus({ preventScroll: true })
      const cursorPosition = input.value.length
      input.setSelectionRange(cursorPosition, cursorPosition)
    })
    return () => window.clearTimeout(timeout)
  }, [session.currentIndex, session.revealed, session.finished])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    function updateKeyboardOffset(): void {
      // With adjustResize, innerHeight and visualViewport.height shrink
      // together, so the offset is zero and the HUD follows normal layout.
      // When the WebView keeps the layout viewport fixed, this is the space
      // that the keyboard covers and only the HUD moves into it.
      const currentViewport = window.visualViewport
      if (!currentViewport) return
      setKeyboardOffset(Math.max(0, window.innerHeight - currentViewport.height - currentViewport.offsetTop))
    }

    updateKeyboardOffset()
    window.addEventListener('resize', updateKeyboardOffset)
    viewport.addEventListener('resize', updateKeyboardOffset)
    viewport.addEventListener('scroll', updateKeyboardOffset)
    return () => {
      window.removeEventListener('resize', updateKeyboardOffset)
      viewport.removeEventListener('resize', updateKeyboardOffset)
      viewport.removeEventListener('scroll', updateKeyboardOffset)
    }
  }, [])

  if (!card) return null

  const imagePath = imageFor(state, card)
  const progress = session.cards.length ? ((session.currentIndex + (session.revealed ? 1 : 0)) / session.cards.length) * 100 : 0
  const filterTags = session.config.criteria.length > 0 ? session.config.criteria.map((criterion) => criterionTag(criterion)) : [session.label]

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const submittedAnswer = new FormData(event.currentTarget).get('typed-answer')
    if (typeof submittedAnswer !== 'string' || !submittedAnswer.trim()) return
    preserveAnswerFocusRef.current = document.activeElement === answerInputRef.current || preserveAnswerFocusRef.current
    onSubmitTyped(submittedAnswer)
    focusAnswerInputSoon()
  }

  function preserveAnswerFocus(): void {
    preserveAnswerFocusRef.current = document.activeElement === answerInputRef.current || preserveAnswerFocusRef.current
  }

  function focusAnswerInputSoon(): void {
    window.setTimeout(() => {
      if (!preserveAnswerFocusRef.current) return
      const input = answerInputRef.current
      if (!input) return
      preserveAnswerFocusRef.current = false
      input.focus({ preventScroll: true })
      const cursorPosition = input.value.length
      input.setSelectionRange(cursorPosition, cursorPosition)
    })
  }

  function reviewAnswer(outcome: ReviewOutcome): void {
    preserveAnswerFocus()
    onAnswer(outcome, false)
    focusAnswerInputSoon()
  }

  return (
    <section className="board-run-overlay" style={{ '--run-keyboard-offset': `${keyboardOffset}px` } as CSSProperties} aria-label={t('run.activeAria')}>
      <div className="run-overlay-main">
        <div className="run-overlay-route">
          <span className="run-overlay-live" title={t('run.live')} aria-label={t('run.live')}><Play size={13} fill="currentColor" /></span>
          <div className="run-overlay-filter-tags">{filterTags.map((tag, index) => <span className="run-overlay-tag" key={`${tag}-${index}`}>{tag}</span>)}</div>
        </div>
        <div className="run-overlay-score" aria-label={t('run.score')}>
          <span><Check size={13} /> {session.hits}</span>
          <span><X size={13} /> {session.misses}</span>
          <span><Eye size={13} /> {session.reveals}</span>
          <span className={`run-overlay-speed ${speedCueActive ? 'is-fast' : ''}`} title={runHitRateAriaLabel(locale)}><Gauge size={13} /> {Math.round(runHitRate)} {runHitRateUnit()}</span>
        </div>
        <div className="run-overlay-actions-top">
          <button className="run-overlay-icon-action" type="button" onClick={onFocusCurrent} aria-label={t('board.focusCurrent')} title={t('board.focusCurrent')}><LocateFixed size={14} /></button>
          <button className="run-overlay-icon-action run-overlay-close" type="button" onClick={onExitRun} aria-label={t('run.leaveRun')} title={t('run.leaveRun')}><X size={16} /></button>
        </div>
      </div>
      <div className="run-overlay-progress" aria-hidden="true"><span style={{ width: `${Math.max(4, progress)}%` }} /></div>
      <div className={`run-overlay-response ${session.revealed ? 'is-revealed' : ''}`}>
        <div className="run-overlay-prompt">
          {session.revealed ? <><Eye size={15} /> {t('run.backOpen')}</> : imagePath ? <><Keyboard size={15} /> {t('run.recall')}</> : <><EyeOff size={15} /> {t('run.noImage')}</>}
        </div>
        {session.revealed ? (
          <div className="answer-actions revealed-actions">
            <button className="primary-button" type="button" onClick={() => onAnswer('reveal', true)}><RotateCcw size={15} /> {t('run.continueMiss').split(' · ')[0]}</button>
          </div>
        ) : (
          <form className="run-overlay-form" onSubmit={handleSubmit}>
            <div className="answer-input-wrap"><Keyboard size={16} /><input ref={answerInputRef} name="typed-answer" value={session.typedAnswer} onChange={(event) => onTypedChange(event.target.value)} placeholder={t('run.typeTarget')} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="send" aria-label={t('run.typeTargetAria')} /><button className="send-answer-button" type="submit" onPointerDown={preserveAnswerFocus} disabled={!session.typedAnswer.trim()} aria-label={t('run.send')} title={t('run.send')}><ArrowRight size={17} /></button></div>
            <div className="answer-actions"><button className="hit-button" type="button" onPointerDown={preserveAnswerFocus} onClick={() => reviewAnswer('hit')}><Check size={16} /> {t('run.iKnewIt')}</button><button className="miss-button" type="button" onPointerDown={preserveAnswerFocus} onClick={() => reviewAnswer('miss')}><X size={16} /> {t('run.missed')}</button><button className="reveal-button" type="button" onClick={onOpenCard}><Eye size={16} /> {t('run.reveal')}</button></div>
          </form>
        )}
      </div>
    </section>
  )
})
