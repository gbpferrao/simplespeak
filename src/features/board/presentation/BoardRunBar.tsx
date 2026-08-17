import { Play, Timer, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { PersistedState } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { RunConfig } from '../../study/domain/runSession'
import { useI18n } from '../../../core/i18n/i18n'

interface BoardRunBarProps {
  state: PersistedState
  stats: ProgressStats
  onStartRun: (config: RunConfig) => void
}

export const BoardRunBar = memo(function BoardRunBar({ state, stats, onStartRun }: BoardRunBarProps) {
  const { t } = useI18n(state.settings.uiLocale)
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
    {open && <section className="run-config-popover" aria-label={t('run.configureAria')}>
      <div className="run-config-heading"><div><span className="eyebrow"><Play size={12} /> {t('run.studyRoute')}</span><strong>{t('run.chooseReturn')}</strong></div><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label={t('run.closeConfig')}><X size={17} /></button></div>
      <label className="run-config-field"><span>{t('run.route')}</span><select value={preset} onChange={(event) => setPreset(event.target.value as RunConfig['preset'])}><option value="due-nearby">{t('run.dueNearby')}</option><option value="scene">{t('run.oneScene')}</option><option value="all">{t('run.allWords')}</option><option value="custom">{t('run.customRoute')}</option></select></label>
      {(preset === 'scene' || preset === 'custom') && <label className="run-config-field"><span>{t('run.route')}</span><select value={sceneId ?? ''} onChange={(event) => setSceneId(event.target.value || null)}><option value="">{t('run.chooseScene')}</option>{starterPack.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select></label>}
      <label className="run-config-field"><span>{t('run.cards', { count: '' }).replace(' ', '').trim()}</span><select value={limit} onChange={(event) => setLimit(Number(event.target.value))}><option value="6">{t('run.cards', { count: 6 })}</option><option value="12">{t('run.cards', { count: 12 })}</option><option value="20">{t('run.cards', { count: 20 })}</option><option value="30">{t('run.cards', { count: 30 })}</option></select></label>
      <div className="run-config-due"><Timer size={14} /> {t('run.dueNow', { count: stats.due })}</div>
      <button className="primary-button run-config-start" type="button" onClick={startRun}><Play size={15} fill="currentColor" /> {t('run.startRoute')}</button>
    </section>}
    <button className="run-launch-button" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? t('run.closeConfig') : t('run.openConfig')} title={t('run.openConfig')}><Play size={19} fill="currentColor" /></button>
  </div>
})
