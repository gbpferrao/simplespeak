import { useEffect } from 'react'
import { Activity, Check, History, ShieldCheck, X } from 'lucide-react'
import type { LearningState, WordCard } from '../../../core/contracts/types'
import { humanize, formatRelativeDate, statusLabel } from '../../../core/presentation/formatters'

export function StabilityPanel({ card, learning, onClose }: { card: WordCard; learning: LearningState; onClose: () => void }) {
  const horizon = Array.from({ length: 18 }, (_, index) => index * 2)
  const curve = horizon.map((days, index) => { const current = learning.lastReviewedAt ? 2 ** (-(days / Math.max(0.35, learning.stabilityDays))) : 0.32; const x = 24 + (index / (horizon.length - 1)) * 352; const y = 150 - current * 112; return { x, y, current } })
  const path = curve.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const eventDots = learning.history.slice(-8).map((event, index) => ({ x: 38 + index * 43, y: 42 + (event.outcome === 'hit' || event.outcome === 'typed' ? 12 : 54) }))

  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="overlay-backdrop stability-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="modal-card stability-modal" role="dialog" aria-modal="true" aria-labelledby="stability-title">
        <div className="drawer-header"><div><span className="eyebrow"><Activity size={13} /> Word stability</span><h2 id="stability-title">{card.target}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close stability panel"><X size={18} /></button></div>
        <div className="stability-scroll">
          <div className="stability-hero"><div className="stability-score"><strong>{Math.round((curve[0]?.current ?? 0) * 100)}%</strong><span>retrievable now</span></div><div className={`status-badge status-${learning.status}`}>{statusLabel(learning.status)}</div></div>
          <p className="stability-plain-language">{learning.reviewCount === 0 ? 'The first return will give this word its first useful signal.' : learning.nextDueAt && learning.nextDueAt > Date.now() ? 'This word is likely to come back comfortably today.' : 'This word is asking for a kind, timely return.'}</p>
          <div className="stability-summary"><div><span>Stability</span><strong>{learning.stabilityDays.toFixed(1)} days</strong></div><div><span>Next due</span><strong>{formatRelativeDate(learning.nextDueAt)}</strong></div><div><span>Reviews</span><strong>{learning.reviewCount}</strong></div></div>
          <section className="stability-chart-card"><div className="section-label"><span><Activity size={14} /> Predicted retrieval</span><span>decay view</span></div><svg className="stability-chart" viewBox="0 0 400 180" role="img" aria-label="Predicted word stability decay graph"><line x1="24" y1="38" x2="376" y2="38" /><line x1="24" y1="94" x2="376" y2="94" /><line x1="24" y1="150" x2="376" y2="150" /><text x="2" y="42">100</text><text x="10" y="98">50</text><text x="17" y="154">0</text><path d={`${path} L 376 150 L 24 150 Z`} className="stability-area" /><path d={path} className="stability-line" />{eventDots.map((dot, index) => <circle key={index} cx={dot.x} cy={dot.y} r="3" className="history-dot" />)}</svg><div className="chart-axis"><span>now</span><span>+34 days</span></div></section>
          <div className="stability-events"><div className="section-label"><span><History size={14} /> Recent signals</span><span>{learning.history.length} saved</span></div>{learning.history.length === 0 ? <p className="empty-panel-copy">No reviews yet. The first honest signal starts the curve.</p> : [...learning.history].reverse().slice(0, 5).map((event) => <div className="stability-event" key={event.id}><span className={`event-mark ${event.outcome === 'hit' || event.outcome === 'typed' ? 'hit' : 'miss'}`}>{event.outcome === 'hit' || event.outcome === 'typed' ? <Check size={12} /> : <X size={12} />}</span><span><strong>{event.outcome === 'typed' ? 'Typed hit' : humanize(event.outcome)}</strong><small>{new Date(event.occurredAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></span><span className="event-delta">{event.stabilityBefore.toFixed(1)} to {event.stabilityAfter.toFixed(1)} days</span></div>)}</div>
          <div className="stability-principle"><ShieldCheck size={17} /><p>Intervals are suggestions. A long gap does not rewrite history; the next review reads what happened now and recalibrates.</p></div>
        </div>
      </aside>
    </div>
  )
}
