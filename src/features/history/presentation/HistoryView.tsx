import { Activity, BarChart3, BookOpen, CalendarDays, ChevronRight, Flame, History, Info, Layers3, Lightbulb, Sparkles, Target, Timer } from 'lucide-react'
import type { PersistedState } from '../../../core/contracts/types'
import { formatDuration } from '../../../core/presentation/formatters'
import { learningFor } from '../../../core/presentation/selectors'
import { retrievability } from '../../study/domain/scheduler'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { ProgressStats } from '../domain/progressStats'

export function HistoryView({ state, stats, onOpenCard }: { state: PersistedState; stats: ProgressStats; onOpenCard: (cardId: string) => void }) {
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
          <div className="eyebrow"><History size={14} /> Memory ledger</div>
          <h1>History that helps you return.</h1>
          <p>See the signals over time. A quiet week is a gap in the graph, not a failure state.</p>
        </div>
        <div className="history-heading-badge"><Activity size={15} /><span>{state.runs.length} saved runs</span></div>
      </div>
      <div className="history-kpis">
        <div><span><Layers3 size={14} /> Reviews</span><strong>{totalReviewed}</strong><small>across {stats.reviewed} touched Cards</small></div>
        <div><span><Target size={14} /> Average accuracy</span><strong>{averageAccuracy}%</strong><small>self-report + typed answers</small></div>
        <div><span><Flame size={14} /> Anchored</span><strong>{stats.anchored}</strong><small>of {stats.total} bounded meanings</small></div>
        <div><span><Timer size={14} /> Due now</span><strong>{stats.due}</strong><small>re-entry points</small></div>
      </div>
      <div className="history-grid">
        <div className="history-card chart-card">
          <div className="history-card-heading"><div><span className="eyebrow"><BarChart3 size={13} /> Run performance</span><h2>Your signal over the last returns</h2></div><span className="chart-legend"><i className="legend-mint" /> hits <i className="legend-violet" /> attempts</span></div>
          <PerformanceChart runs={state.runs} />
        </div>
        <div className="history-card decay-card">
          <div className="history-card-heading"><div><span className="eyebrow"><Activity size={13} /> Stability watch</span><h2>Cards losing altitude</h2></div><span className="small-muted">retrievability</span></div>
          {decayCards.length === 0 ? <div className="empty-history"><Lightbulb size={18} /><span>Complete a run to start seeing decay signals.</span></div> : decayCards.map((card) => {
            const learning = learningFor(state, card.id)
            const score = Math.round(retrievability(learning) * 100)
            return <button type="button" className="decay-row" key={card.id} onClick={() => onOpenCard(card.id)} aria-label={`Open stability for ${card.target}, ${score}% retrievable`}><span className="decay-word">{card.target}</span><span className="decay-bar"><i style={{ width: `${score}%` }} /></span><span>{score}%</span><ChevronRight size={14} /></button>
          })}
        </div>
      </div>
      <div className="history-card runs-card">
        <div className="history-card-heading"><div><span className="eyebrow"><CalendarDays size={13} /> Saved runs</span><h2>Recent practice, without a streak trap</h2></div></div>
        {runs.length === 0 ? <div className="empty-history large"><BookOpen size={22} /><strong>Your first run will appear here.</strong><span>The record stores hits, misses, reveals, duration, and the route you took.</span></div> : <div className="run-history-list">{runs.map((run) => {
          const accuracy = run.hits + run.misses ? Math.round((run.hits / (run.hits + run.misses)) * 100) : 0
          return <div className="run-history-row" key={run.id}><span className="run-history-icon"><Sparkles size={15} /></span><div><strong>{run.label}</strong><span>{new Date(run.finishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {run.cardIds.length} Cards - {formatDuration(run.durationMs)}</span></div><span className="run-accuracy">{accuracy}% <small>signal</small></span><span className="run-history-score">{run.hits} <small>hits</small></span></div>
        })}</div>}
      </div>
      <div className="history-footer-note"><Info size={15} /><span>SimpleSpeak does not invent missed days. It uses the time that really passed, then gives a returning learner a bounded, useful next Card.</span></div>
    </section>
  )
}

function PerformanceChart({ runs }: { runs: PersistedState['runs'] }) {
  const sorted = [...runs].sort((left, right) => left.finishedAt - right.finishedAt).slice(-12)
  const points = sorted.map((run, index) => { const accuracy = run.hits + run.misses ? run.hits / (run.hits + run.misses) : 0; const x = sorted.length === 1 ? 200 : 30 + (index / (sorted.length - 1)) * 340; return { x, y: 140 - accuracy * 95, attemptY: 140 - Math.min(1, run.cardIds.length / 24) * 75 } })
  const mintPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const violetPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.attemptY}`).join(' ')
  return <div className="performance-chart"><svg viewBox="0 0 400 170" role="img" aria-label="Run performance chart"><line x1="28" y1="45" x2="370" y2="45" /><line x1="28" y1="92" x2="370" y2="92" /><line x1="28" y1="140" x2="370" y2="140" /><text x="2" y="49">100</text><text x="10" y="96">50</text><text x="17" y="144">0</text>{points.length > 1 && <><path className="chart-area" d={`${mintPath} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`} /><path className="chart-line mint-line" d={mintPath} /><path className="chart-line violet-line" d={violetPath} /></>}{points.map((point, index) => <circle key={index} className="chart-point" cx={point.x} cy={point.y} r="3.5" />)}</svg>{points.length === 0 && <div className="chart-empty"><Sparkles size={18} /><span>Your graph starts with your first run.</span></div>}<div className="chart-axis"><span>older</span><span>recent</span></div></div>
}
