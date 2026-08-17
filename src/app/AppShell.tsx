import { Sparkles } from 'lucide-react'
import { Header } from './presentation/Navigation'
import { NotificationCenter } from './presentation/NotificationCenter'
import { useSimpleSpeakController } from './useSimpleSpeakController'
import starterPack from '../features/language-packs/data/packs/ptbr-en/simplespeak-v1.json'
import { BoardView } from '../features/board/presentation/BoardView'
import { HistoryView } from '../features/history/presentation/HistoryView'
import { SettingsView } from '../features/settings/presentation/SettingsView'
import { CardDetail } from '../features/vocabulary/presentation/CardDetail'
import { useI18n } from '../core/i18n/i18n'

export function AppShell() {
  const controller = useSimpleSpeakController()
  const { locale, t } = useI18n(controller.data.settings.uiLocale)

  if (!controller.hydrated) {
    return <div className="loading-screen"><div className="brand-mark"><Sparkles size={18} /></div><span>{t('app.opening')}</span></div>
  }

  const { data, view, setView, stats, selectedCard } = controller
  const activeRun = controller.runSession && !controller.runSession.finished ? controller.runSession : null
  const boardVisible = view === 'board' || Boolean(activeRun)

  return (
    <div className={`app-shell ${boardVisible ? 'board-shell' : ''} ${activeRun ? 'run-active' : ''} ${controller.feedback ? `feedback-${controller.feedback}` : ''}`}>
      <Header locale={locale} view={view} setView={setView} searchCards={starterPack.cards} onSearchSelect={(cardId) => { controller.setSelectedCardId(null); controller.setBoardFocusId(cardId); controller.setView('board') }} runActive={Boolean(activeRun)} onEndRun={controller.endRun} />
      <main className="main-content">
        {boardVisible && <BoardView locale={locale} state={data} stats={stats} focusId={controller.boardFocusId} setFocusId={controller.setBoardFocusId} onSelectCard={controller.setSelectedCardId} onStartRun={(config) => { controller.setRunConfig(config); controller.startRun(config) }} runSession={activeRun} onReveal={controller.revealRunCard} onAnswer={controller.answerRun} onTypedChange={controller.setTypedAnswer} onExitRun={controller.exitRun} />}
        {view === 'history' && !activeRun && <HistoryView locale={locale} state={data} onOpenCard={controller.setSelectedCardId} onRerunRun={controller.startRun} />}
        {view === 'settings' && !activeRun && <SettingsView locale={locale} state={data} onUpdateSettings={controller.updateSettings} onResetLearning={controller.resetLearning} />}
      </main>
      {selectedCard && <CardDetail card={selectedCard} state={data} onClose={() => controller.setSelectedCardId(null)} onSaveNote={(note) => controller.saveNote(selectedCard.id, note)} />}
      <NotificationCenter notifications={controller.notifications} label={t('notification.title')} dismissLabel={t('notification.dismiss')} onDismiss={controller.dismissNotification} />
    </div>
  )
}
