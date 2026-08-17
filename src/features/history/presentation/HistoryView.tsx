import { Activity, BarChart3, BookOpen, CalendarDays, ChevronRight, Flame, History, Info, Layers3, Lightbulb, Play, Sparkles, Target, Timer } from 'lucide-react'
import type { PersistedState, RunConfig } from '../../../core/contracts/types'
import { formatDuration } from '../../../core/presentation/formatters'
import { learningFor } from '../../../core/presentation/selectors'
import { retrievability } from '../../study/domain/scheduler'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { ProgressStats } from '../domain/progressStats'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { runLabelForLocale, useI18n } from '../../../core/i18n/i18n'

export function HistoryView({ locale, state, stats, onOpenCard, onRerunRun }: { locale: SupportedLocale; state: PersistedState; stats: ProgressStats; onOpenCard: (cardId: string) => void; onRerunRun: (config: RunConfig) => void }) {
  const { t } = useI18n(locale)
  const runs = state.runs.slice(0, 8)
  const totalReviewed = starterPack.cards.reduce((sum, card) => sum + learningFor(state, card.id).reviewCount, 0)
  const totalHits = state.runs.reduce((sum, run) => sum + run.hits, 0)
  const totalAttempts = state.runs.reduce((sum, run) => sum + run.hits + run.misses, 0)
  const averageAccuracy = totalAttempts ? Math.round((totalHits / totalAttempts) * 100) : 0
  const decayCards = starterPack.cards.filter((card) => learningFor(state, card.id).reviewCount > 0).sort((left, right) => retrievability(learningFor(state, left.id)) - retrievability(learningFor(state, right.id))).slice(0, 5)
  return (
    <section className="view history-view">
      <div className="view-heading">
        <div>
          <div className="eyebrow"><History size={14} /> {t('history.eyebrow')}</div>
          <h1>{t('history.title')}</h1>
          <p>{t('history.description')}</p>
        </div>
        <div className="history-heading-badge"><Activity size={15} /><span>{t('history.savedRuns', { count: state.runs.length })}</span></div>
      </div>
      <div className="history-kpis">
        <div><span><Layers3 size={14} /> {t('history.reviews')}</span><strong>{totalReviewed}</strong><small>{t('history.touchedCards', { count: stats.reviewed })}</small></div>
        <div><span><Target size={14} /> {t('history.averageAccuracy')}</span><strong>{averageAccuracy}%</strong><small>{t('history.selfReport')}</small></div>
        <div><span><Flame size={14} /> {t('history.anchored')}</span><strong>{stats.anchored}</strong><small>{t('history.boundedMeanings', { count: stats.total })}</small></div>
        <div><span><Timer size={14} /> {t('history.dueNow')}</span><strong>{stats.due}</strong><small>{t('history.reentryPoints')}</small></div>
      </div>
      <div className="history-grid">
        <div className="history-card chart-card">
          <div className="history-card-heading"><div><span className="eyebrow"><BarChart3 size={13} /> {t('history.runPerformance')}</span><h2>{t('history.signalReturns')}</h2></div><span className="chart-legend"><i className="legend-mint" /> {t('history.hits')} <i className="legend-violet" /> {t('history.attempts')}</span></div>
          <PerformanceChart locale={locale} runs={state.runs} />
        </div>
        <div className="history-card decay-card">
          <div className="history-card-heading"><div><span className="eyebrow"><Activity size={13} /> {t('history.stabilityWatch')}</span><h2>{t('history.cardsLosingAltitude')}</h2></div><span className="small-muted">{t('history.retrievability')}</span></div>
          {decayCards.length === 0 ? <div className="empty-history"><Lightbulb size={18} /><span>{t('history.completeRun')}</span></div> : decayCards.map((card) => {
            const learning = learningFor(state, card.id)
            const score = Math.round(retrievability(learning) * 100)
            return <button type="button" className="decay-row" key={card.id} onClick={() => onOpenCard(card.id)} aria-label={t('history.openStability', { card: card.target, score })}><span className="decay-word">{card.target}</span><span className="decay-bar"><i style={{ width: `${score}%` }} /></span><span>{score}%</span><ChevronRight size={14} /></button>
          })}
        </div>
      </div>
      <div className="history-card runs-card">
        <div className="history-card-heading"><div><span className="eyebrow"><CalendarDays size={13} /> {t('history.savedRunsHeading')}</span><h2>{t('history.recentPractice')}</h2></div></div>
        {runs.length === 0 ? <div className="empty-history large"><BookOpen size={22} /><strong>{t('history.firstRun')}</strong><span>{t('history.firstRunDescription')}</span></div> : <div className="run-history-list">{runs.map((run) => {
          const accuracy = run.hits + run.misses ? Math.round((run.hits / (run.hits + run.misses)) * 100) : 0
          const sceneName = starterPack.scenes.find((scene) => scene.id === run.sceneId)?.name ?? null
          const config: RunConfig = run.config ?? { preset: run.preset, sceneId: run.sceneId, limit: run.cardIds.length || 12, criteria: [] }
          const criteriaCount = config.criteria?.length ?? 0
          const statusLabel = run.status === 'unfinished' ? t('history.unfinished') : t('history.completed')
          return <div className="run-history-row" key={run.id}><span className="run-history-icon"><Sparkles size={15} /></span><div><strong>{runLabelForLocale(run.preset, sceneName, locale)}</strong><span>{new Date(run.finishedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - {t('history.cardsCount', { count: run.cardIds.length })} - {formatDuration(run.durationMs, locale)}{criteriaCount > 0 ? ` - ${t('history.criteriaCount', { count: criteriaCount })}` : ''}</span><small className={`run-history-status ${run.status}`}>{statusLabel}</small></div><span className="run-accuracy">{accuracy}% <small>{t('history.signal')}</small></span><span className="run-history-score">{run.hits} <small>{t('history.hitsSmall')}</small></span><button className="run-again-button" type="button" onClick={() => onRerunRun(config)} aria-label={t('history.runAgain')} title={t('history.runAgain')}><Play size={13} fill="currentColor" /> {t('history.runAgain')}</button></div>
        })}</div>}
      </div>
      <div className="history-footer-note"><Info size={15} /><span>{t('history.footer')}</span></div>
    </section>
  )
}

function PerformanceChart({ locale, runs }: { locale: SupportedLocale; runs: PersistedState['runs'] }) {
  const { t } = useI18n(locale)
  const sorted = [...runs].sort((left, right) => left.finishedAt - right.finishedAt).slice(-12)
  const points = sorted.map((run, index) => { const accuracy = run.hits + run.misses ? run.hits / (run.hits + run.misses) : 0; const x = sorted.length === 1 ? 200 : 30 + (index / (sorted.length - 1)) * 340; return { x, y: 140 - accuracy * 95, attemptY: 140 - Math.min(1, run.cardIds.length / 24) * 75 } })
  const mintPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const violetPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.attemptY}`).join(' ')
  return <div className="performance-chart"><svg viewBox="0 0 400 170" role="img" aria-label={t('history.chartAria')}><line x1="28" y1="45" x2="370" y2="45" /><line x1="28" y1="92" x2="370" y2="92" /><line x1="28" y1="140" x2="370" y2="140" /><text x="2" y="49">100</text><text x="10" y="96">50</text><text x="17" y="144">0</text>{points.length > 1 && <><path className="chart-area" d={`${mintPath} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`} /><path className="chart-line mint-line" d={mintPath} /><path className="chart-line violet-line" d={violetPath} /></>}{points.map((point, index) => <circle key={index} className="chart-point" cx={point.x} cy={point.y} r="3.5" />)}</svg>{points.length === 0 && <div className="chart-empty"><Sparkles size={18} /><span>{t('history.graphStart')}</span></div>}<div className="chart-axis"><span>{t('history.older')}</span><span>{t('history.recent')}</span></div></div>
}
