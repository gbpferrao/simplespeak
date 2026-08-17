import { useEffect } from 'react'
import { Activity, Check, History, ShieldCheck, X } from 'lucide-react'
import type { LearningState, WordCard } from '../../../core/contracts/types'
import { formatRelativeDate, statusLabel } from '../../../core/presentation/formatters'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { useI18n } from '../../../core/i18n/i18n'

export function StabilityPanel({ locale, card, learning, onClose }: { locale: SupportedLocale; card: WordCard; learning: LearningState; onClose: () => void }) {
  const { t } = useI18n(locale)
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
        <div className="drawer-header"><div><span className="eyebrow"><Activity size={13} /> {t('stability.title')}</span><h2 id="stability-title">{card.target}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label={t('stability.close')}><X size={18} /></button></div>
        <div className="stability-scroll">
          <div className="stability-hero"><div className="stability-score"><strong>{Math.round((curve[0]?.current ?? 0) * 100)}%</strong><span>{t('stability.retrievableNow')}</span></div><div className={`status-badge status-${learning.status}`}>{statusLabel(learning.status, locale)}</div></div>
          <p className="stability-plain-language">{learning.reviewCount === 0 ? t('stability.firstSignal') : learning.nextDueAt && learning.nextDueAt > Date.now() ? t('stability.comfortableToday') : t('stability.kindReturn')}</p>
          <div className="stability-summary"><div><span>{t('stability.stability')}</span><strong>{t('stability.days', { count: learning.stabilityDays.toFixed(1) })}</strong></div><div><span>{t('stability.nextDue')}</span><strong>{formatRelativeDate(learning.nextDueAt, locale)}</strong></div><div><span>{t('stability.reviews')}</span><strong>{learning.reviewCount}</strong></div></div>
          <section className="stability-chart-card"><div className="section-label"><span><Activity size={14} /> {t('stability.predicted')}</span><span>{t('stability.decayView')}</span></div><svg className="stability-chart" viewBox="0 0 400 180" role="img" aria-label={t('stability.graphAria')}><line x1="24" y1="38" x2="376" y2="38" /><line x1="24" y1="94" x2="376" y2="94" /><line x1="24" y1="150" x2="376" y2="150" /><text x="2" y="42">100</text><text x="10" y="98">50</text><text x="17" y="154">0</text><path d={`${path} L 376 150 L 24 150 Z`} className="stability-area" /><path d={path} className="stability-line" />{eventDots.map((dot, index) => <circle key={index} cx={dot.x} cy={dot.y} r="3" className="history-dot" />)}</svg><div className="chart-axis"><span>{t('stability.now')}</span><span>{t('stability.in34Days')}</span></div></section>
          <div className="stability-events"><div className="section-label"><span><History size={14} /> {t('stability.recentSignals')}</span><span>{t('stability.saved', { count: learning.history.length })}</span></div>{learning.history.length === 0 ? <p className="empty-panel-copy">{t('stability.noReviews')}</p> : [...learning.history].reverse().slice(0, 5).map((event) => <div className="stability-event" key={event.id}><span className={`event-mark ${event.outcome === 'hit' || event.outcome === 'typed' ? 'hit' : 'miss'}`}>{event.outcome === 'hit' || event.outcome === 'typed' ? <Check size={12} /> : <X size={12} />}</span><span><strong>{t(`outcome.${event.outcome}`)}</strong><small>{new Date(event.occurredAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></span><span className="event-delta">{t('stability.eventDelta', { before: event.stabilityBefore.toFixed(1), after: event.stabilityAfter.toFixed(1) })}</span></div>)}</div>
          <div className="stability-principle"><ShieldCheck size={17} /><p>{t('stability.principle')}</p></div>
        </div>
      </aside>
    </div>
  )
}
