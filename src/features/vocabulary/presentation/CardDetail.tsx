import { useEffect, useState } from 'react'
import { Activity, BookOpen, ChevronRight, ImagePlus, Lightbulb, RefreshCw, Save, Timer, WandSparkles, X } from 'lucide-react'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { formatRelativeDate, humanize, statusLabel } from '../../../core/presentation/formatters'
import { learningFor } from '../../../core/presentation/selectors'

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
  const savedNote = state.notes[card.id] ?? ''
  const [description, setDescription] = useState(card.imagePromptSeed)
  const [note, setNote] = useState(savedNote)
  const learning = learningFor(state, card.id)
  const image = state.images[card.id]

  useEffect(() => {
    setDescription(card.imagePromptSeed)
    setNote(savedNote)
  }, [card.id, card.imagePromptSeed, savedNote])

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
        <div className="drawer-header"><div><span className="eyebrow"><BookOpen size={13} /> Word card - {humanize(card.senseKey)}</span><h2 id="card-detail-title">{card.target}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close card details"><X size={18} /></button></div>
        <div className="detail-scroll">
          <div className={`detail-visual ${image ? 'has-image' : 'fallback'}`}>{image ? <img src={image} alt={`${card.target} visual`} /> : <><span className="visual-word">{card.target}</span><span className="visual-caption">No generated image yet</span></>}</div>
          <div className="detail-identity"><div><span className="detail-origin-label">Selected bounded meaning - {card.partOfSpeech}</span><strong>{card.origin}</strong></div><span className={`status-badge status-${learning.status}`}>{statusLabel(learning.status)}</span></div>
          <div className="detail-actions"><button className="soft-button" type="button" onClick={onOpenStability}><Activity size={15} /> Stability panel</button><span className="detail-next"><Timer size={13} /> {formatRelativeDate(learning.nextDueAt)}</span></div>
          <section className="detail-section"><div className="section-label"><span><WandSparkles size={14} /> Visual prompt</span><span>{image ? 'Saved image - regenerate to overwrite' : 'Front will use the word until generated'}</span></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Describe the visual hook for this word..." /><button className="primary-button full-button" type="button" disabled={generating} onClick={() => onGenerate(description)}>{generating ? <><RefreshCw className="spin" size={15} /> Generating...</> : image ? <><RefreshCw size={15} /> Regenerate image</> : <><ImagePlus size={15} /> Generate square image</>}</button><p className="field-help">The request includes the inner prompt, this description, the target word, and the selected meaning. A failed request does not erase the saved image.</p></section>
          <section className="detail-section"><div className="section-label"><span><Lightbulb size={14} /> Mnemonic note</span><span>private to this card</span></div><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder={card.noteSeed} /><button className="text-button" type="button" onClick={() => onSaveNote(note)}><Save size={13} /> Save note</button></section>
          <section className="detail-section example-section"><div className="section-label"><span><BookOpen size={14} /> Context</span><span>starter pack</span></div><p className="example-target">&quot;{card.exampleTarget}&quot;</p><p className="example-origin">{card.exampleOrigin}</p></section>
          <button className="card-stability-link" type="button" onClick={onOpenStability}><span><Activity size={16} /><span><strong>Open word stability</strong><small>{learning.reviewCount} reviews - {learning.stabilityDays.toFixed(1)} day half-life</small></span></span><ChevronRight size={16} /></button>
        </div>
      </aside>
    </div>
  )
}
