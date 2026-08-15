import { memo, type FormEvent } from 'react'
import { Check, Eye, EyeOff, Keyboard, Map, PanelRight, Play, RotateCcw, X } from 'lucide-react'
import type { PersistedState, ReviewOutcome } from '../../../core/contracts/types'
import { statusLabel } from '../../../core/presentation/formatters'
import { learningFor, sceneFor } from '../../../core/presentation/selectors'
import { isAnswerCorrect } from '../../vocabulary/domain/answerMatcher'
import { starterPack } from '../../language-packs/data/starterPack'
import { retrievability } from '../domain/scheduler'
import type { RunSession } from '../domain/runSession'

interface BoardRunOverlayProps {
  session: RunSession
  state: PersistedState
  onReveal: () => void
  onAnswer: (outcome: ReviewOutcome, revealed: boolean) => void
  onTypedChange: (value: string) => void
  onOpenCard: (cardId: string) => void
  onExitRun: () => void
}

/**
 * The active run is deliberately an overlay on the Board. The Board card stays
 * the thing being studied; this component only supplies the small amount of
 * interaction needed to produce a retrieval signal.
 */
export const BoardRunOverlay = memo(function BoardRunOverlay({ session, state, onReveal, onAnswer, onTypedChange, onOpenCard, onExitRun }: BoardRunOverlayProps) {
  const card = session.cards[session.currentIndex]
  if (!card) return null

  const learning = learningFor(state, card.id)
  const scene = sceneFor(starterPack.scenes, card.sceneId)
  const progress = session.cards.length ? (session.currentIndex / session.cards.length) * 100 : 0

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (session.revealed || !session.typedAnswer.trim()) return
    onAnswer(isAnswerCorrect(card, session.typedAnswer) ? 'typed' : 'miss', false)
  }

  return (
    <section className="board-run-overlay" aria-label="Active study run">
      <div className="run-overlay-main">
        <div className="run-overlay-route">
          <span className="run-overlay-live"><Play size={12} fill="currentColor" /> Live</span>
          <div>
            <strong>{session.label}</strong>
            <span><span className="scene-tab-dot" style={{ background: scene?.accent }} />{scene?.name} · Card {session.currentIndex + 1} of {session.cards.length}</span>
          </div>
        </div>
        <div className="run-overlay-score" aria-label="Run score">
          <span><Check size={13} /> {session.hits}</span>
          <span><X size={13} /> {session.misses}</span>
          <span className="run-overlay-stability">{statusLabel(learning.status)} · {Math.round(retrievability(learning) * 100)}%</span>
        </div>
        <div className="run-overlay-actions-top">
          <button className="run-overlay-detail" type="button" onClick={() => onOpenCard(card.id)}><PanelRight size={14} /> Details</button>
          <button className="run-overlay-exit" type="button" onClick={onExitRun} title="Leave run and keep the route saved"><Map size={14} /> Board</button>
        </div>
      </div>
      <div className="run-overlay-progress" aria-hidden="true"><span style={{ width: `${Math.max(4, progress)}%` }} /></div>
      <div className={`run-overlay-response ${session.revealed ? 'is-revealed' : ''}`}>
        <div className="run-overlay-prompt">
          {session.revealed ? <><Eye size={15} /> Back open — keep the scene and mark the return.</> : state.images[card.id] ? <><Keyboard size={15} /> Recall the target, then type it or choose a signal.</> : <><EyeOff size={15} /> No image yet — use the word on the focused Card as your cue.</>}
        </div>
        {session.revealed ? (
          <div className="answer-actions revealed-actions">
            <button className="primary-button" type="button" onClick={() => onAnswer('reveal', true)}><RotateCcw size={15} /> Continue · counted as miss</button>
          </div>
        ) : (
          <form className="run-overlay-form" onSubmit={handleSubmit}>
            <div className="answer-input-wrap"><Keyboard size={16} /><input value={session.typedAnswer} onChange={(event) => onTypedChange(event.target.value)} placeholder="Type the target word..." autoComplete="off" aria-label="Type the target word" /><span>Enter</span></div>
            <div className="answer-actions"><button className="hit-button" type="button" onClick={() => onAnswer('hit', false)}><Check size={16} /> I knew it</button><button className="miss-button" type="button" onClick={() => onAnswer('miss', false)}><X size={16} /> Missed</button><button className="reveal-button" type="button" onClick={onReveal}><Eye size={16} /> Reveal</button></div>
          </form>
        )}
      </div>
    </section>
  )
})
