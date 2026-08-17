import { Filter, Play, Plus, Timer, Trash2, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { PersistedState, RunCriterion, RunCriterionKind } from '../../../core/contracts/types'
import type { ProgressStats } from '../../history/domain/progressStats'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { RunConfig } from '../../study/domain/runSession'
import { criteriaForRunPreset, materializeRunConfig, UNLIMITED_RUN_LIMIT } from '../../study/domain/runSelector'
import { useI18n } from '../../../core/i18n/i18n'

interface BoardRunBarProps {
  state: PersistedState
  stats: ProgressStats
  onStartRun: (config: RunConfig) => void
}

const partOfSpeechValues = [...new Set(starterPack.cards.map((card) => card.partOfSpeech))].sort()
type RoutePresetValue = Exclude<RunConfig['preset'], 'all'> | `scene:${string}`

function makeCriterion(kind: RunCriterionKind, value?: string): RunCriterion {
  const id = `criterion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  if (kind === 'retention') return { id, mode: 'add', kind, minRetention: 0, maxRetention: 100 }
  return { id, mode: 'add', kind, value: value ?? (kind === 'scene' ? starterPack.scenes[0]?.id ?? '' : partOfSpeechValues[0] ?? '') }
}

export const BoardRunBar = memo(function BoardRunBar({ state, stats, onStartRun }: BoardRunBarProps) {
  const { t } = useI18n(state.settings.uiLocale)
  const [open, setOpen] = useState(false)
  const [routePreset, setRoutePreset] = useState<RoutePresetValue>('due-nearby')
  const [criteria, setCriteria] = useState<RunCriterion[]>(() => criteriaForRunPreset('due-nearby', null))

  function updateCriterion(id: string, patch: Partial<RunCriterion>): void {
    setCriteria((current) => current.map((criterion) => criterion.id === id ? { ...criterion, ...patch } : criterion))
  }

  function changeCriterionKind(criterion: RunCriterion, kind: RunCriterionKind): void {
    const next = makeCriterion(kind)
    updateCriterion(criterion.id, { ...next, id: criterion.id, mode: criterion.mode })
  }

  function startRun(): void {
    const isScenePreset = routePreset.startsWith('scene:')
    const selectedPreset = isScenePreset ? 'scene' : routePreset as RunConfig['preset']
    const sceneId = isScenePreset ? routePreset.slice('scene:'.length) : null
    onStartRun(materializeRunConfig({ preset: selectedPreset, sceneId: selectedPreset === 'scene' ? sceneId : null, limit: UNLIMITED_RUN_LIMIT, criteria }))
    setOpen(false)
  }

  function selectRoutePreset(value: RoutePresetValue): void {
    setRoutePreset(value)
    const isScenePreset = value.startsWith('scene:')
    const preset = isScenePreset ? 'scene' : value as RunConfig['preset']
    const sceneId = isScenePreset ? value.slice('scene:'.length) : null
    setCriteria(criteriaForRunPreset(preset, sceneId))
  }

  return <div className={`run-launcher ${open ? 'is-open' : ''}`}>
    {open ? <section className="run-config-popover" aria-label={t('run.configureAria')}>
      <div className="run-config-heading"><strong>{t('run.chooseReturn')}</strong><button className="run-config-close-button" type="button" onClick={() => setOpen(false)} aria-label={t('run.closeConfig')} title={t('run.closeConfig')}><X size={17} /></button></div>
      <label className="run-config-field"><span>{t('run.routePresets')}</span><select value={routePreset} onChange={(event) => selectRoutePreset(event.target.value as RoutePresetValue)}><option value="due-nearby">{t('run.dueNearby')}</option><optgroup label={t('run.oneScene')}>{starterPack.scenes.map((scene) => <option key={scene.id} value={`scene:${scene.id}`}>{scene.name}</option>)}</optgroup><option value="custom">{t('run.customRoute')}</option></select></label>

      <div className="run-filter-panel">
        <div className="run-filter-heading"><strong>{t('run.progressiveFilters')}</strong><button className="text-button run-add-filter" type="button" onClick={() => setCriteria((current) => [...current, makeCriterion('scene')])}><Plus size={13} /> {t('run.addFilter')}</button></div>
        {criteria.length === 0 ? <span className="run-filter-empty"><Filter size={13} /> {t('run.allWords')}</span> : criteria.map((criterion, index) => <div className="run-filter-card" key={criterion.id}>
          <div className="run-filter-card-heading"><span className="run-filter-index">{index + 1}</span><select className="run-filter-select" aria-label={t('run.filterMode')} value={criterion.mode} onChange={(event) => updateCriterion(criterion.id, { mode: event.target.value as RunCriterion['mode'] })}><option value="add">{t('run.addMode')}</option><option value="subtract">{t('run.subtractMode')}</option></select><button className="icon-button" type="button" onClick={() => setCriteria((current) => current.filter((item) => item.id !== criterion.id))} aria-label={t('run.removeFilter')}><Trash2 size={14} /></button></div>
          <select className="run-filter-select" aria-label={t('run.filterType')} value={criterion.kind} onChange={(event) => changeCriterionKind(criterion, event.target.value as RunCriterionKind)}><option value="scene">{t('run.filterGroup')}</option><option value="part-of-speech">{t('run.filterPartOfSpeech')}</option><option value="retention">{t('run.filterRetention')}</option></select>
          {criterion.kind === 'scene' && <select className="run-filter-select" aria-label={t('run.selectGroup')} value={criterion.value ?? ''} onChange={(event) => updateCriterion(criterion.id, { value: event.target.value })}>{starterPack.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select>}
          {criterion.kind === 'part-of-speech' && <select className="run-filter-select" aria-label={t('run.selectPartOfSpeech')} value={criterion.value ?? ''} onChange={(event) => updateCriterion(criterion.id, { value: event.target.value })}>{partOfSpeechValues.map((value) => <option key={value} value={value}>{value}</option>)}</select>}
          {criterion.kind === 'retention' && <div className="run-retention-inputs"><label><span>{t('run.minRetention')}</span><input type="number" min="0" max="100" value={criterion.minRetention ?? 0} onChange={(event) => updateCriterion(criterion.id, { minRetention: Math.min(criterion.maxRetention ?? 100, Math.max(0, Number(event.target.value))) })} /></label><span className="run-retention-separator">–</span><label><span>{t('run.maxRetention')}</span><input type="number" min="0" max="100" value={criterion.maxRetention ?? 100} onChange={(event) => updateCriterion(criterion.id, { maxRetention: Math.max(criterion.minRetention ?? 0, Math.min(100, Number(event.target.value))) })} /></label></div>}
        </div>)}
      </div>

      <div className="run-config-due"><Timer size={14} /> {t('run.dueNow', { count: stats.due })}</div>
      <button className="primary-button run-config-start" type="button" onClick={startRun}><Play size={15} fill="currentColor" /> {t('run.startRoute')}</button>
    </section> : <button className="run-launch-button" type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-label={t('run.openConfig')} title={t('run.openConfig')}><Play size={34} strokeWidth={2.2} fill="currentColor" /></button>}
  </div>
})
