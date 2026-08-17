import { useEffect, useState } from 'react'
import { Lightbulb, Save, X } from 'lucide-react'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { imageFor, learningFor } from '../../../core/presentation/selectors'
import { useI18n } from '../../../core/i18n/i18n'
import { StabilityGraph } from './StabilityGraph'

interface CardDetailProps {
  card: WordCard
  state: PersistedState
  onClose: () => void
  onSaveNote: (note: string) => void
}

export function CardDetail({ card, state, onClose, onSaveNote }: CardDetailProps) {
  const { t } = useI18n(state.settings.uiLocale)
  const savedNote = state.notes[card.id] ?? ''
  const [note, setNote] = useState(savedNote)
  const learning = learningFor(state, card.id)
  const image = imageFor(state, card)

  useEffect(() => {
    setNote(savedNote)
  }, [card.id, savedNote])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="overlay-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="card-detail-title">
        <button className="detail-close-button" type="button" onClick={onClose} aria-label={t('card.closeDetails')} title={t('card.closeDetails')}>
          <X size={19} aria-hidden="true" />
        </button>
        <div className="detail-scroll">
          <div className={`detail-visual ${image ? 'has-image' : 'fallback'}`}>
            {image ? <img src={image} alt={t('card.visualAlt', { card: card.target })} /> : <span className="visual-word">{card.target}</span>}
          </div>

          <div className="detail-word-pair">
            <h2 id="card-detail-title">{card.target}</h2>
            <p>{card.origin}</p>
          </div>

          <StabilityGraph locale={state.settings.uiLocale} learning={learning} />

          <section className="detail-section detail-note-section">
            <div className="section-label">
              <span><Lightbulb size={14} aria-hidden="true" /> {t('card.mnemonic')}</span>
            </div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder={card.note ?? t('card.notePlaceholder')} />
            <button className="text-button" type="button" onClick={() => onSaveNote(note)}><Save size={13} aria-hidden="true" /> {t('card.saveNote')}</button>
          </section>
        </div>
      </aside>
    </div>
  )
}
