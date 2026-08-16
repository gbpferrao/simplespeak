import { Ellipsis, History, Search, Settings2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { View, WordCard } from '../../core/contracts/types'

interface NavigationProps {
  view: View
  setView: (view: View) => void
  searchCards: WordCard[]
  onSearchSelect: (cardId: string) => void
}

export function Header({ view, setView, searchCards, onSearchSelect }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent): void {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false)
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [searchOpen])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return searchCards.filter((card) => [card.target, card.origin, card.sense ?? '', ...(card.answers ?? [])].some((value) => value.toLowerCase().includes(query))).slice(0, 7)
  }, [searchCards, searchQuery])

  function selectView(nextView: View): void {
    setView(nextView)
    setMenuOpen(false)
  }

  function selectSearchResult(cardId: string): void {
    onSearchSelect(cardId)
    setSearchQuery('')
    setSearchOpen(false)
    setMenuOpen(false)
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" type="button" onClick={() => selectView('board')} aria-label="Open SimpleSpeak board">
          <span className="brand-word">SimpleSpeak</span>
        </button>
        <div className="header-actions">
          <div className="header-search-wrap" ref={searchRef}>
            <button className={`header-search-button ${searchOpen ? 'active' : ''}`} type="button" onClick={() => setSearchOpen((current) => !current)} aria-expanded={searchOpen} aria-haspopup="true" aria-label="Search words" title="Search words"><Search size={18} /></button>
            {searchOpen && <div className="header-search-popover" aria-label="Search words">
              <div className="header-search-input-wrap">
                <Search size={15} aria-hidden="true" />
                <input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find a word" aria-label="Find a word" autoComplete="off" />
                {searchQuery && <button className="header-search-clear" type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14} /></button>}
              </div>
              <div className="header-search-results" aria-live="polite">
                {!searchQuery.trim() ? <span className="header-search-empty">Type to find it on the board.</span> : searchResults.length === 0 ? <span className="header-search-empty">No matching words.</span> : searchResults.map((card) => <button className="header-search-result" type="button" key={card.id} onClick={() => selectSearchResult(card.id)}><span className="header-search-result-mark" aria-hidden="true" /><span className="header-search-result-copy"><strong>{card.target}</strong><small>{card.origin}</small></span></button>)}
              </div>
            </div>}
          </div>
          <div className="header-menu-wrap" ref={menuRef}>
            <button className={`header-menu-button ${menuOpen || view === 'history' || view === 'settings' ? 'active' : ''}`} type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-haspopup="true" aria-label="Open more views"><Ellipsis size={22} /></button>
            {menuOpen && <div className="header-menu-popover" aria-label="More views">
              <span className="header-menu-label">More</span>
              <div className="header-view-tabs" role="tablist" aria-label="Secondary views">
                <button className={view === 'history' ? 'active' : ''} type="button" role="tab" aria-selected={view === 'history'} onClick={() => selectView('history')}><History size={16} /> History</button>
                <button className={view === 'settings' ? 'active' : ''} type="button" role="tab" aria-selected={view === 'settings'} onClick={() => selectView('settings')}><Settings2 size={16} /> Settings</button>
              </div>
            </div>}
          </div>
        </div>
      </div>
    </header>
  )
}
