import { ArrowLeft, CircleStop, Ellipsis, History, Search, Settings2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { View, WordCard } from '../../core/contracts/types'
import type { SupportedLocale } from '../../core/i18n/i18n'
import { useI18n } from '../../core/i18n/i18n'

interface NavigationProps {
  locale: SupportedLocale
  view: View
  setView: (view: View) => void
  searchCards: WordCard[]
  onSearchSelect: (cardId: string) => void
  runActive: boolean
  onEndRun: () => void
}

/**
 * The Board and secondary views intentionally use different chrome. The
 * Board owns Search because Search returns to the spatial vocabulary world;
 * History and Settings only need Back plus the overflow destinations.
 */
export function Header(props: NavigationProps) {
  return props.view === 'board' ? <BoardHeader {...props} /> : <SecondaryHeader {...props} />
}

function BoardHeader(props: NavigationProps) {
  return <header className="topbar board-topbar"><div className="topbar-inner"><div className="header-leading"><BrandButton locale={props.locale} setView={props.setView} /></div><HeaderActions {...props} showSearch /></div></header>
}

function SecondaryHeader(props: NavigationProps) {
  const { t } = useI18n(props.locale)
  return <header className="topbar secondary-topbar"><div className="topbar-inner"><div className="header-leading"><button className="header-back-button" type="button" onClick={() => props.setView('board')} aria-label={t('nav.backToBoard')} title={t('nav.backToBoard')}><ArrowLeft size={18} /></button><BrandButton locale={props.locale} setView={props.setView} /></div><HeaderActions {...props} showSearch={false} /></div></header>
}

function BrandButton({ locale, setView }: Pick<NavigationProps, 'locale' | 'setView'>) {
  const { t } = useI18n(locale)
  return <button className="brand" type="button" onClick={() => setView('board')} aria-label={t('nav.openBoard')}><span className="brand-word">SimpleSpeak</span></button>
}

function HeaderActions({ locale, view, setView, searchCards, onSearchSelect, showSearch, runActive, onEndRun }: NavigationProps & { showSearch: boolean }) {
  const { t } = useI18n(locale)
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
    <div className="header-actions">
      {showSearch && <div className="header-search-wrap" ref={searchRef}>
        <button className={`header-search-button ${searchOpen ? 'active' : ''}`} type="button" onClick={() => setSearchOpen((current) => !current)} aria-expanded={searchOpen} aria-haspopup="true" aria-label={t('nav.searchWords')} title={t('nav.searchWords')}><Search size={18} /></button>
        {searchOpen && <div className="header-search-popover" aria-label={t('nav.searchWords')}>
          <div className="header-search-input-wrap">
            <Search size={15} aria-hidden="true" />
            <input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t('nav.findWord')} aria-label={t('nav.findWord')} autoComplete="off" />
            {searchQuery && <button className="header-search-clear" type="button" onClick={() => setSearchQuery('')} aria-label={t('nav.clearSearch')}><X size={14} /></button>}
          </div>
          <div className="header-search-results" aria-live="polite">
            {!searchQuery.trim() ? <span className="header-search-empty">{t('nav.searchHint')}</span> : searchResults.length === 0 ? <span className="header-search-empty">{t('nav.noMatches')}</span> : searchResults.map((card) => <button className="header-search-result" type="button" key={card.id} onClick={() => selectSearchResult(card.id)}><span className="header-search-result-mark" aria-hidden="true" /><span className="header-search-result-copy"><strong>{card.target}</strong><small>{card.origin}</small></span></button>)}
          </div>
        </div>}
      </div>}
      <div className="header-menu-wrap" ref={menuRef}>
        <button className={`header-menu-button ${menuOpen || view === 'history' || view === 'settings' ? 'active' : ''}`} type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-haspopup="true" aria-label={t('nav.openMoreViews')}><Ellipsis size={22} /></button>
        {menuOpen && <div className="header-menu-popover" aria-label={t('nav.more')}>
          <span className="header-menu-label">{t('nav.more')}</span>
          {runActive && <button className="header-end-run-button" type="button" onClick={() => { onEndRun(); setMenuOpen(false) }} aria-label={t('run.endAria')}><CircleStop size={16} /> {t('run.end')}</button>}
          <div className="header-view-tabs" role="tablist" aria-label={t('nav.secondaryViews')}>
            <button className={view === 'history' ? 'active' : ''} type="button" role="tab" aria-selected={view === 'history'} onClick={() => selectView('history')}><History size={16} /> {t('nav.history')}</button>
            <button className={view === 'settings' ? 'active' : ''} type="button" role="tab" aria-selected={view === 'settings'} onClick={() => selectView('settings')}><Settings2 size={16} /> {t('nav.settings')}</button>
          </div>
        </div>}
      </div>
    </div>
  )
}
