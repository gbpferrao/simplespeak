import { memo, type FormEvent } from 'react'
import { Check, Eye, EyeOff, Focus, Keyboard, Map, PanelRight, Play, RotateCcw, X } from 'lucide-react'
import type { PersistedState, ReviewOutcome } from '../../../core/contracts/types'
import { statusLabel as formatStatusLabel } from '../../../core/presentation/formatters'
import { learningFor, sceneFor } from '../../../core/presentation/selectors'
import { isAnswerCorrect } from '../../vocabulary/domain/answerMatcher'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { retrievability } from '../domain/scheduler'
import type { RunSession } from '../domain/runSession'
import { useI18n } from '../../../core/i18n/i18n'

interface BoardRunOverlayProps {
  session: RunSession
  state: PersistedState
  onReveal: () => void
  onAnswer: (outcome: ReviewOutcome, revealed: boolean) => void
  onTypedChange: (value: string) => void
  onOpenCard: (cardId: string) => void
  onFocusCurrent: () => void
  onExitRun: () => void
}

/**
 * The active run is deliberately an overlay on the Board. The Board card stays
 * the thing being studied; this component only supplies the small amount of
 * interaction needed to produce a retrieval signal.
 */
export const BoardRunOverlay = memo(function BoardRunOverlay({ session, state, onReveal, onAnswer, onTypedChange, onOpenCard, onFocusCurrent, onExitRun }: BoardRunOverlayProps) {
  const { t, locale } = useI18n(state.settings.uiLocale)
  const statusLabel = (status: Parameters<typeof formatStatusLabel>[0]): string => formatStatusLabel(status, locale)
  const card = session.cards[session.currentIndex]
  if (!card) return null

  const learning = learningFor(state, card.id)
  const scene = sceneFor(starterPack.scenes, card.sceneId)
  const progress = session.cards.length ? ((session.currentIndex + (session.revealed ? 1 : 0)) / session.cards.length) * 100 : 0

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (session.revealed || !session.typedAnswer.trim()) return
    onAnswer(isAnswerCorrect(card, session.typedAnswer) ? 'typed' : 'miss', false)
  }

  return (
    <section className="board-run-overlay" aria-label={t('run.activeAria')}>
      <div className="run-overlay-main">
        <div className="run-overlay-route">
          <span className="run-overlay-live"><Play size={12} fill="currentColor" /> {t('run.live')}</span>
          <div>
            <strong>{session.label}</strong>
            <span><span className="scene-tab-dot" style={{ background: scene?.accent }} />{t('run.cardPosition', { scene: scene?.name ?? '', current: session.currentIndex + 1, total: session.cards.length })}</span>
          </div>
        </div>
        <div className="run-overlay-score" aria-label={t('run.score')}>
          <span><Check size={13} /> {session.hits}</span>
          <span><X size={13} /> {session.misses}</span>
          <span><Eye size={13} /> {session.reveals}</span>
          <span className="run-overlay-stability">{statusLabel(learning.status)} · {Math.round(retrievability(learning) * 100)}%</span>
        </div>
        <div className="run-overlay-actions-top">
          <button className="run-overlay-icon-action" type="button" onClick={onFocusCurrent} aria-label={t('board.focusCurrent')} title={t('board.focusCurrent')}><Focus size={14} /></button>
          <button className="run-overlay-detail" type="button" onClick={() => onOpenCard(card.id)}><PanelRight size={14} /> {t('run.details')}</button>
          <button className="run-overlay-exit" type="button" onClick={onExitRun} title={t('run.leaveRun')}><Map size={14} /> {t('run.board')}</button>
        </div>
      </div>
      <div className="run-overlay-progress" aria-hidden="true"><span style={{ width: `${Math.max(4, progress)}%` }} /></div>
      <div className={`run-overlay-response ${session.revealed ? 'is-revealed' : ''}`}>
        <div className="run-overlay-prompt">
          {session.revealed ? <><Eye size={15} /> {t('run.backOpen')}</> : state.images[card.id] ? <><Keyboard size={15} /> {t('run.recall')}</> : <><EyeOff size={15} /> {t('run.noImage')}</>}
        </div>
        {session.revealed ? (
          <div className="answer-actions revealed-actions">
            <button className="primary-button" type="button" onClick={() => onAnswer('reveal', true)}><RotateCcw size={15} /> {t('run.continueMiss').split(' · ')[0]}</button>
          </div>
        ) : (
          <form className="run-overlay-form" onSubmit={handleSubmit}>
            <div className="answer-input-wrap"><Keyboard size={16} /><input value={session.typedAnswer} onChange={(event) => onTypedChange(event.target.value)} placeholder={t('run.typeTarget')} autoComplete="off" aria-label={t('run.typeTargetAria')} /><span>{t('run.enter')}</span></div>
            <div className="answer-actions"><button className="hit-button" type="button" onClick={() => onAnswer('hit', false)}><Check size={16} /> {t('run.iKnewIt')}</button><button className="miss-button" type="button" onClick={() => onAnswer('miss', false)}><X size={16} /> {t('run.missed')}</button><button className="reveal-button" type="button" onClick={onReveal}><Eye size={16} /> {t('run.reveal')}</button></div>
          </form>
        )}
      </div>
    </section>
  )
})
