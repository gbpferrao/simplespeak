import { Play, Timer, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { PersistedState } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { RunConfig } from '../../study/domain/runSession'

interface BoardRunBarProps {
  state: PersistedState
  stats: ProgressStats
  onStartRun: (config: RunConfig) => void
}

export const BoardRunBar = memo(function BoardRunBar({ state, stats, onStartRun }: BoardRunBarProps) {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<RunConfig['preset']>('due-nearby')
  const [sceneId, setSceneId] = useState<string | null>(null)
  const [limit, setLimit] = useState(Math.min(12, Math.max(4, state.settings.dailyTarget)))

  function startRun(): void {
    const selectedPreset = preset === 'scene' && !sceneId ? 'due-nearby' : preset
    onStartRun({ preset: selectedPreset, sceneId: selectedPreset === 'scene' || selectedPreset === 'custom' ? sceneId : null, limit })
    setOpen(false)
  }

  return <div className={`run-launcher ${open ? 'is-open' : ''}`}>
    {open && <section className="run-config-popover" aria-label="Configure a study run">
      <div className="run-config-heading"><div><span className="eyebrow"><Play size={12} /> Study route</span><strong>Choose a return</strong></div><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close run configuration"><X size={17} /></button></div>
      <label className="run-config-field"><span>Route</span><select value={preset} onChange={(event) => setPreset(event.target.value as RunConfig['preset'])}><option value="due-nearby">Due + nearby</option><option value="scene">One scene</option><option value="all">All words</option><option value="custom">Custom route</option></select></label>
      {(preset === 'scene' || preset === 'custom') && <label className="run-config-field"><span>Scene</span><select value={sceneId ?? ''} onChange={(event) => setSceneId(event.target.value || null)}><option value="">Choose scene</option>{starterPack.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select></label>}
      <label className="run-config-field"><span>Cards</span><select value={limit} onChange={(event) => setLimit(Number(event.target.value))}><option value="6">6 cards</option><option value="12">12 cards</option><option value="20">20 cards</option><option value="30">30 cards</option></select></label>
      <div className="run-config-due"><Timer size={14} /> {stats.due} due now</div>
      <button className="primary-button run-config-start" type="button" onClick={startRun}><Play size={15} fill="currentColor" /> Start route</button>
    </section>}
    <button className="run-launch-button" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? 'Close run configuration' : 'Open run configuration'} title="Start a study run"><Play size={19} fill="currentColor" /></button>
  </div>
})
