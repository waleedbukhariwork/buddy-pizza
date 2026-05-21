'use client'
import React from 'react'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { CustomerShell } from '../layout/customer-shell'
import { FoodCard } from '../menu/food-card'
import { Icons } from '../ui/icon'
import { CatIcon } from '../ui/cat-icon'
import { useProducts, useCategories, useProductSearch } from '../../lib/hooks'
import { type Tone } from '../ui/food-img'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TONES: Tone[] = ['ember', 'amber', 'cream']
const RECENT_KEY = 'bf_recent_searches'
const MAX_RECENT = 5

function loadRecent(): string[] {
	try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(q: string) {
	const list = [q, ...loadRecent().filter(r => r !== q)].slice(0, MAX_RECENT)
	localStorage.setItem(RECENT_KEY, JSON.stringify(list))
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

// ─── Highlight matching text ──────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
	if (!query.trim()) return <>{text}</>
	const idx = text.toLowerCase().indexOf(query.toLowerCase())
	if (idx === -1) return <>{text}</>
	return (
		<>
			{text.slice(0, idx)}
			<mark style={{ background: 'var(--bf-amber)', color: 'var(--bf-ink)', borderRadius: 3, padding: '0 2px' }}>
				{text.slice(idx, idx + query.length)}
			</mark>
			{text.slice(idx + query.length)}
		</>
	)
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
	if (totalPages <= 1) return null

	const pages: (number | '…')[] = []
	if (totalPages <= 7) {
		for (let i = 0; i < totalPages; i++) pages.push(i)
	} else {
		pages.push(0)
		if (page > 2) pages.push('…')
		for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i)
		if (page < totalPages - 3) pages.push('…')
		pages.push(totalPages - 1)
	}

	const Chev = ({ d }: { d: string }) => (
		<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
			<path d={d} />
		</svg>
	)

	return (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40 }}>
			<button className='bf-btn bf-btn-outline bf-btn-sm' disabled={page === 0} onClick={() => onPage(page - 1)}
				style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: page === 0 ? 0.4 : 1 }}>
				<Chev d='M15 18l-6-6 6-6' /> Prev
			</button>
			{pages.map((p, i) =>
				p === '…' ? (
					<span key={`el-${i}`} style={{ padding: '0 4px', color: 'var(--bf-mute)', fontSize: 13 }}>…</span>
				) : (
					<button key={p} onClick={() => onPage(p as number)}
						style={{
							width: 36, height: 36, padding: 0, fontSize: 13, cursor: 'pointer',
							fontWeight: p === page ? 800 : 600,
							background: p === page ? 'var(--bf-ink)' : 'transparent',
							color: p === page ? '#fff' : 'var(--bf-ink-2)',
							border: p === page ? 'none' : '1.5px solid var(--bf-line-2)',
							borderRadius: 8, fontFamily: 'var(--bf-font)',
						}}>
						{(p as number) + 1}
					</button>
				)
			)}
			<button className='bf-btn bf-btn-outline bf-btn-sm' disabled={page === totalPages - 1} onClick={() => onPage(page + 1)}
				style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: page === totalPages - 1 ? 0.4 : 1 }}>
				Next <Chev d='M9 18l6-6-6-6' />
			</button>
		</div>
	)
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
function MenuExperience() {
	const [activeId, setActiveId] = useState<number | null>(null)
	const [view, setView] = useState<'list' | 'grid'>('list')

	// Search state — two layers: input (live) and committed (fires full results)
	const [inputVal, setInputVal] = useState('')
	const [suggestQ, setSuggestQ] = useState('')   // debounced from inputVal → dropdown
	const [searchQ, setSearchQ] = useState('')     // committed → paginated results
	const [searchPage, setSearchPage] = useState(0)
	const [showDropdown, setShowDropdown] = useState(false)
	const [activeIdx, setActiveIdx] = useState(-1) // keyboard navigation
	const [recentSearches, setRecentSearches] = useState<string[]>([])

	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)

	const router = useRouter()
	const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
	const searchWrapRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const catStripRef = useRef<HTMLDivElement>(null)
	const tabsScrollRef = useRef<HTMLDivElement>(null)
	const lastScrollY = useRef(0)
	const headerH = useRef(69)

	const { data: products, isLoading: productsLoading } = useProducts()
	const { data: categories, isLoading: catsLoading } = useCategories()
	const activeCategories = useMemo(() => categories?.filter(c => c.isActive) ?? [], [categories])

	// Suggestions — debounce 250 ms, returns up to 6 items for dropdown
	const { data: suggestData } = useProductSearch(suggestQ, null, 0, 6)
	const suggestions = suggestData?.content ?? []

	// Full paginated results — only fires when searchQ is non-empty
	const { data: searchData, isLoading: searchLoading, error: searchError } = useProductSearch(searchQ, null, searchPage, 12)

	const isSearchMode = searchQ.trim().length > 0

	// Debounce inputVal → suggestQ (250ms, Swiggy/Zomato cadence)
	useEffect(() => {
		if (suggestDebounce.current) clearTimeout(suggestDebounce.current)
		suggestDebounce.current = setTimeout(() => setSuggestQ(inputVal.trim()), 250)
		return () => { if (suggestDebounce.current) clearTimeout(suggestDebounce.current) }
	}, [inputVal])

	// Load recent searches from localStorage on mount
	useEffect(() => { setRecentSearches(loadRecent()) }, [])

	// Close dropdown on outside click
	useEffect(() => {
		function onMouseDown(e: MouseEvent) {
			if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
				setShowDropdown(false)
				setActiveIdx(-1)
			}
		}
		document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [])

	// Auto-select first category or honour ?category=&q= from URL
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const q = params.get('q')
		const catParam = params.get('category')
		if (q) { setInputVal(q); setSuggestQ(q); setSearchQ(q) }
		if (catParam) {
			setActiveId(Number(catParam))
		} else if (activeCategories.length > 0 && activeId === null) {
			setActiveId(activeCategories[0].id)
		}
	}, [activeCategories, activeId])

	// Sync category strip top with header hide/show
	useEffect(() => {
		const header = document.querySelector('.bf-smart-header') as HTMLElement | null
		if (header) headerH.current = header.offsetHeight
		function onScroll() {
			const y = window.scrollY
			const delta = y - lastScrollY.current
			if (catStripRef.current) {
				if (delta > 10 && y > 80) catStripRef.current.style.top = '0px'
				else if (delta < -5) catStripRef.current.style.top = `${headerH.current}px`
			}
			lastScrollY.current = y
		}
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	// Scroll active category tab into view
	useEffect(() => {
		if (!tabsScrollRef.current) return
		const activeBtn = tabsScrollRef.current.querySelector('[data-active="true"]') as HTMLElement | null
		activeBtn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
	}, [activeId])

	// Commit a search — saves to recent, triggers full results, closes dropdown
	const commitSearch = useCallback((val: string) => {
		const q = val.trim()
		if (!q) return
		saveRecent(q)
		setRecentSearches(loadRecent())
		setInputVal(q)
		setSuggestQ('')  // stop the suggestion fetch; full results take over
		setSearchQ(q)
		setSearchPage(0)
		setShowDropdown(false)
		setActiveIdx(-1)
		router.replace(`/menu?q=${encodeURIComponent(q)}`, { scroll: false })
	}, [router])

	const clearSearch = useCallback(() => {
		setInputVal('')
		setSuggestQ('')
		setSearchQ('')
		setSearchPage(0)
		setShowDropdown(false)
		setActiveIdx(-1)
		inputRef.current?.focus()
		router.replace('/menu', { scroll: false })
	}, [router])

	const updateScrollArrows = useCallback(() => {
		const el = tabsScrollRef.current
		if (!el) return
		setCanScrollLeft(el.scrollLeft > 8)
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
	}, [])

	const scrollCats = useCallback((dir: 'left' | 'right') => {
		const el = tabsScrollRef.current
		if (!el) return
		el.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
	}, [])

	useEffect(() => {
		const el = tabsScrollRef.current
		if (!el) return
		updateScrollArrows()
		el.addEventListener('scroll', updateScrollArrows, { passive: true })
		const ro = new ResizeObserver(updateScrollArrows)
		ro.observe(el)
		return () => { el.removeEventListener('scroll', updateScrollArrows); ro.disconnect() }
	}, [updateScrollArrows, activeCategories])

	// Items shown in dropdown: recent searches (when empty) or live suggestions
	const dropdownItems: { type: 'recent' | 'suggestion'; label: string; sub?: string }[] =
		inputVal.trim()
			? suggestions.map(s => ({ type: 'suggestion', label: s.name, sub: s.category }))
			: recentSearches.map(r => ({ type: 'recent', label: r }))

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (!showDropdown || dropdownItems.length === 0) {
			if (e.key === 'Enter') commitSearch(inputVal)
			if (e.key === 'Escape') { clearSearch(); setShowDropdown(false) }
			return
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActiveIdx(i => Math.min(i + 1, dropdownItems.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActiveIdx(i => Math.max(i - 1, -1))
		} else if (e.key === 'Enter') {
			e.preventDefault()
			if (activeIdx >= 0) commitSearch(dropdownItems[activeIdx].label)
			else commitSearch(inputVal)
		} else if (e.key === 'Escape') {
			setShowDropdown(false)
			setActiveIdx(-1)
		}
	}

	// Category browse (client-side, no search)
	const categoryVisible = useMemo(() => {
		if (!products || activeId === null) return []
		return products.filter(p => p.categoryId === activeId && p.isAvailable)
	}, [products, activeId])

	const activeCategory = activeCategories.find(c => c.id === activeId)
	const isLoading = catsLoading || productsLoading

	return (
		<CustomerShell activePage='menu'>
			<main>
				{/* Category strip — hidden while in search mode */}
				{!isSearchMode && (
					<div ref={catStripRef} style={{ borderBottom: '1px solid var(--bf-line)', background: 'var(--bf-cream)', position: 'sticky', top: 69, zIndex: 10, transition: 'top 0.22s ease-out' }}>
						<div style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 56px 0', position: 'relative' }}>

							{/* Left fade + scroll arrow */}
							{canScrollLeft && (
								<>
									<div style={{ position: 'absolute', left: 56, top: 10, bottom: 0, width: 72, background: 'linear-gradient(to right, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button className='bf-cat-scroll-btn' onClick={() => scrollCats('left')} style={{ position: 'absolute', left: 60, top: '50%', transform: 'translateY(-65%)', zIndex: 2 }}>
										<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M15 18l-6-6 6-6' /></svg>
									</button>
								</>
							)}

							{/* Scrollable strip */}
							<div ref={tabsScrollRef} className='bf-scroll' style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }}>
								{catsLoading
									? Array.from({ length: 6 }).map((_, i) => (
										<Skel key={i} h={38} style={{ width: 110, borderRadius: 999, flexShrink: 0 }} />
									))
									: activeCategories.map(c => {
										const count = products?.filter(p => p.categoryId === c.id && p.isAvailable).length ?? 0
										const isActive = c.id === activeId
										return (
											<button key={c.id} data-active={isActive ? 'true' : undefined}
												className='bf-cat-menu-pill'
												onClick={() => setActiveId(c.id)}>
												<CatIcon name={c.name} size={18} />
												<span>{c.name}</span>
												{count > 0 && (
													<span className='bf-cat-menu-pill-count'>{count}</span>
												)}
											</button>
										)
									})
								}
							</div>

							{/* Right fade + scroll arrow */}
							{canScrollRight && (
								<>
									<div style={{ position: 'absolute', right: 56, top: 10, bottom: 0, width: 72, background: 'linear-gradient(to left, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button className='bf-cat-scroll-btn' onClick={() => scrollCats('right')} style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-65%)', zIndex: 2 }}>
										<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M9 18l6-6-6-6' /></svg>
									</button>
								</>
							)}
						</div>
					</div>
				)}

				<div style={{ padding: '24px 56px 56px', maxWidth: 1280, margin: '0 auto' }}>
					{/* Header row */}
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
						<div>
							{isSearchMode ? (
								<>
									<div className='bf-eyebrow'>
										{searchLoading ? 'SEARCHING…' : `${searchData?.totalElements ?? 0} RESULTS`}
									</div>
									<h1 style={{ fontWeight: 800, fontSize: 44, margin: '6px 0 0', letterSpacing: '-0.028em' }}>
										&ldquo;{searchQ}&rdquo;
									</h1>
								</>
							) : isLoading ? (
								<>
									<Skel h={12} style={{ width: 120, marginBottom: 8 }} />
									<Skel h={44} style={{ width: 200 }} />
								</>
							) : (
								<>
									<div className='bf-eyebrow'>CATEGORY · {categoryVisible.length} ITEMS</div>
									<h1 style={{ fontWeight: 800, fontSize: 44, margin: '6px 0 0', letterSpacing: '-0.028em' }}>
										{activeCategory?.name ?? 'Menu'}
									</h1>
								</>
							)}
						</div>
						<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
							<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={() => setView('grid')} style={{ width: 32, height: 32, background: view === 'grid' ? 'var(--bf-ink)' : undefined, color: view === 'grid' ? '#fff' : undefined }}>{Icons.grid}</button>
							<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={() => setView('list')} style={{ width: 32, height: 32, background: view === 'list' ? 'var(--bf-ink)' : undefined, color: view === 'list' ? '#fff' : undefined }}>{Icons.list}</button>
						</div>
					</div>

					{/* ── Search bar + dropdown ── */}
					<div ref={searchWrapRef} style={{ position: 'relative', maxWidth: 520, marginBottom: 22 }}>
						<div style={{
							display: 'flex', alignItems: 'center',
							background: 'var(--bf-paper)',
							borderRadius: showDropdown && dropdownItems.length > 0 ? '12px 12px 0 0' : 12,
							border: `1.5px solid ${showDropdown ? 'var(--bf-ember)' : isSearchMode ? 'var(--bf-ember)' : 'var(--bf-line-2)'}`,
							borderBottom: showDropdown && dropdownItems.length > 0 ? '1px solid var(--bf-line)' : undefined,
							transition: 'border-color .15s',
							overflow: 'hidden',
						}}>
							{/* Search icon */}
							<span style={{ color: showDropdown || isSearchMode ? 'var(--bf-ember)' : 'var(--bf-mute)', flexShrink: 0, display: 'flex', padding: '0 14px', transition: 'color .15s' }}>
								{Icons.search}
							</span>

							<input
								ref={inputRef}
								value={inputVal}
								onChange={e => { setInputVal(e.target.value); setShowDropdown(true); setActiveIdx(-1) }}
								onFocus={() => setShowDropdown(true)}
								onKeyDown={handleKeyDown}
								style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--bf-font)', fontSize: 14, flex: 1, color: 'var(--bf-ink)', minWidth: 0, padding: '12px 0' }}
								placeholder={`Search ${activeCategory?.name ?? 'all items'}…`}
								autoComplete='off'
								spellCheck={false}
							/>

							{/* Spinner while fetching full results */}
							{isSearchMode && searchLoading && (
								<span style={{ flexShrink: 0, display: 'flex', color: 'var(--bf-mute)', padding: '0 10px' }}>
									<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' style={{ animation: 'bf-spin 0.8s linear infinite' }}>
										<path d='M21 12a9 9 0 1 1-6.219-8.56' />
									</svg>
								</span>
							)}

							{/* Clear */}
							{inputVal && (
								<button onClick={clearSearch} className='bf-btn bf-btn-ghost'
									style={{ width: 36, height: 36, padding: 0, borderRadius: 0, color: 'var(--bf-mute)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									{Icons.x}
								</button>
							)}
						</div>

						{/* ── Dropdown ── */}
						{showDropdown && dropdownItems.length > 0 && (
							<div style={{
								position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
								background: 'var(--bf-paper)',
								border: '1.5px solid var(--bf-ember)',
								borderTop: 'none',
								borderRadius: '0 0 12px 12px',
								boxShadow: '0 12px 32px rgba(35,31,32,.12)',
								overflow: 'hidden',
							}}>
								{/* Section label */}
								<div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', letterSpacing: '0.1em' }}>
									{inputVal.trim() ? 'SUGGESTIONS' : 'RECENT SEARCHES'}
								</div>

								{dropdownItems.map((item, i) => (
									<button
										key={`${item.type}-${i}`}
										onMouseDown={e => { e.preventDefault(); commitSearch(item.label) }}
										onMouseEnter={() => setActiveIdx(i)}
										style={{
											width: '100%', display: 'flex', alignItems: 'center', gap: 10,
											padding: '10px 14px', border: 'none', textAlign: 'left', cursor: 'pointer',
											background: activeIdx === i ? 'var(--bf-cream)' : 'transparent',
											fontFamily: 'var(--bf-font)', transition: 'background .1s',
										}}
									>
										<span style={{ flexShrink: 0, color: 'var(--bf-mute)', display: 'flex' }}>
											{item.type === 'recent' ? (
												<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
													<circle cx='12' cy='12' r='10' /><polyline points='12 6 12 12 16 14' />
												</svg>
											) : Icons.search}
										</span>
										<span style={{ flex: 1, fontSize: 14, color: 'var(--bf-ink)', minWidth: 0 }}>
											<Highlight text={item.label} query={inputVal} />
										</span>
										{item.sub && (
											<span style={{ fontSize: 11, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', flexShrink: 0 }}>
												{item.sub}
											</span>
										)}
									</button>
								))}

								{/* Clear recents (only shown in recent mode) */}
								{!inputVal.trim() && recentSearches.length > 0 && (
									<button
										onMouseDown={e => {
											e.preventDefault()
											localStorage.removeItem(RECENT_KEY)
											setRecentSearches([])
											setShowDropdown(false)
										}}
										style={{ width: '100%', padding: '8px 14px', border: 'none', borderTop: '1px solid var(--bf-line)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--bf-mute)', textAlign: 'center', fontFamily: 'var(--bf-font)' }}
									>
										Clear recent searches
									</button>
								)}
							</div>
						)}
					</div>

					{/* ── Search results ── */}
					{isSearchMode ? (
						<>
							{searchError ? (
								<div style={{ padding: '80px 0', textAlign: 'center' }}>
									<div style={{ fontSize: 48, marginBottom: 14 }}>⚠️</div>
									<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>
										Search failed
									</div>
									<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8, maxWidth: 340, margin: '8px auto 0' }}>
										Something went wrong. Please check your connection and try again.
									</div>
									<button onClick={() => commitSearch(searchQ)} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 20 }}>
										Retry
									</button>
								</div>
							) : searchLoading ? (
								view === 'list' ? (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
										{Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={118} />)}
									</div>
								) : (
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
										{Array.from({ length: 12 }).map((_, i) => <Skel key={i} h={220} />)}
									</div>
								)
							) : !searchData || searchData.content.length === 0 ? (
								<div style={{ padding: '80px 0', textAlign: 'center' }}>
									<div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
									<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>
										No results for &ldquo;{searchQ}&rdquo;
									</div>
									<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8, maxWidth: 340, margin: '8px auto 0' }}>
										Try a different spelling or browse a category.
									</div>
									<button onClick={clearSearch} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 20 }}>
										Browse categories
									</button>
								</div>
							) : (
								<>
									{/* Category breakdown chips — only shown when all results fit on one page */}
									{activeCategories.length > 0 && searchData.totalPages === 1 && (
										<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
											<span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', letterSpacing: '0.08em' }}>FOUND IN</span>
											{activeCategories.map(c => {
												const count = searchData.content.filter(p => p.categoryId === c.id).length
												if (count === 0) return null
												return (
													<span key={c.id} style={{ fontSize: 12, fontWeight: 700, color: 'var(--bf-ink-2)', background: 'var(--bf-paper)', border: '1.5px solid var(--bf-line-2)', borderRadius: 999, padding: '3px 10px' }}>
														{c.name} · {count}
													</span>
												)
											})}
										</div>
									)}

									{view === 'list' ? (
										<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
											{searchData.content.map((it, i) => <FoodCard key={it.id} item={it} variant='list' tone={TONES[i % 3]} />)}
										</div>
									) : (
										<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
											{searchData.content.map((it, i) => <FoodCard key={it.id} item={it} variant='grid' tone={TONES[i % 3]} />)}
										</div>
									)}

									<Pagination
										page={searchData.page}
										totalPages={searchData.totalPages}
										onPage={p => { setSearchPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
									/>

									{searchData.totalPages > 1 && (
										<div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', letterSpacing: '0.06em' }}>
											PAGE {searchData.page + 1} OF {searchData.totalPages} · {searchData.totalElements} ITEMS
										</div>
									)}
								</>
							)}
						</>
					) : (
						/* ── Category browse ── */
						isLoading ? (
							view === 'list' ? (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
									{Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={118} />)}
								</div>
							) : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
									{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={220} />)}
								</div>
							)
						) : activeCategories.length === 0 ? (
							<div style={{ padding: '80px 0', textAlign: 'center' }}>
								<div style={{ fontSize: 48, marginBottom: 14 }}>🍕</div>
								<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Menu coming soon</div>
								<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8, maxWidth: 320, margin: '8px auto 0' }}>
									We&apos;re still setting up. Check back shortly!
								</div>
							</div>
						) : categoryVisible.length === 0 ? (
							<div style={{ padding: '64px 0', textAlign: 'center' }}>
								<div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
								<div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>Nothing here yet</div>
								<div style={{ color: 'var(--bf-ink-2)', fontSize: 13, marginTop: 6 }}>
									We&apos;re adding items here soon. Try another category!
								</div>
								<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16, display: 'inline-flex' }}>Browse all</Link>
							</div>
						) : view === 'list' ? (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
								{categoryVisible.map((it, i) => <FoodCard key={it.id} item={it} variant='list' tone={TONES[i % 3]} />)}
							</div>
						) : (
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
								{categoryVisible.map((it, i) => <FoodCard key={it.id} item={it} variant='grid' tone={TONES[i % 3]} />)}
							</div>
						)
					)}
				</div>
			</main>

			<style>{`@keyframes bf-spin { to { transform: rotate(360deg); } }`}</style>
		</CustomerShell>
	)
}

export { MenuExperience }
