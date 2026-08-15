import type { FormEvent } from 'react'
import { Check, CheckCircle2, ChevronRight, Compass, Eye, EyeOff, Keyboard, Layers3, Lightbulb, Map, PanelRight, Play, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, Target, Timer, X } from 'lucide-react'
import type { PersistedState, ReviewOutcome } from '../../../core/contracts/types'
import { formatDuration, statusLabel } from '../../../core/presentation/formatters'
import { learningFor, sceneFor } from '../../../core/presentation/selectors'
import { isDue, retrievability } from '../domain/scheduler'
import { isAnswerCorrect } from '../../vocabulary/domain/answerMatcher'
import { starterPack } from '../../language-packs/data/starterPack'
import type { RunConfig, RunSession } from '../domain/runSession'

interface RunViewProps {
  session: RunSession | null
  state: PersistedState
  config: RunConfig
  setConfig: (config: RunConfig) => void
  onStart: (config?: RunConfig) => void
  onReveal: () => void
  onAnswer: (outcome: ReviewOutcome, revealed: boolean) => void
  onTypedChange: (value: string) => void
  onOpenCard: (cardId: string) => void
  onOpenBoard: () => void
}

export function RunView({ session, state, config, setConfig, onStart, onReveal, onAnswer, onTypedChange, onOpenCard, onOpenBoard }: RunViewProps) {
  if (!session) return <RunSetup state={state} config={config} setConfig={setConfig} onStart={() => onStart(config)} onOpenBoard={onOpenBoard} />
  if (session.finished) return <RunSummary session={session} onStart={() => onStart(config)} onOpenBoard={onOpenBoard} />

  const card = session.cards[session.currentIndex]
  if (!card) return null
  const learning = learningFor(state, card.id)
  const image = state.images[card.id]
  const progress = session.cards.length ? (session.currentIndex / session.cards.length) * 100 : 0

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!session || session.revealed || !session.typedAnswer.trim()) return
    onAnswer(isAnswerCorrect(card, session.typedAnswer) ? 'typed' : 'miss', false)
  }

  return (
    <section className="view run-view focused-run-page">
      <div className="run-header"><div><div className="eyebrow"><Play size={14} /> Active run - {session.label}</div><h1>One card at a time.</h1><p>Try the target first. Reveal is a miss by default; a typed answer can be a hit.</p></div><button className="soft-button" type="button" onClick={onOpenBoard}><Map size={15} /> Back to board</button></div>
      <div className="run-progress-bar"><span style={{ width: `${Math.max(3, progress)}%` }} /></div>
      <div className="run-meta-row"><span><span className="live-dot" /> {session.currentIndex + 1} of {session.cards.length}</span><span>{session.hits} hits - {session.misses} misses - {session.reveals} reveals</span><span className={`stability-inline status-${learning.status}`}>{statusLabel(learning.status)} - {Math.round(retrievability(learning) * 100)}% now</span></div>
      <div className={`study-stage ${session.revealed ? 'is-revealed' : ''}`}>
        <div className="study-stage-top"><span className="stage-scene"><span className="scene-tab-dot" style={{ background: sceneFor(starterPack.scenes, card.sceneId)?.accent }} />{sceneFor(starterPack.scenes, card.sceneId)?.name}</span><button type="button" onClick={() => onOpenCard(card.id)}><PanelRight size={14} /> Card details</button></div>
        <div className="study-card-wrap"><button className={`study-card ${image ? 'has-image' : 'word-card'} ${session.revealed ? 'revealed' : ''}`} type="button" onClick={session.revealed ? undefined : onReveal}>{!session.revealed && image && <img src={image} alt="" />}{!session.revealed && !image && <span className="study-word-fallback">{card.target}</span>}{session.revealed && <div className="study-card-back"><span className="back-label">Target word</span><strong>{card.target}</strong><span className="back-translation">{card.origin}</span><span className="back-example">&quot;{card.exampleTarget}&quot;</span><span className="back-note">{state.notes[card.id] || card.noteSeed}</span></div>}{!session.revealed && <span className="study-card-hint">Tap to reveal</span>}</button></div>
        <div className="study-prompt">{session.revealed ? <><Eye size={15} /> Keep the scene. Mark this return as missed.</> : image ? <><Keyboard size={15} /> Type the target word, or use the buttons below.</> : <><EyeOff size={15} /> This Card has no visual yet. The word is your front.</>}</div>
        {session.revealed ? <div className="answer-actions revealed-actions"><button className="primary-button" type="button" onClick={() => onAnswer('reveal', true)}><RotateCcw size={15} /> Continue - counted as miss</button></div> : <form className="answer-form" onSubmit={handleSubmit}><div className="answer-input-wrap"><Keyboard size={16} /><input autoFocus value={session.typedAnswer} onChange={(event) => onTypedChange(event.target.value)} placeholder="Type the target word..." autoComplete="off" /><span>Enter</span></div><div className="answer-actions"><button className="hit-button" type="button" onClick={() => onAnswer('hit', false)}><Check size={16} /> I knew it</button><button className="miss-button" type="button" onClick={() => onAnswer('miss', false)}><X size={16} /> I missed it</button><button className="reveal-button" type="button" onClick={onReveal}><Eye size={16} /> Reveal</button></div></form>}
      </div>
      <div className="run-route-strip"><div className="route-strip-label"><span>Route</span><span>{Math.round(progress)}% complete</span></div><div className="route-dots">{session.cards.map((routeCard, index) => <button key={routeCard.id} className={`${index < session.currentIndex ? 'done' : ''} ${index === session.currentIndex ? 'current' : ''}`} type="button" onClick={() => onOpenCard(routeCard.id)} aria-label={`Open ${routeCard.target}`}><span /></button>)}</div></div>
    </section>
  )
}

