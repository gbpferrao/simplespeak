import { ArrowUpRight, BookOpen, Brain, Check, CloudOff, Lightbulb, LockKeyhole, RotateCcw, Settings } from 'lucide-react'
import type { PersistedState, Settings as SimpleSpeakSettings } from '../../../core/contracts/types'
import starterPack from '../../language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import type { SupportedLocale } from '../../../core/i18n/i18n'
import { localeOptions, useI18n } from '../../../core/i18n/i18n'

interface SettingsViewProps {
  locale: SupportedLocale
  state: PersistedState
  onUpdateSettings: (patch: Partial<SimpleSpeakSettings>) => void
  onResetLearning: () => void
}

export function SettingsView({ locale, state, onUpdateSettings, onResetLearning }: SettingsViewProps) {
  const { t } = useI18n(locale)
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
