import { useState } from 'react'
import { ArrowUpRight, BookOpen, Brain, Check, CloudOff, Eye, EyeOff, Lightbulb, LockKeyhole, RefreshCw, RotateCcw, Save, Settings, ShieldCheck, WandSparkles } from 'lucide-react'
import type { ImageEffort, ImageResolution, PersistedState, Settings as SimpleSpeakSettings } from '../../../core/contracts/types'
import { defaultSettings } from '../../../core/persistence/localStateRepository'
import { imageEffortLabel, imageResolutionLabel } from '../../image-generation/domain/options'
import { starterPack } from '../../language-packs/data/starterPack'

interface SettingsViewProps {
  state: PersistedState
  apiKey: string
  setApiKey: (value: string) => void
  onSaveApiKey: () => Promise<void>
  onUpdateSettings: (patch: Partial<SimpleSpeakSettings>) => void
  onResetLearning: () => void
}

export function SettingsView({ state, apiKey, setApiKey, onSaveApiKey, onUpdateSettings, onResetLearning }: SettingsViewProps) {
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
          <div className="eyebrow"><Settings size={14} /> Control room</div>
          <h1>Make the board yours.</h1>
          <p>Everything stays on this device except the image request you explicitly send to Google.</p>
        </div>
        <div className="settings-safety"><LockKeyhole size={14} /> local settings</div>
      </div>

      <div className="settings-grid">
        <div className="settings-main">
          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <span className="eyebrow"><WandSparkles size={13} /> Image studio</span>
                <h2>Give the cards a visual hook.</h2>
              </div>
              <span className="settings-status">
                <span className={apiKey.trim() ? 'status-dot on' : 'status-dot'} />
                {apiKey.trim() ? 'key present' : 'key needed'}
              </span>
            </div>

            <p className="settings-lead">Paste a Google AI API key to generate square card visuals. A saved image is kept locally; regenerate to overwrite it, and a failed request leaves the previous image untouched.</p>

            <label className="field-label">
              Google AI API key
              <div className="secret-field">
                <LockKeyhole size={15} />
                <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="AIza..." autoComplete="off" />
                <button type="button" onClick={() => setShowKey((current) => !current)} aria-label={showKey ? 'Hide API key' : 'Show API key'}>
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <div className="settings-inline-actions">
              <button className="primary-button" type="button" onClick={() => { void onSaveApiKey() }}><Save size={15} /> Save key</button>
              <span><ShieldCheck size={14} /> Stored with device preferences; no SimpleSpeak server.</span>
            </div>

            <div className="field-grid">
              <label className="field-label">
                Model id
                <input value={settings.modelId} onChange={(event) => onUpdateSettings({ modelId: event.target.value })} placeholder="gemini-3.1-flash-image" />
              </label>
              <label className="field-label">
                Model effort
                <select value={settings.effort} onChange={(event) => onUpdateSettings({ effort: event.target.value as ImageEffort })}>
                  <option value="minimal">{imageEffortLabel('minimal')}</option>
                  <option value="high">{imageEffortLabel('high')}</option>
                </select>
              </label>
              <label className="field-label">
                Resolution
                <select value={settings.resolution} onChange={(event) => onUpdateSettings({ resolution: event.target.value as ImageResolution })}>
                  <option value="512">{imageResolutionLabel('512')}</option>
                  <option value="1K">{imageResolutionLabel('1K')}</option>
                  <option value="2K">{imageResolutionLabel('2K')}</option>
                </select>
              </label>
              <label className="field-label">
                Aspect ratio
                <div className="locked-select"><span>1:1 square</span><LockKeyhole size={13} /></div>
              </label>
            </div>

            <p className="small-muted image-settings-note">Gemini 3.1 Flash Image uses 512px, 1K, or 2K here. 1K is the balanced default for card visuals.</p>

            <label className="field-label">
              Inner image prompt
              <div className="prompt-field">
                <textarea value={settings.innerPrompt} onChange={(event) => onUpdateSettings({ innerPrompt: event.target.value })} rows={5} />
                <span>{settings.innerPrompt.length} characters</span>
              </div>
            </label>
            <div className="prompt-reset-row">
              <span>Prompt is sent as the model instruction, followed by the card description.</span>
              <button className="text-button" type="button" onClick={() => onUpdateSettings({ innerPrompt: defaultSettings.innerPrompt })}><RefreshCw size={13} /> Reset default</button>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <span className="eyebrow"><Brain size={13} /> Learning rhythm</span>
                <h2>Make irregular use work.</h2>
              </div>
            </div>
            <p className="settings-lead">The horizon shapes suggested targets. It does not punish a gap or create fake missed days.</p>
            <div className="field-grid">
              <label className="field-label">
                Overall horizon
                <select value={settings.timeframeDays} onChange={(event) => onUpdateSettings({ timeframeDays: Number(event.target.value) })}>
                  <option value="30">30 days - quick orbit</option>
                  <option value="90">90 days - steady orbit</option>
                  <option value="180">180 days - long orbit</option>
                  <option value="365">365 days - deep board</option>
                </select>
              </label>
              <label className="field-label">
                Daily target
                <select value={settings.dailyTarget} onChange={(event) => onUpdateSettings({ dailyTarget: Number(event.target.value) })}>
                  <option value="6">6 cards - gentle</option>
                  <option value="12">12 cards - balanced</option>
                  <option value="20">20 cards - focused</option>
                  <option value="30">30 cards - deep</option>
                </select>
              </label>
            </div>
            <div className="principle-callout">
              <Lightbulb size={16} />
              <div><strong>Return when you can.</strong><span>The engine uses elapsed time and today&apos;s performance. It does not pretend you studied on days you did not.</span></div>
            </div>
          </section>
        </div>

        <aside className="settings-aside">
          <div className="settings-card pack-card">
            <div className="pack-card-visual"><span><BookOpen size={22} /></span><div className="pack-stars"><i /><i /><i /><i /><i /></div></div>
            <span className="eyebrow">Loaded language pack</span>
            <h2>{starterPack.name}</h2>
            <p>{starterPack.targetLanguage} -&gt; {starterPack.originLanguage}</p>
            <div className="pack-info-line"><span>{starterPack.cards.length} cards</span><span>{starterPack.scenes.length} scenes</span></div>
            <button className="soft-button full-button" type="button" onClick={exportPack}><ArrowUpRight size={15} /> Export pack JSON</button>
          </div>

          <div className="settings-card local-card">
            <CloudOff size={19} />
            <h3>Offline by default</h3>
            <p>Board, notes, runs, review history, and generated images work without a network. Only generation uses the API key.</p>
            <div className="local-check"><Check size={14} /> local state</div>
            <div className="local-check"><Check size={14} /> local images</div>
            <div className="local-check"><Check size={14} /> local history</div>
          </div>

          <div className="settings-card danger-card">
            <div><span className="eyebrow">Maintenance</span><h3>Start the learning state over</h3><p>Keep image settings, clear review history and saved images.</p></div>
            <button className="danger-button" type="button" onClick={onResetLearning}><RotateCcw size={14} /> Reset learning</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