function RunSetup({ state, config, setConfig, onStart, onOpenBoard }: { state: PersistedState; config: RunConfig; setConfig: (config: RunConfig) => void; onStart: () => void; onOpenBoard: () => void }) {
  const stats = { total: starterPack.cards.length, due: starterPack.cards.filter((card) => isDueForState(state, card.id)).length }
  const presets: Array<{ id: RunConfig['preset']; title: string; description: string; icon: typeof Timer }> = [{ id: 'due-nearby', title: 'Due + nearby', description: 'Stable words that need a return, with close neighbors.', icon: Timer }, { id: 'scene', title: 'One scene', description: 'Stay inside one visual memory palace room.', icon: Compass }, { id: 'all', title: 'All words', description: 'Survey a wider orbit across the loaded pack.', icon: Layers3 }, { id: 'custom', title: 'Custom route', description: 'Choose the size and scene yourself.', icon: SlidersHorizontal }]
  return <section className="view run-setup-view"><div className="run-header"><div><div className="eyebrow"><Target size={14} /> Choose a route</div><h1>What kind of return feels right?</h1><p>There is no streak to lose. Pick a useful amount of friction for today.</p></div><button className="soft-button" type="button" onClick={onOpenBoard}><Map size={15} /> Back to board</button></div><div className="setup-grid"><div className="setup-main"><div className="preset-grid">{presets.map(({ id, title, description, icon: Icon }) => <button key={id} className={`preset-card ${config.preset === id ? 'selected' : ''}`} type="button" onClick={() => setConfig({ ...config, preset: id })}><span className="preset-icon"><Icon size={18} /></span><span className="preset-copy"><strong>{title}</strong><span>{description}</span></span>{config.preset === id && <CheckCircle2 className="preset-check" size={18} />}</button>)}</div>{(config.preset === 'scene' || config.preset === 'custom') && <div className="setup-control-card"><div className="control-card-title"><span><Compass size={15} /> Scene</span><span className="small-muted">Choose one</span></div><div className="select-row">{starterPack.scenes.map((scene) => <button key={scene.id} className={config.sceneId === scene.id ? 'selected' : ''} type="button" onClick={() => setConfig({ ...config, sceneId: scene.id })}><span className="scene-tab-dot" style={{ background: scene.accent }} />{scene.name}</button>)}</div></div>}<div className="setup-control-card"><div className="control-card-title"><span><SlidersHorizontal size={15} /> Route size</span><strong>{config.limit} cards</strong></div><input className="range-input" type="range" min="4" max={Math.min(30, stats.total)} value={config.limit} onChange={(event) => setConfig({ ...config, limit: Number(event.target.value) })} /><div className="range-labels"><span>Quick 4</span><span>Deep {Math.min(30, stats.total)}</span></div></div><button className="primary-button start-run-large" type="button" onClick={onStart}><Play size={17} /> Start {config.limit}-card run <ChevronRight size={16} /></button></div><aside className="setup-aside"><div className="setup-preview-card"><span className="eyebrow"><Sparkles size={13} /> Your return window</span><strong>{stats.due} cards are asking gently.</strong><p>Your schedule is a guide, not a debt. A shorter run still protects the route.</p><div className="preview-stat"><span>Daily target</span><strong>{state.settings.dailyTarget} cards</strong></div><div className="preview-stat"><span>Time horizon</span><strong>{state.settings.timeframeDays} days</strong></div></div><div className="setup-note"><ShieldCheck size={16} /><span>Reveal counts as a miss because retrieval is the useful signal. No shame, just a better next interval.</span></div></aside></div></section>
}

function isDueForState(state: PersistedState, cardId: string): boolean {
  return isDue(learningFor(state, cardId))
}

function RunSummary({ session, onStart, onOpenBoard }: { session: RunSession; onStart: () => void; onOpenBoard: () => void }) {
  const total = session.hits + session.misses
  const accuracy = total ? Math.round((session.hits / total) * 100) : 0
  return <section className="view run-summary-view"><div className="summary-hero"><div className="summary-orbit"><Sparkles size={25} /></div><div className="eyebrow"><CheckCircle2 size={14} /> Route complete</div><h1>The route held.</h1><p>You gave {session.cards.length} Cards a clear signal. The next return is already recalculating.</p></div><div className="summary-metrics"><div><span>Accuracy</span><strong>{accuracy}%</strong><small>{session.hits} hits / {session.misses} misses</small></div><div><span>Duration</span><strong>{formatDuration(Date.now() - session.startedAt)}</strong><small>{session.reveals} reveals counted as misses</small></div><div><span>Momentum</span><strong>{session.hits - session.misses > 0 ? 'Bright' : 'Honest'}</strong><small>The useful signal is saved</small></div></div><div className="summary-actions"><button className="primary-button" type="button" onClick={onStart}><RotateCcw size={16} /> Run another route</button><button className="soft-button" type="button" onClick={onOpenBoard}><Map size={16} /> See the board</button></div><div className="summary-affirmation"><Lightbulb size={17} /><span>Progress here is a living route, not a daily performance grade. Come back when you can; the app will meet you where the signal is.</span></div></section>
}
