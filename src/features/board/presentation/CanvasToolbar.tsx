import { Filter, Focus, Maximize2, Minus, Plus } from 'lucide-react'
import { starterPack } from '../../language-packs/data/starterPack'

interface CanvasToolbarProps {
  selectedSceneId: string | null
  setSelectedSceneId: (sceneId: string | null) => void
  visibleCount: number
  zoom: number
  onZoomOut: () => void
  onZoomIn: () => void
  onFocus: () => void
  onOverview: () => void
}

export function CanvasToolbar({ selectedSceneId, setSelectedSceneId, visibleCount, zoom, onZoomOut, onZoomIn, onFocus, onOverview }: CanvasToolbarProps) {
  return (
    <div className="board-toolbar">
      <div className="board-toolbar-context">
        <Filter size={15} />
        <label>
          <span className="sr-only">Scene filter</span>
          <select value={selectedSceneId ?? ''} onChange={(event) => setSelectedSceneId(event.target.value || null)}>
            <option value="">All scenes</option>
            {starterPack.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}
          </select>
        </label>
        <span className="toolbar-count">{visibleCount} cards</span>
      </div>
      <div className="board-controls">
        <button type="button" onClick={onZoomOut} aria-label="Zoom out"><Minus size={16} /></button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} aria-label="Zoom in"><Plus size={16} /></button>
        <span className="control-divider" />
        <button type="button" onClick={onFocus} aria-label="Focus selected card"><Focus size={16} /></button>
        <button type="button" onClick={onOverview} aria-label="Fit atlas overview"><Maximize2 size={16} /></button>
      </div>
    </div>
  )
}
