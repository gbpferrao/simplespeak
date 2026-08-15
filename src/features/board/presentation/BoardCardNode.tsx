import type { CSSProperties } from 'react'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { learningFor } from '../../../core/presentation/selectors'
import { statusLabel } from '../../../core/presentation/formatters'
import { starterPack } from '../../language-packs/data/starterPack'

interface BoardCardNodeProps {
  card: WordCard
  state: PersistedState
  focused: boolean
  runActive?: boolean
  revealed?: boolean
  onClick: () => void
}

export function BoardCardNode({ card, state, focused, runActive = false, revealed = false, onClick }: BoardCardNodeProps) {
  const learning = learningFor(state, card.id)
  const image = state.images[card.id]
  const scene = starterPack.scenes.find((candidate) => candidate.id === card.sceneId)
  const style = { left: card.x, top: card.y, '--card-accent': scene?.accent ?? '#7657d9' } as CSSProperties

  return (
    <button className={`card-node card-state-${learning.status} ${image ? 'has-image' : 'word-only'} ${focused ? 'focused' : ''} ${runActive ? 'run-active-card' : ''} ${revealed ? 'revealed' : ''}`} type="button" onClick={onClick} style={style} data-card-node aria-label={`${revealed ? 'Review' : 'Open'} ${card.target}, ${statusLabel(learning.status)}`}>
      <span className="card-node-paper">
        <span className="card-node-art">{revealed ? <span className="card-node-reveal"><span>Target word</span><strong>{card.target}</strong><em>{card.origin}</em><small>{state.notes[card.id] || card.noteSeed}</small></span> : image ? <img src={image} alt="" /> : <span className="card-node-word">{card.target}</span>}</span>
        <span className="card-node-footer"><strong>{card.target}</strong><span>{card.partOfSpeech}</span></span>
      </span>
      <span className="card-node-state"><span className="card-state-dot" />{statusLabel(learning.status)}</span>
    </button>
  )
}
