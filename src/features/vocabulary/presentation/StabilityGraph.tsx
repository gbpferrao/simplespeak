import type { LearningState } from '../../../core/contracts/types'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { useI18n } from '../../../core/i18n/i18n'

interface StabilityGraphProps {
  locale: SupportedLocale
  learning: LearningState
}

export function StabilityGraph({ locale, learning }: StabilityGraphProps) {
  const { t } = useI18n(locale)
  const horizon = Array.from({ length: 18 }, (_, index) => index * 2)
  const curve = horizon.map((days, index) => {
    const current = learning.lastReviewedAt ? 2 ** (-(days / Math.max(0.35, learning.stabilityDays))) : 0.32
    const x = 24 + (index / (horizon.length - 1)) * 352
    const y = 150 - current * 112
    return { x, y }
  })
  const path = curve.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const eventDots = learning.history.slice(-8).map((event, index) => ({
    x: 38 + index * 43,
    y: 42 + (event.outcome === 'hit' || event.outcome === 'typed' ? 12 : 54),
  }))

  return (
    <section className="stability-chart-card stability-chart-only" aria-label={t('stability.graphAria')}>
      <svg className="stability-chart" viewBox="0 0 400 180" role="img" aria-label={t('stability.graphAria')}>
        <line x1="24" y1="38" x2="376" y2="38" />
        <line x1="24" y1="94" x2="376" y2="94" />
        <line x1="24" y1="150" x2="376" y2="150" />
        <text x="2" y="42">100</text>
        <text x="10" y="98">50</text>
        <text x="17" y="154">0</text>
        <path d={`${path} L 376 150 L 24 150 Z`} className="stability-area" />
        <path d={path} className="stability-line" />
        {eventDots.map((dot, index) => <circle key={index} cx={dot.x} cy={dot.y} r="3" className="history-dot" />)}
      </svg>
      <div className="chart-axis"><span>{t('stability.now')}</span><span>{t('stability.in34Days')}</span></div>
    </section>
  )
}
