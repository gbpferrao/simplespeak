import { memo, type CSSProperties } from 'react'
import type { PersistedState, WordCard } from '../../../core/contracts/types'
import { learningFor } from '../../../core/presentation/selectors'
import { statusLabel } from '../../../core/presentation/formatters'
import { starterPack } from '../../language-packs/data/starterPack'

interface BoardCardNodeProps {
  card: WordCard
  state: PersistedState
  focused: boolean
  runMode?: boolean
  runActive?: boolean
  revealed?: boolean
  onClick: () => void
}

function BoardCardNodeBase({ card, state, focused, runActive = false, revealed = false, onClick }: BoardCardNodeProps) {
  const learning = learningFor(state, card.id)
  const image = state.images[card.id]
  const scene = starterPack.scenes.find((candidate) => candidate.id === card.sceneId)
  const style = { left: card.x, top: card.y, '--card-accent': scene?.accent ?? '#7657d9' } as CSSProperties

  return (
    <button className={`card-node card-state-${learning.status} ${image ? 'has-image' : 'word-only'} ${focused ? 'focused' : ''} ${runActive ? 'run-active-card' : ''} ${revealed ? 'revealed' : ''}`} type="button" onClick={onClick} style={style} data-card-node aria-label={`${revealed ? 'Review' : 'Open'} ${card.target}, ${statusLabel(learning.status)}`}>
      <span className="card-node-paper">
        <span className="card-node-art">{revealed ? <span className="card-node-reveal"><span>Target word</span><strong>{card.target}</strong><em>{card.origin}</em><small>{state.notes[card.id] || card.noteSeed}</small></span> : image ? <img src={image} alt="" loading="lazy" decoding="async" draggable="false" /> : <span className="card-node-word">{card.target}</span>}</span>
      </span>
    </button>
  )
}

/**
 * Camera updates happen often. A card only needs to render again when its own
 * learning/image state or visual focus changes; unrelated cards can stay put.
 * The click handler is intentionally omitted from this comparison because its
 * behavior is determined by the stable card id and the mode flags above.
 */
export const BoardCardNode = memo(BoardCardNodeBase, (previous, next) => {
  const cardId = previous.card.id
  return previous.card === next.card
    && previous.focused === next.focused
    && previous.runMode === next.runMode
    && previous.runActive === next.runActive
    && previous.revealed === next.revealed
    && previous.state.learning[cardId] === next.state.learning[cardId]
    && previous.state.images[cardId] === next.state.images[cardId]
    && (!next.revealed || (previous.state.notes[cardId] ?? '') === (next.state.notes[cardId] ?? ''))
})
