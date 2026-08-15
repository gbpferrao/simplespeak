import { Sparkles } from 'lucide-react'
import { AppNav, Header } from './presentation/Navigation'
import { useSimpleSpeakController } from './useSimpleSpeakController'
import { learningFor } from '../core/presentation/selectors'
import { BoardView } from '../features/board/presentation/BoardView'
import { HistoryView } from '../features/history/presentation/HistoryView'
import { RunView } from '../features/study/presentation/RunView'
import { SettingsView } from '../features/settings/presentation/SettingsView'
import { CardDetail } from '../features/vocabulary/presentation/CardDetail'
import { StabilityPanel } from '../features/vocabulary/presentation/StabilityPanel'

export function AppShell() {
  const controller = useSimpleSpeakController()

  if (!controller.hydrated) {
    return <div className="loading-screen"><div className="brand-mark"><Sparkles size={18} /></div><span>Opening your board...</span></div>
  }

  const { data, view, setView, stats, selectedCard, stabilityCard } = controller
  const activeRun = view === 'run' && controller.runSession && !controller.runSession.finished ? controller.runSession : null

  return (
    <div className={`app-shell ${controller.feedback ? `feedback-${controller.feedback}` : ''}`}>
      <Header view={view} setView={setView} search={controller.search} setSearch={controller.setSearch} stats={stats} />
      <main className="main-content">
        {(view === 'board' || activeRun) && <BoardView state={data} stats={stats} search={controller.search} selectedSceneId={controller.selectedSceneId} setSelectedSceneId={controller.setSelectedSceneId} focusId={controller.boardFocusId} setFocusId={controller.setBoardFocusId} onSelectCard={controller.setSelectedCardId} onStartRun={(config) => { controller.setRunConfig(config); controller.startRun(config) }} onOpenRun={() => setView('run')} runSession={activeRun} onReveal={controller.revealRunCard} onAnswer={controller.answerRun} onTypedChange={controller.setTypedAnswer} onExitRun={() => setView('board')} />}
        {view === 'run' && !activeRun && <RunView session={controller.runSession} state={data} config={controller.runConfig} setConfig={controller.setRunConfig} onStart={controller.startRun} onReveal={controller.revealRunCard} onAnswer={controller.answerRun} onTypedChange={controller.setTypedAnswer} onOpenCard={controller.setSelectedCardId} onOpenBoard={() => setView('board')} />}
        {view === 'history' && <HistoryView state={data} stats={stats} onOpenCard={controller.setSelectedCardId} />}
        {view === 'settings' && <SettingsView state={data} apiKey={controller.apiKey} setApiKey={controller.setApiKey} onSaveApiKey={controller.persistApiKey} onUpdateSettings={controller.updateSettings} onResetLearning={controller.resetLearning} />}
      </main>
      <AppNav view={view} setView={setView} stats={stats} />
      {selectedCard && <CardDetail card={selectedCard} state={data} generating={controller.generatingCardId === selectedCard.id} onClose={() => controller.setSelectedCardId(null)} onGenerate={(description) => { void controller.generateCardImage(selectedCard, description) }} onOpenStability={() => controller.setStabilityCardId(selectedCard.id)} onSaveNote={(note) => controller.saveNote(selectedCard.id, note)} />}
      {stabilityCard && <StabilityPanel card={stabilityCard} learning={learningFor(data, stabilityCard.id)} onClose={() => controller.setStabilityCardId(null)} />}
      {controller.toast && <div className="toast" role="status"><Sparkles size={15} />{controller.toast}</div>}
    </div>
  )
}
