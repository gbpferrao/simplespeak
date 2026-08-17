import { Sparkles } from 'lucide-react'
import { Header } from './presentation/Navigation'
import { useSimpleSpeakController } from './useSimpleSpeakController'
import { learningFor } from '../core/presentation/selectors'
import starterPack from '../features/language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { BoardView } from '../features/board/presentation/BoardView'
import { HistoryView } from '../features/history/presentation/HistoryView'
import { SettingsView } from '../features/settings/presentation/SettingsView'
import { CardDetail } from '../features/vocabulary/presentation/CardDetail'
import { StabilityPanel } from '../features/vocabulary/presentation/StabilityPanel'
import { useI18n } from '../core/i18n/i18n'

export function AppShell() {
  const controller = useSimpleSpeakController()
  const { locale, t } = useI18n(controller.data.settings.uiLocale)

  if (!controller.hydrated) {
    return <div className="loading-screen"><div className="brand-mark"><Sparkles size={18} /></div><span>{t('app.opening')}</span></div>
  }

  const { data, view, setView, stats, selectedCard, stabilityCard } = controller
  const activeRun = controller.runSession && !controller.runSession.finished ? controller.runSession : null
  const boardVisible = view === 'board' || Boolean(activeRun)

  return (
    <div className={`app-shell ${boardVisible ? 'board-shell' : ''} ${controller.feedback ? `feedback-${controller.feedback}` : ''}`}>
      <Header locale={locale} view={view} setView={setView} searchCards={starterPack.cards} onSearchSelect={(cardId) => { controller.setSelectedCardId(null); controller.setStabilityCardId(null); controller.setBoardFocusId(cardId); controller.setView('board') }} />
      <main className="main-content">
        {boardVisible && <BoardView locale={locale} state={data} stats={stats} focusId={controller.boardFocusId} setFocusId={controller.setBoardFocusId} onSelectCard={controller.setSelectedCardId} onStartRun={(config) => { controller.setRunConfig(config); controller.startRun(config) }} runSession={activeRun} onReveal={controller.revealRunCard} onAnswer={controller.answerRun} onTypedChange={controller.setTypedAnswer} onExitRun={controller.exitRun} />}
        {view === 'history' && !activeRun && <HistoryView locale={locale} state={data} stats={stats} onOpenCard={controller.setSelectedCardId} />}
        {view === 'settings' && !activeRun && <SettingsView locale={locale} state={data} apiKey={controller.apiKey} setApiKey={controller.setApiKey} onSaveApiKey={controller.persistApiKey} onUpdateSettings={controller.updateSettings} onResetLearning={controller.resetLearning} />}
      </main>
      {selectedCard && <CardDetail card={selectedCard} state={data} generating={controller.generatingCardId === selectedCard.id} onClose={() => controller.setSelectedCardId(null)} onGenerate={(description) => { void controller.generateCardImage(selectedCard, description) }} onOpenStability={() => controller.setStabilityCardId(selectedCard.id)} onSaveNote={(note) => controller.saveNote(selectedCard.id, note)} />}
      {stabilityCard && <StabilityPanel locale={locale} card={stabilityCard} learning={learningFor(data, stabilityCard.id)} onClose={() => controller.setStabilityCardId(null)} />}
      {controller.toast && <div className="toast" role="status"><Sparkles size={15} />{controller.toast}</div>}
    </div>
  )
}
