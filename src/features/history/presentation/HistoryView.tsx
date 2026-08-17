import { Activity, BarChart3, BookOpen, CalendarDays, ChevronRight, History, Info, Layers3, Lightbulb, Play, Sparkles, Target } from 'lucide-react'
import type { PersistedState, RunConfig } from '../../../core/contracts/types'
import { formatDuration } from '../../../core/presentation/formatters'
import { learningFor } from '../../../core/presentation/selectors'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { ACQUIRED_RETENTION_THRESHOLD, DUE_RETENTION_THRESHOLD, retentionBand, type RetentionBand } from '../../study/domain/retentionBands'
import { retrievability } from '../../study/domain/scheduler'
import type { ProgressStats } from '../domain/progressStats'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { runLabelForLocale, useI18n } from '../../../core/i18n/i18n'

type PackCard = (typeof starterPack.cards)[number]

interface RetentionCard {
  card: PackCard
  band: RetentionBand
  score: number
}

export function HistoryView({ locale, state, stats, onOpenCard, onRerunRun }: { locale: SupportedLocale; state: PersistedState; stats: ProgressStats; onOpenCard: (cardId: string) => void; onRerunRun: (config: RunConfig) => void }) {
  const { t } = useI18n(locale)
  const now = Date.now()
  const runs = [...state.runs].sort((left, right) => right.finishedAt - left.finishedAt).slice(0, 8)
  const retentionCards = starterPack.cards.map((card): RetentionCard => {
    const learning = learningFor(state, card.id)
    return { card, band: retentionBand(learning, now), score: Math.round(retrievability(learning, now) * 100) }
  })
  const acquiredCards = retentionCards.filter((item) => item.band === 'acquired').sort((left, right) => right.score - left.score)
  const dueCards = retentionCards.filter((item) => item.band === 'due').sort((left, right) => left.score - right.score)
  const needsReturnCards = retentionCards.filter((item) => item.band === 'lost' || item.band === 'new').sort((left, right) => {
    if (left.band !== right.band) return left.band === 'lost' ? -1 : 1
    return left.score - right.score
  })

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
        <div><span><Layers3 size={14} /> {t('history.reviews')}</span><strong>{stats.totalReviews}</strong><small>{t('history.touchedCards', { count: stats.reviewed })}</small></div>
        <div><span><Target size={14} /> {t('history.averageAccuracy')}</span><strong>{stats.averageAccuracy}%</strong><small>{t('history.selfReport')}</small></div>
        <div><span><Sparkles size={14} /> {t('history.acquired')}</span><strong>{stats.acquired}</strong><small>{t('history.acquiredThreshold', { count: Math.round(ACQUIRED_RETENTION_THRESHOLD * 100) })}</small></div>
      </div>

      <div className="history-retention-grid">
        <RetentionPanel locale={locale} title={t('history.acquired')} description={t('history.acquiredDescription', { count: Math.round(ACQUIRED_RETENTION_THRESHOLD * 100) })} count={stats.acquired} total={stats.total} cards={acquiredCards} variant="acquired" onOpenCard={onOpenCard} />
        <RetentionPanel locale={locale} title={t('history.dueBand')} description={t('history.dueBandDescription', { min: Math.round(DUE_RETENTION_THRESHOLD * 100), max: Math.round(ACQUIRED_RETENTION_THRESHOLD * 100) - 1 })} count={stats.dueBand} total={stats.total} cards={dueCards} variant="due" onOpenCard={onOpenCard} />
        <RetentionPanel locale={locale} title={t('history.needsReturn')} description={t('history.needsReturnDescription', { lost: stats.lost, new: stats.notStarted })} count={stats.needsReturn} total={stats.total} cards={needsReturnCards} variant="needs-return" onOpenCard={onOpenCard} />
      </div>

      <div className="history-card chart-card">
        <div className="history-card-heading"><div><span className="eyebrow"><BarChart3 size={13} /> {t('history.runPerformance')}</span><h2>{t('history.signalReturns')}</h2></div><span className="chart-legend"><i className="legend-mint" /> {t('history.hits')} <i className="legend-violet" /> {t('history.attempts')}</span></div>
        <PerformanceChart locale={locale} runs={state.runs} />
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

function RetentionPanel({ locale, title, description, count, total, cards, variant, onOpenCard }: { locale: SupportedLocale; title: string; description: string; count: number; total: number; cards: RetentionCard[]; variant: RetentionBand | 'needs-return'; onOpenCard: (cardId: string) => void }) {
  const { t } = useI18n(locale)
  return <section className={`history-retention-panel ${variant}`}>
    <div className="history-retention-heading"><div><span className="history-panel-kicker">{t('history.wordCount', { count: total })}</span><h2>{title}</h2></div><strong>{count}</strong></div>
    <p className="history-retention-description">{description}</p>
    <div className="history-word-list">
      {cards.length === 0 ? <div className="empty-history"><Lightbulb size={18} /><span>{t('history.noWords')}</span></div> : cards.map((item) => {
        const scoreLabel = item.band === 'new' ? t('history.notStarted') : `${item.score}%`
        const bandLabel = item.band === 'new' ? t('history.notStarted') : item.band === 'lost' ? t('history.lost') : ''
        return <button type="button" className="history-word-row" key={item.card.id} onClick={() => onOpenCard(item.card.id)} aria-label={t('history.openRetention', { card: item.card.target, score: scoreLabel })}><span className="history-word-name">{item.card.target}</span>{bandLabel && <small>{bandLabel}</small>}<span className="history-word-score">{scoreLabel}</span><ChevronRight size={14} /></button>
      })}
    </div>
  </section>
}

function PerformanceChart({ locale, runs }: { locale: SupportedLocale; runs: PersistedState['runs'] }) {
  const { t } = useI18n(locale)
  const sorted = [...runs].sort((left, right) => left.finishedAt - right.finishedAt).slice(-12)
  const points = sorted.map((run, index) => {
    const accuracy = run.hits + run.misses ? run.hits / (run.hits + run.misses) : 0
    const x = sorted.length === 1 ? 200 : 30 + (index / (sorted.length - 1)) * 340
    return { x, y: 140 - accuracy * 95, attemptY: 140 - Math.min(1, run.cardIds.length / 24) * 75, accuracy, date: new Date(run.finishedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' }) }
  })
  const mintPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const violetPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.attemptY}`).join(' ')
  return <div className="performance-chart"><svg viewBox="0 0 400 170" role="img" aria-label={t('history.chartAria')}><line x1="28" y1="45" x2="370" y2="45" /><line x1="28" y1="92" x2="370" y2="92" /><line x1="28" y1="140" x2="370" y2="140" /><text x="2" y="49">100</text><text x="10" y="96">50</text><text x="17" y="144">0</text>{points.length > 1 && <><path className="chart-area" d={`${mintPath} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`} /><path className="chart-line mint-line" d={mintPath} /><path className="chart-line violet-line" d={violetPath} /></>}{points.map((point, index) => <circle key={index} className="chart-point" cx={point.x} cy={point.y} r="3.5"><title>{point.date} - {Math.round(point.accuracy * 100)}%</title></circle>)}</svg>{points.length === 0 && <div className="chart-empty"><Sparkles size={18} /><span>{t('history.graphStart')}</span></div>}<div className="chart-axis"><span>{t('history.older')}</span><span>{t('history.recent')}</span></div></div>
}
