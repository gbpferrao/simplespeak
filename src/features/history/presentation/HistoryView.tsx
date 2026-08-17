import { ChevronRight, Play } from 'lucide-react'
import type { PersistedState, RunConfig } from '../../../core/contracts/types'
import { UNLIMITED_RUN_LIMIT } from '../../study/domain/runSelector'
import { formatDuration } from '../../../core/presentation/formatters'
import { learningFor } from '../../../core/presentation/selectors'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { retentionBand, type RetentionBand } from '../../study/domain/retentionBands'
import { retrievability } from '../../study/domain/scheduler'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { runLabelForLocale, useI18n } from '../../../core/i18n/i18n'

type PackCard = (typeof starterPack.cards)[number]

interface RetentionCard {
  card: PackCard
  band: RetentionBand
  score: number
}

export function HistoryView({ locale, state, onOpenCard, onRerunRun }: { locale: SupportedLocale; state: PersistedState; onOpenCard: (cardId: string) => void; onRerunRun: (config: RunConfig) => void }) {
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
      <div className="view-heading history-page-heading"><h1>{t('nav.history')}</h1></div>

      <div className="history-retention-stack">
        <RetentionPanel locale={locale} title={t('history.acquired')} cards={acquiredCards} variant="acquired" onOpenCard={onOpenCard} />
        <RetentionPanel locale={locale} title={t('history.dueBand')} cards={dueCards} variant="due" onOpenCard={onOpenCard} />
        <RetentionPanel locale={locale} title={t('history.needsReturn')} cards={needsReturnCards} variant="needs-return" onOpenCard={onOpenCard} />
      </div>

      <section className="history-card chart-card">
        <div className="history-card-heading"><h2>{t('history.runPerformance')}</h2><span className="history-section-count">{t('history.savedRuns', { count: state.runs.length })}</span></div>
        <PerformanceChart locale={locale} runs={state.runs} />
        <div className="history-runs-section">
          <div className="history-card-heading"><h2>{t('history.savedRunsHeading')}</h2><span className="history-section-count">{t('history.savedRuns', { count: runs.length })}</span></div>
          {runs.length === 0 ? <div className="empty-history large"><span>{t('history.firstRun')}</span></div> : <div className="run-history-list">{runs.map((run) => {
            const accuracy = run.hits + run.misses ? Math.round((run.hits / (run.hits + run.misses)) * 100) : 0
            const sceneName = starterPack.scenes.find((scene) => scene.id === run.sceneId)?.name ?? null
            const config: RunConfig = run.config ?? { preset: run.preset, sceneId: run.sceneId, limit: UNLIMITED_RUN_LIMIT, criteria: [] }
            const criteriaCount = config.criteria?.length ?? 0
            const statusLabel = run.status === 'unfinished' ? t('history.unfinished') : t('history.completed')
            return <div className="run-history-row" key={run.id}><div><strong>{runLabelForLocale(run.preset, sceneName, locale)}</strong><span>{new Date(run.finishedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - {t('history.cardsCount', { count: run.cardIds.length })} - {formatDuration(run.durationMs, locale)}{criteriaCount > 0 ? ` - ${t('history.criteriaCount', { count: criteriaCount })}` : ''}</span><small className={`run-history-status ${run.status}`}>{statusLabel}</small></div><span className="run-accuracy">{accuracy}% <small>{t('history.signal')}</small></span><span className="run-history-score">{run.hits} <small>{t('history.hitsSmall')}</small></span><button className="run-again-button" type="button" onClick={() => onRerunRun(config)} aria-label={t('history.runAgain')} title={t('history.runAgain')}><Play size={13} fill="currentColor" /> {t('history.runAgain')}</button></div>
          })}</div>}
        </div>
      </section>
    </section>
  )
}

function RetentionPanel({ locale, title, cards, variant, onOpenCard }: { locale: SupportedLocale; title: string; cards: RetentionCard[]; variant: RetentionBand | 'needs-return'; onOpenCard: (cardId: string) => void }) {
  const { t } = useI18n(locale)
  return <section className={`history-retention-panel ${variant}`}>
    <div className="history-retention-heading"><h2>{title}</h2><strong>{cards.length}</strong></div>
    <div className="history-word-list">
      {cards.length === 0 ? <div className="empty-history"><span>{t('history.noWords')}</span></div> : cards.map((item) => {
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
  return <div className="performance-chart"><svg viewBox="0 0 400 170" role="img" aria-label={t('history.chartAria')}><line x1="28" y1="45" x2="370" y2="45" /><line x1="28" y1="92" x2="370" y2="92" /><line x1="28" y1="140" x2="370" y2="140" /><text x="2" y="49">100</text><text x="10" y="96">50</text><text x="17" y="144">0</text>{points.length > 1 && <><path className="chart-area" d={`${mintPath} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`} /><path className="chart-line mint-line" d={mintPath} /><path className="chart-line violet-line" d={violetPath} /></>}{points.map((point, index) => <circle key={index} className="chart-point" cx={point.x} cy={point.y} r="3.5"><title>{point.date} - {Math.round(point.accuracy * 100)}%</title></circle>)}</svg>{points.length === 0 && <div className="chart-empty"><span>{t('history.graphStart')}</span></div>}<div className="chart-axis"><span>{t('history.older')}</span><span>{t('history.recent')}</span></div></div>
}
