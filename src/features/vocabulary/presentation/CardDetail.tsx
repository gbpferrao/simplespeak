import { useEffect, useState } from 'react'
import { Activity, BookOpen, ChevronRight, ImagePlus, Lightbulb, RefreshCw, Save, Timer, WandSparkles, X } from 'lucide-react'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { formatRelativeDate, humanize, statusLabel } from '../../../core/presentation/formatters'
import { learningFor } from '../../../core/presentation/selectors'
import { useI18n } from '../../../core/i18n/i18n'

interface CardDetailProps {
  card: WordCard
  state: PersistedState
  generating: boolean
  onClose: () => void
  onGenerate: (description: string) => void
  onOpenStability: () => void
  onSaveNote: (note: string) => void
}

export function CardDetail({ card, state, generating, onClose, onGenerate, onOpenStability, onSaveNote }: CardDetailProps) {
  const { t, locale } = useI18n(state.settings.uiLocale)
  const savedNote = state.notes[card.id] ?? ''
  const [description, setDescription] = useState(card.imagePrompt ?? '')
  const [note, setNote] = useState(savedNote)
  const learning = learningFor(state, card.id)
  const image = state.images[card.id]
  const senseLabel = card.sense ? humanize(card.sense) : t('card.primarySense')

  useEffect(() => {
    setDescription(card.imagePrompt ?? '')
    setNote(savedNote)
  }, [card.id, card.imagePrompt, savedNote])

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
        <div className="drawer-header"><div><span className="eyebrow"><BookOpen size={13} /> {t('card.wordCard', { sense: senseLabel })}</span><h2 id="card-detail-title">{card.target}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label={t('card.closeDetails')}><X size={18} /></button></div>
        <div className="detail-scroll">
          <div className={`detail-visual ${image ? 'has-image' : 'fallback'}`}>{image ? <img src={image} alt={t('card.visualAlt', { card: card.target })} /> : <><span className="visual-word">{card.target}</span><span className="visual-caption">{t('card.noImage')}</span></>}</div>
          <div className="detail-identity"><div><span className="detail-origin-label">{t('card.selectedMeaning', { partOfSpeech: card.partOfSpeech })}</span><strong>{card.origin}</strong></div><span className={`status-badge status-${learning.status}`}>{statusLabel(learning.status, locale)}</span></div>
          <div className="detail-actions"><button className="soft-button" type="button" onClick={onOpenStability}><Activity size={15} /> {t('card.stabilityPanel')}</button><span className="detail-next"><Timer size={13} /> {formatRelativeDate(learning.nextDueAt, locale)}</span></div>
          <section className="detail-section"><div className="section-label"><span><WandSparkles size={14} /> {t('card.visualPrompt')}</span><span>{image ? t('card.savedImage') : t('card.frontWord')}</span></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder={t('card.promptPlaceholder')} /><button className="primary-button full-button" type="button" disabled={generating} onClick={() => onGenerate(description)}>{generating ? <><RefreshCw className="spin" size={15} /> {t('card.generating')}</> : image ? <><RefreshCw size={15} /> {t('card.regenerate')}</> : <><ImagePlus size={15} /> {t('card.generate')}</>}</button><p className="field-help">{t('card.generationHelp')}</p></section>
          <section className="detail-section"><div className="section-label"><span><Lightbulb size={14} /> {t('card.mnemonic')}</span><span>{t('card.private')}</span></div><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder={card.note ?? t('card.notePlaceholder')} /><button className="text-button" type="button" onClick={() => onSaveNote(note)}><Save size={13} /> {t('card.saveNote')}</button></section>
          <section className="detail-section example-section"><div className="section-label"><span><BookOpen size={14} /> {t('card.context')}</span><span>{t('card.packContent')}</span></div><p className="example-target">&quot;{card.example?.target ?? card.target}&quot;</p><p className="example-origin">{card.example?.origin ?? card.origin}</p></section>
          <button className="card-stability-link" type="button" onClick={onOpenStability}><span><Activity size={16} /><span><strong>{t('card.openStability')}</strong><small>{t('card.reviewHalfLife', { reviews: learning.reviewCount, days: learning.stabilityDays.toFixed(1) })}</small></span></span><ChevronRight size={16} /></button>
        </div>
      </aside>
    </div>
  )
}
