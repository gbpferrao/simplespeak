import { History, Map, Play, Search, Settings, Sparkles } from 'lucide-react'
import type { View } from '../../core/contracts/types'
import type { ProgressStats } from '../../features/history/domain/progressStats'

interface NavigationProps {
  view: View
  setView: (view: View) => void
  stats: ProgressStats
}

const navItems: Array<{ id: View; label: string; icon: typeof Map }> = [
  { id: 'board', label: 'Board', icon: Map },
  { id: 'run', label: 'Run', icon: Play },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Header({ view, setView, search, setSearch, stats }: NavigationProps & { search: string; setSearch: (value: string) => void }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" type="button" onClick={() => setView('board')} aria-label="Open SimpleSpeak board">
          <span className="brand-mark"><Sparkles size={17} strokeWidth={2.5} /></span>
          <span className="brand-copy"><span className="brand-word">simplespeak</span><span className="brand-context">English foundations</span></span>
        </button>
        <label className="topbar-search">
          <Search size={16} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a word..." aria-label="Find a word" />
        </label>
        <div className="topbar-actions">
          <span className="due-chip"><span className="due-chip-dot" />{stats.due} due</span>
          <span className="progress-chip">{stats.anchored}/{stats.total} steady</span>
          <button className={`icon-button ${view === 'settings' ? 'active' : ''}`} type="button" onClick={() => setView('settings')} aria-label="Open settings"><Settings size={18} /></button>
        </div>
      </div>
    </header>
  )
}

export function AppNav({ view, setView, stats }: NavigationProps) {
  return <nav className="app-nav" aria-label="Primary navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} type="button" onClick={() => setView(id)}><Icon size={18} /><span>{label}</span>{id === 'run' && stats.due > 0 && <small>{stats.due}</small>}</button>)}</nav>
}
