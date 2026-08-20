import type { FormEvent } from 'react'
import { Check, CheckCircle2, ChevronRight, Compass, Eye, Keyboard, Layers3, Lightbulb, Map, Play, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, Target, Timer, X } from 'lucide-react'
import type { PersistedState, ReviewOutcome } from '../../../core/contracts/types'
import { formatDuration, statusLabel } from '../../../core/presentation/formatters'
import { learningFor, sceneFor } from '../../../core/presentation/selectors'
import { isDue, retrievability } from '../domain/scheduler'
import { criteriaForRunPreset, materializeRunConfig, UNLIMITED_RUN_LIMIT } from '../domain/runSelector'
import { isAnswerCorrect } from '../../vocabulary/domain/answerMatcher'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { RunConfig, RunSession } from '../domain/runSession'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { useI18n } from '../../../core/i18n/i18n'

interface RunViewProps {
  session: RunSession | null
  state: PersistedState
  config: RunConfig
  setConfig: (config: RunConfig) => void
  onStart: (config?: RunConfig) => void
  onOpenCurrentCard: () => void
  onAnswer: (outcome: ReviewOutcome, revealed: boolean) => void
  onTypedChange: (value: string) => void
  onOpenCard: (cardId: string) => void
  onOpenBoard: () => void
}

export function RunView({ session, state, config, setConfig, onStart, onOpenCurrentCard, onAnswer, onTypedChange, onOpenCard, onOpenBoard }: RunViewProps) {
  const { locale, t } = useI18n(state.settings.uiLocale)
  if (!session) return <RunSetup locale={locale} state={state} config={config} setConfig={setConfig} onStart={() => onStart(config)} onOpenBoard={onOpenBoard} />
  if (session.finished) return <RunSummary locale={locale} session={session} onStart={() => onStart(config)} onOpenBoard={onOpenBoard} />
  const activeSession = session

  const card = session.cards[session.currentIndex]
  if (!card) return null
  const learning = learningFor(state, card.id)
  const image = state.images[card.id]
  const progress = session.cards.length ? (session.currentIndex / session.cards.length) * 100 : 0
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (activeSession.revealed || !activeSession.typedAnswer.trim()) return
    onAnswer(isAnswerCorrect(card, activeSession.typedAnswer) ? 'typed' : 'miss', false)
  }

  return (
    <section className="view run-view focused-run-page">
      <div className="run-header"><div><div className="eyebrow"><Play size={14} /> {session.label}</div><h1>{t('run.chooseReturn')}</h1><p>{t('run.recall')}</p></div><button className="soft-button" type="button" onClick={onOpenBoard}><Map size={15} /> {t('nav.backToBoard')}</button></div>
      <div className="run-progress-bar"><span style={{ width: `${Math.max(3, progress)}%` }} /></div>
      <div className="run-meta-row"><span><span className="live-dot" /> {t('run.cardPositionShort', { current: session.currentIndex + 1, total: session.cards.length })}</span><span className={`stability-inline status-${learning.status}`}>{t('run.stabilityNow', { status: statusLabel(learning.status, locale), count: Math.round(retrievability(learning) * 100) })}</span></div>
      <div className={`study-stage ${session.revealed ? 'is-revealed' : ''}`}>
        <div className="study-stage-top"><span className="stage-scene"><span className="scene-tab-dot" style={{ background: sceneFor(starterPack.scenes, card.sceneId)?.accent }} />{sceneFor(starterPack.scenes, card.sceneId)?.name}</span></div>
        <div className="study-card-wrap"><button className={`study-card ${image ? 'has-image' : 'word-card'} ${session.revealed ? 'revealed' : ''}`} type="button" onClick={session.revealed ? undefined : onOpenCurrentCard}>{!session.revealed && image && <img src={image} alt="" />}{!session.revealed && !image && <span className="study-word-fallback">{card.target}</span>}{session.revealed && <div className="study-card-back"><span className="back-label">{t('run.targetWord')}</span><strong>{card.target}</strong><span className="back-translation">{card.origin}</span><span className="back-example">&quot;{card.example?.target ?? card.target}&quot;</span><span className="back-note">{state.notes[card.id] || card.note || t('card.noMnemonic')}</span></div>}{!session.revealed && <span className="study-card-hint">{t('run.tapReveal')}</span>}</button></div>
        <div className="study-prompt">{session.revealed ? <><Eye size={15} /> {t('run.backOpen')}</> : image ? <><Keyboard size={15} /> {t('run.recall')}</> : <span className="run-focused-word">{card.target}</span>}</div>
        {session.revealed ? <div className="answer-actions revealed-actions"><button className="primary-button" type="button" onClick={() => onAnswer('reveal', true)}><RotateCcw size={15} /> {t('run.continueMiss')}</button></div> : <form className="answer-form" onSubmit={handleSubmit}><div className="answer-input-wrap"><Keyboard size={16} /><input name="typed-answer" autoFocus value={session.typedAnswer} onChange={(event) => onTypedChange(event.target.value)} placeholder={t('run.typeTarget')} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="send" /><span>{t('run.enter')}</span></div><div className="answer-actions"><button className="hit-button" type="button" aria-label={`${t('run.hit')}: ${session.hits}`} onClick={() => onAnswer('hit', false)}><Check size={16} /> <span className="answer-action-label">{t('run.hit')}</span><small className="answer-action-count" aria-hidden="true">({session.hits})</small></button><button className="miss-button" type="button" aria-label={`${t('run.miss')}: ${session.misses}`} onClick={() => onAnswer('miss', false)}><X size={16} /> <span className="answer-action-label">{t('run.miss')}</span><small className="answer-action-count" aria-hidden="true">({session.misses})</small></button><button className="reveal-button" type="button" aria-label={`${t('run.review')}: ${session.reveals}`} onClick={onOpenCurrentCard}><Eye size={16} /> <span className="answer-action-label">{t('run.review')}</span><small className="answer-action-count" aria-hidden="true">({session.reveals})</small></button></div></form>}
      </div>
      <div className="run-route-strip"><div className="route-strip-label"><span>{t('run.route')}</span><span>{t('run.percentComplete', { count: Math.round(progress) })}</span></div><div className="route-dots">{session.cards.map((routeCard, index) => <button key={routeCard.id} className={`${index < session.currentIndex ? 'done' : ''} ${index === session.currentIndex ? 'current' : ''}`} type="button" onClick={() => onOpenCard(routeCard.id)} aria-label={`${t('run.details')}: ${routeCard.target}`}><span /></button>)}</div></div>
    </section>
  )
}

