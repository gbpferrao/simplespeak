import { RotateCcw } from 'lucide-react'
import type { PersistedState, Settings as SimpleSpeakSettings } from '../../../core/contracts/types'
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

  return (
    <section className="view settings-view">
      <div className="view-heading">
        <h1>{t('settings.title')}</h1>
      </div>

      <div className="settings-grid">
        <div className="settings-main">
          <section className="settings-card">
            <h2>{t('settings.language')}</h2>
            <label className="field-label settings-language-field">
              <span className="sr-only">{t('settings.language')}</span>
              <select value={settings.uiLocale} onChange={(event) => onUpdateSettings({ uiLocale: event.target.value as SupportedLocale })}>
                {localeOptions.map((option) => <option key={option.code} value={option.code}>{option.nativeLabel}</option>)}
              </select>
            </label>
          </section>
        </div>

        <aside className="settings-aside">
          <div className="settings-card danger-card">
            <h2>{t('settings.startOver')}</h2>
            <button className="danger-button full-button" type="button" onClick={onResetLearning}><RotateCcw size={14} /> {t('settings.resetLearning')}</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
