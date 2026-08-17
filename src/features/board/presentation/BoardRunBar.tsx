import { Play, Plus, Timer, Trash2, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { PersistedState, RunCriterion, RunCriterionKind } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { RunConfig } from '../../study/domain/runSession'
import { useI18n } from '../../../core/i18n/i18n'

interface BoardRunBarProps {
  state: PersistedState
  stats: ProgressStats
  onStartRun: (config: RunConfig) => void
}

const partOfSpeechValues = [...new Set(starterPack.cards.map((card) => card.partOfSpeech))].sort()

function makeCriterion(kind: RunCriterionKind): RunCriterion {
  const id = `criterion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  if (kind === 'retention') return { id, mode: 'add', kind, minRetention: 0, maxRetention: 100 }
  return { id, mode: 'add', kind, value: kind === 'scene' ? starterPack.scenes[0]?.id ?? '' : partOfSpeechValues[0] ?? '' }
}

export const BoardRunBar = memo(function BoardRunBar({ state, stats, onStartRun }: BoardRunBarProps) {
  const { t } = useI18n(state.settings.uiLocale)
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<RunConfig['preset']>('due-nearby')
  const [sceneId, setSceneId] = useState<string | null>(null)
  const [limit, setLimit] = useState(12)
  const [criteria, setCriteria] = useState<RunCriterion[]>([])

  function updateCriterion(id: string, patch: Partial<RunCriterion>): void {
    setCriteria((current) => current.map((criterion) => criterion.id === id ? { ...criterion, ...patch } : criterion))
  }

  function changeCriterionKind(criterion: RunCriterion, kind: RunCriterionKind): void {
    const next = makeCriterion(kind)
    updateCriterion(criterion.id, { ...next, id: criterion.id, mode: criterion.mode })
  }

  function startRun(): void {
    const selectedPreset = preset === 'scene' && !sceneId ? 'due-nearby' : preset
    onStartRun({ preset: selectedPreset, sceneId: selectedPreset === 'scene' || selectedPreset === 'custom' ? sceneId : null, limit, criteria })
    setOpen(false)
  }

  return <div className={`run-launcher ${open ? 'is-open' : ''}`}>
    {open && <section className="run-config-popover" aria-label={t('run.configureAria')}>
      <div className="run-config-heading"><div><span className="eyebrow"><Play size={12} /> {t('run.studyRoute')}</span><strong>{t('run.chooseReturn')}</strong></div><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label={t('run.closeConfig')}><X size={17} /></button></div>
      <label className="run-config-field"><span>{t('run.route')}</span><select value={preset} onChange={(event) => setPreset(event.target.value as RunConfig['preset'])}><option value="due-nearby">{t('run.dueNearby')}</option><option value="scene">{t('run.oneScene')}</option><option value="all">{t('run.allWords')}</option><option value="custom">{t('run.customRoute')}</option></select></label>
      {(preset === 'scene' || preset === 'custom') && <label className="run-config-field"><span>{t('run.route')}</span><select value={sceneId ?? ''} onChange={(event) => setSceneId(event.target.value || null)}><option value="">{t('run.chooseScene')}</option>{starterPack.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select></label>}
      <label className="run-config-field"><span>{t('run.cards', { count: '' }).replace(' ', '').trim()}</span><select value={limit} onChange={(event) => setLimit(Number(event.target.value))}><option value="6">{t('run.cards', { count: 6 })}</option><option value="12">{t('run.cards', { count: 12 })}</option><option value="20">{t('run.cards', { count: 20 })}</option><option value="30">{t('run.cards', { count: 30 })}</option></select></label>

      <div className="run-filter-panel">
        <div className="run-filter-heading"><div><span className="eyebrow">{t('run.filters')}</span><strong>{t('run.progressiveFilters')}</strong></div><button className="text-button run-add-filter" type="button" onClick={() => setCriteria((current) => [...current, makeCriterion('scene')])}><Plus size={13} /> {t('run.addFilter')}</button></div>
        {criteria.length === 0 ? <span className="run-filter-empty">{t('run.noFilters')}</span> : criteria.map((criterion, index) => <div className="run-filter-card" key={criterion.id}>
          <div className="run-filter-card-heading"><span className="run-filter-index">{index + 1}</span><select className="run-filter-select" aria-label={t('run.filterMode')} value={criterion.mode} onChange={(event) => updateCriterion(criterion.id, { mode: event.target.value as RunCriterion['mode'] })}><option value="add">{t('run.addMode')}</option><option value="subtract">{t('run.subtractMode')}</option></select><button className="icon-button" type="button" onClick={() => setCriteria((current) => current.filter((item) => item.id !== criterion.id))} aria-label={t('run.removeFilter')}><Trash2 size={14} /></button></div>
          <select className="run-filter-select" aria-label={t('run.filterType')} value={criterion.kind} onChange={(event) => changeCriterionKind(criterion, event.target.value as RunCriterionKind)}><option value="scene">{t('run.filterGroup')}</option><option value="part-of-speech">{t('run.filterPartOfSpeech')}</option><option value="retention">{t('run.filterRetention')}</option></select>
          {criterion.kind === 'scene' && <select className="run-filter-select" aria-label={t('run.selectGroup')} value={criterion.value ?? ''} onChange={(event) => updateCriterion(criterion.id, { value: event.target.value })}>{starterPack.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select>}
          {criterion.kind === 'part-of-speech' && <select className="run-filter-select" aria-label={t('run.selectPartOfSpeech')} value={criterion.value ?? ''} onChange={(event) => updateCriterion(criterion.id, { value: event.target.value })}>{partOfSpeechValues.map((value) => <option key={value} value={value}>{value}</option>)}</select>}
          {criterion.kind === 'retention' && <div className="run-retention-inputs"><label><span>{t('run.minRetention')}</span><input type="number" min="0" max="100" value={criterion.minRetention ?? 0} onChange={(event) => updateCriterion(criterion.id, { minRetention: Math.min(criterion.maxRetention ?? 100, Math.max(0, Number(event.target.value))) })} /></label><span className="run-retention-separator">–</span><label><span>{t('run.maxRetention')}</span><input type="number" min="0" max="100" value={criterion.maxRetention ?? 100} onChange={(event) => updateCriterion(criterion.id, { maxRetention: Math.max(criterion.minRetention ?? 0, Math.min(100, Number(event.target.value))) })} /></label></div>}
        </div>)}
      </div>

      <div className="run-config-due"><Timer size={14} /> {t('run.dueNow', { count: stats.due })}</div>
      <button className="primary-button run-config-start" type="button" onClick={startRun}><Play size={15} fill="currentColor" /> {t('run.startRoute')}</button>
    </section>}
    <button className="run-launch-button" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? t('run.closeConfig') : t('run.openConfig')} title={t('run.openConfig')}><Play size={19} fill="currentColor" /></button>
  </div>
})
