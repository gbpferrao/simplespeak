import { Play, SlidersHorizontal, Timer } from 'lucide-react'
import { memo, useState } from 'react'
import type { PersistedState } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import { starterPack } from '../../language-packs/data/starterPack'
import type { RunConfig } from '../../study/domain/runSession'

interface BoardRunBarProps {
  state: PersistedState
  stats: ProgressStats
  onStartRun: (config: RunConfig) => void
  onOpenRun: () => void
}

export const BoardRunBar = memo(function BoardRunBar({ state, stats, onStartRun, onOpenRun }: BoardRunBarProps) {
  const [preset, setPreset] = useState<RunConfig['preset']>('due-nearby')
  const [sceneId, setSceneId] = useState<string | null>(null)
  const [limit, setLimit] = useState(Math.min(12, Math.max(4, state.settings.dailyTarget)))

  function startRun(): void {
    const selectedPreset = preset === 'scene' && !sceneId ? 'due-nearby' : preset
    onStartRun({ preset: selectedPreset, sceneId: selectedPreset === 'scene' || selectedPreset === 'custom' ? sceneId : null, limit })
  }

  return (
    <section className="run-bar" aria-label="Start a study run">
      <div className="run-bar-intro"><span className="run-bar-icon"><Play size={16} /></span><div><strong>Ready for a short return?</strong><span>{stats.due} cards are due; choose a route and go.</span></div></div>
      <div className="run-bar-controls">
        <label className="run-bar-field"><span>Route</span><select value={preset} onChange={(event) => setPreset(event.target.value as RunConfig['preset'])}><option value="due-nearby">Due + nearby</option><option value="scene">One scene</option><option value="all">All words</option><option value="custom">Custom route</option></select></label>
        {(preset === 'scene' || preset === 'custom') && <label className="run-bar-field"><span>Scene</span><select value={sceneId ?? ''} onChange={(event) => setSceneId(event.target.value || null)}><option value="">Choose scene</option>{starterPack.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select></label>}
        <label className="run-bar-field run-bar-size"><span>Cards</span><select value={limit} onChange={(event) => setLimit(Number(event.target.value))}><option value="6">6</option><option value="12">12</option><option value="20">20</option><option value="30">30</option></select></label>
        <span className="run-bar-due"><Timer size={14} /> {stats.due} due</span>
        <button className="quiet-button" type="button" onClick={onOpenRun}><SlidersHorizontal size={15} /> More setup</button>
        <button className="primary-button run-bar-start" type="button" onClick={startRun}><Play size={15} /> Start run</button>
      </div>
    </section>
  )
})