function RunSetup({ locale, state, config, setConfig, onStart, onOpenBoard }: { locale: SupportedLocale; state: PersistedState; config: RunConfig; setConfig: (config: RunConfig) => void; onStart: () => void; onOpenBoard: () => void }) {
  const { t } = useI18n(locale)
  const dueCount = starterPack.cards.filter((card) => isDue(learningFor(state, card.id))).length
  const presets: Array<{ id: RunConfig['preset']; title: string; description: string; icon: typeof Timer }> = [
    { id: 'due-nearby', title: t('run.dueNearby'), description: t('history.description'), icon: Timer },
    { id: 'scene', title: t('run.oneScene'), description: t('run.chooseReturn'), icon: Compass },
    { id: 'all', title: t('run.allWords'), description: t('run.allWords'), icon: Layers3 },
    { id: 'custom', title: t('run.customRoute'), description: t('run.chooseScene'), icon: SlidersHorizontal },
  ]

  return (
    <section className="view run-setup-view">
      <div className="run-header"><div><div className="eyebrow"><Target size={14} /> {t('run.chooseReturn')}</div><h1>{t('run.chooseReturn')}</h1><p>{t('run.setupDescription')}</p></div><button className="soft-button" type="button" onClick={onOpenBoard}><Map size={15} /> {t('nav.backToBoard')}</button></div>
      <div className="setup-grid">
        <div className="setup-main">
          <div className="preset-grid">{presets.map(({ id, title, description, icon: Icon }) => <button key={id} className={`preset-card ${config.preset === id ? 'selected' : ''}`} type="button" onClick={() => setConfig(materializeRunConfig({ ...config, preset: id, sceneId: id === 'scene' || id === 'custom' ? config.sceneId : null, limit: UNLIMITED_RUN_LIMIT, criteria: criteriaForRunPreset(id, id === 'scene' || id === 'custom' ? config.sceneId : null) }))}><span className="preset-icon"><Icon size={18} /></span><span className="preset-copy"><strong>{title}</strong><span>{description}</span></span>{config.preset === id && <CheckCircle2 className="preset-check" size={18} />}</button>)}</div>
          {(config.preset === 'scene' || config.preset === 'custom') && <div className="setup-control-card"><div className="control-card-title"><span><Compass size={15} /> {t('run.oneScene')}</span><span className="small-muted">{t('run.chooseScene')}</span></div><div className="select-row">{starterPack.scenes.map((scene) => <button key={scene.id} className={config.sceneId === scene.id ? 'selected' : ''} type="button" onClick={() => setConfig(materializeRunConfig({ ...config, sceneId: scene.id, limit: UNLIMITED_RUN_LIMIT, criteria: criteriaForRunPreset(config.preset, scene.id) }))}><span className="scene-tab-dot" style={{ background: scene.accent }} />{scene.name}</button>)}</div></div>}
          <button className="primary-button start-run-large" type="button" onClick={onStart}><Play size={17} /> {t('run.startRoute')} <ChevronRight size={16} /></button>
        </div>
        <aside className="setup-aside"><div className="setup-preview-card"><span className="eyebrow"><Sparkles size={13} /> {t('run.dueNow', { count: dueCount })}</span></div><div className="setup-note"><ShieldCheck size={16} /><span>{t('run.continueMiss')}</span></div></aside>
      </div>
    </section>
  )
}

function RunSummary({ locale, session, onStart, onOpenBoard }: { locale: SupportedLocale; session: RunSession; onStart: () => void; onOpenBoard: () => void }) {
  const { t } = useI18n(locale)
  const total = session.hits + session.misses
  const accuracy = total ? Math.round((session.hits / total) * 100) : 0
  return <section className="view run-summary-view"><div className="summary-hero"><div className="summary-orbit"><Sparkles size={25} /></div><div className="eyebrow"><CheckCircle2 size={14} /> {t('run.complete')}</div><h1>{t('run.complete')}</h1><p>{t('history.footer')}</p></div><div className="summary-metrics"><div><span>{t('history.averageAccuracy')}</span><strong>{accuracy}%</strong><small>{session.hits} {t('history.hits')} / {session.misses} {t('run.missed').toLowerCase()}</small></div><div><span>{t('run.duration')}</span><strong>{formatDuration(Date.now() - session.startedAt, locale)}</strong><small>{session.reveals} {t('run.reveal').toLowerCase()}</small></div><div><span>{t('history.signal')}</span><strong>{session.hits - session.misses > 0 ? t('status.anchored') : t('status.emerging')}</strong><small>{t('notice.noteSaved')}</small></div></div><div className="summary-actions"><button className="primary-button" type="button" onClick={onStart}><RotateCcw size={16} /> {t('run.startRoute')}</button><button className="soft-button" type="button" onClick={onOpenBoard}><Map size={16} /> {t('nav.openBoard')}</button></div><div className="summary-affirmation"><Lightbulb size={17} /><span>{t('history.footer')}</span></div></section>
}
