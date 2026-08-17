import { useState } from 'react'
import { ArrowUpRight, BookOpen, Brain, Check, CloudOff, Eye, EyeOff, Lightbulb, LockKeyhole, RefreshCw, RotateCcw, Save, Settings, ShieldCheck, WandSparkles } from 'lucide-react'
import type { ImageEffort, ImageResolution, PersistedState, Settings as SimpleSpeakSettings } from '../../../core/contracts/types'
import { defaultSettings } from '../../../core/persistence/localStateRepository'
import { imageEffortLabel, imageResolutionLabel } from '../../image-generation/domain/options'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { localeOptions, useI18n } from '../../../core/i18n/i18n'

interface SettingsViewProps {
  locale: SupportedLocale
  state: PersistedState
  apiKey: string
  setApiKey: (value: string) => void
  onSaveApiKey: () => Promise<void>
  onUpdateSettings: (patch: Partial<SimpleSpeakSettings>) => void
  onResetLearning: () => void
}

export function SettingsView({ locale, state, apiKey, setApiKey, onSaveApiKey, onUpdateSettings, onResetLearning }: SettingsViewProps) {
  const { t } = useI18n(locale)
  const [showKey, setShowKey] = useState(false)
  const settings = state.settings

  function exportPack(): void {
    const blob = new Blob([JSON.stringify({ ...starterPack, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${starterPack.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="view settings-view">
      <div className="view-heading">
        <div>
          <div className="eyebrow"><Settings size={14} /> {t('settings.controlRoom')}</div>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.description')}</p>
        </div>
        <div className="settings-safety"><LockKeyhole size={14} /> {t('settings.localSettings')}</div>
      </div>

      <div className="settings-grid">
        <div className="settings-main">
          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <span className="eyebrow"><Settings size={13} /> {t('settings.language')}</span>
                <h2>{t('settings.language')}</h2>
              </div>
            </div>
            <label className="field-label">
              {t('settings.language')}
              <select value={settings.uiLocale} onChange={(event) => onUpdateSettings({ uiLocale: event.target.value as SupportedLocale })}>
                {localeOptions.map((option) => <option key={option.code} value={option.code}>{option.nativeLabel}</option>)}
              </select>
            </label>
            <p className="small-muted">{t('settings.languageHelp')}</p>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <span className="eyebrow"><WandSparkles size={13} /> {t('settings.imageStudio')}</span>
                <h2>{t('settings.visualHook')}</h2>
              </div>
              <span className="settings-status">
                <span className={apiKey.trim() ? 'status-dot on' : 'status-dot'} />
                {apiKey.trim() ? t('settings.keyPresent') : t('settings.keyNeeded')}
              </span>
            </div>

            <p className="settings-lead">{t('settings.imageLead')}</p>

            <label className="field-label">
              {t('settings.apiKey')}
              <div className="secret-field">
                <LockKeyhole size={15} />
                <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="AIza..." autoComplete="off" />
                <button type="button" onClick={() => setShowKey((current) => !current)} aria-label={showKey ? t('settings.hideKey') : t('settings.showKey')}>
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <div className="settings-inline-actions">
              <button className="primary-button" type="button" onClick={() => { void onSaveApiKey() }}><Save size={15} /> {t('settings.saveKey')}</button>
              <span><ShieldCheck size={14} /> {t('settings.savedNoServer')}</span>
            </div>

            <div className="field-grid">
              <label className="field-label">
                {t('settings.modelId')}
                <input value={settings.modelId} onChange={(event) => onUpdateSettings({ modelId: event.target.value })} placeholder="gemini-3.1-flash-image" />
              </label>
              <label className="field-label">
                {t('settings.modelEffort')}
                <select value={settings.effort} onChange={(event) => onUpdateSettings({ effort: event.target.value as ImageEffort })}>
                  <option value="minimal">{imageEffortLabel('minimal', locale)}</option>
                  <option value="high">{imageEffortLabel('high', locale)}</option>
                </select>
              </label>
              <label className="field-label">
                {t('settings.resolution')}
                <select value={settings.resolution} onChange={(event) => onUpdateSettings({ resolution: event.target.value as ImageResolution })}>
                  <option value="512">{imageResolutionLabel('512', locale)}</option>
                  <option value="1K">{imageResolutionLabel('1K', locale)}</option>
                  <option value="2K">{imageResolutionLabel('2K', locale)}</option>
                </select>
              </label>
              <label className="field-label">
                {t('settings.aspectRatio')}
                <div className="locked-select"><span>{t('settings.square')}</span><LockKeyhole size={13} /></div>
              </label>
            </div>

            <p className="small-muted image-settings-note">{t('settings.imageNote')}</p>

            <label className="field-label">
              {t('settings.innerPrompt')}
              <div className="prompt-field">
                <textarea value={settings.innerPrompt} onChange={(event) => onUpdateSettings({ innerPrompt: event.target.value })} rows={5} />
                <span>{t('settings.characters', { count: settings.innerPrompt.length })}</span>
              </div>
            </label>
            <div className="prompt-reset-row">
              <span>{t('settings.promptSent')}</span>
              <button className="text-button" type="button" onClick={() => onUpdateSettings({ innerPrompt: defaultSettings.innerPrompt })}><RefreshCw size={13} /> {t('settings.resetDefault')}</button>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <span className="eyebrow"><Brain size={13} /> {t('settings.learningRhythm')}</span>
                <h2>{t('settings.irregularUse')}</h2>
              </div>
            </div>
            <p className="settings-lead">{t('settings.rhythmLead')}</p>
            <div className="field-grid">
              <label className="field-label">
                {t('settings.overallHorizon')}
                <select value={settings.timeframeDays} onChange={(event) => onUpdateSettings({ timeframeDays: Number(event.target.value) })}>
                  <option value="30">30 {t('settings.daysQuick')}</option>
                  <option value="90">90 {t('settings.daysSteady')}</option>
                  <option value="180">180 {t('settings.daysLong')}</option>
                  <option value="365">365 {t('settings.daysDeep')}</option>
                </select>
              </label>
              <label className="field-label">
                {t('settings.dailyTarget')}
                <select value={settings.dailyTarget} onChange={(event) => onUpdateSettings({ dailyTarget: Number(event.target.value) })}>
                  <option value="6">6 {t('settings.cardsGentle')}</option>
                  <option value="12">12 {t('settings.cardsBalanced')}</option>
                  <option value="20">20 {t('settings.cardsFocused')}</option>
                  <option value="30">30 {t('settings.cardsDeep')}</option>
                </select>
              </label>
            </div>
            <div className="principle-callout">
              <Lightbulb size={16} />
              <div><strong>{t('settings.returnWhen')}</strong><span>{t('settings.engine')}</span></div>
            </div>
          </section>
        </div>

        <aside className="settings-aside">
          <div className="settings-card pack-card">
            <div className="pack-card-visual"><span><BookOpen size={22} /></span><div className="pack-stars"><i /><i /><i /><i /><i /></div></div>
            <span className="eyebrow">{t('settings.loadedPack')}</span>
            <h2>{starterPack.name}</h2>
            <p>{starterPack.targetLanguage} -&gt; {starterPack.originLanguage}</p>
            <div className="pack-info-line"><span>{t('settings.cards', { count: starterPack.cards.length })}</span><span>{t('settings.scenes', { count: starterPack.scenes.length })}</span></div>
            <button className="soft-button full-button" type="button" onClick={exportPack}><ArrowUpRight size={15} /> {t('settings.exportPack')}</button>
          </div>

          <div className="settings-card local-card">
            <CloudOff size={19} />
            <h3>{t('settings.offlineDefault')}</h3>
            <p>{t('settings.offlineDescription')}</p>
            <div className="local-check"><Check size={14} /> {t('settings.localState')}</div>
            <div className="local-check"><Check size={14} /> {t('settings.localImages')}</div>
            <div className="local-check"><Check size={14} /> {t('settings.localHistory')}</div>
          </div>

          <div className="settings-card danger-card">
            <div><span className="eyebrow">{t('settings.maintenance')}</span><h3>{t('settings.startOver')}</h3><p>{t('settings.keepImages')}</p></div>
            <button className="danger-button" type="button" onClick={onResetLearning}><RotateCcw size={14} /> {t('settings.resetLearning')}</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
