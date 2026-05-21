'use client'
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerShell } from '../layout/customer-shell'
import { DealCard } from '../home/home-primitives'
import { Icons } from '../ui/icon'
import { useDeals } from '../../lib/hooks'
import { type Tone } from '../ui/food-img'

const TONES: Tone[] = ['ember', 'amber', 'cream']
const RECENT_KEY = 'bf_recent_deal_searches'
const MAX_RECENT = 5

function loadRecent(): string[] {
	try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(q: string) {
	const list = [q, ...loadRecent().filter(r => r !== q)].slice(0, MAX_RECENT)
	localStorage.setItem(RECENT_KEY, JSON.stringify(list))
}

function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

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

function DealsExperience() {
	const router = useRouter()
	const { data: deals, isLoading } = useDeals()
	const [activeTag, setActiveTag] = useState<string | null>(null)

	// Two-layer search state — same pattern as menu
	const [inputVal, setInputVal] = useState('')
	const [searchQ, setSearchQ] = useState('')       // committed → filters results
	const [showDropdown, setShowDropdown] = useState(false)
	const [activeIdx, setActiveIdx] = useState(-1)   // keyboard navigation
	const [recentSearches, setRecentSearches] = useState<string[]>([])

	const searchWrapRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const activeDeals = useMemo(() => deals?.filter(d => d.isActive) ?? [], [deals])
	const isSearchMode = searchQ.trim().length > 0

	const tags = useMemo(() => {
		const seen = new Set<string>()
		activeDeals.forEach(d => { if (d.tag) seen.add(d.tag) })
		return Array.from(seen)
	}, [activeDeals])

	// Load recent searches from localStorage on mount
	useEffect(() => { setRecentSearches(loadRecent()) }, [])

	// Read ?q= from URL on mount
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const q = params.get('q')
		if (q) { setInputVal(q); setSearchQ(q) }
	}, [])

	// Deactivate a tag if it disappears from the data
	useEffect(() => {
		if (activeTag && !tags.includes(activeTag)) setActiveTag(null)
	}, [tags, activeTag])

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

	// Live suggestions — client-side from already-loaded deals (max 6)
	const suggestions = useMemo(() => {
		const q = inputVal.trim().toLowerCase()
		if (!q) return []
		return activeDeals
			.filter(d =>
				d.title.toLowerCase().includes(q) ||
				(d.description ?? '').toLowerCase().includes(q) ||
				(d.items ?? '').toLowerCase().includes(q),
			)
			.slice(0, 6)
	}, [inputVal, activeDeals])

	// Dropdown items: recents (when empty input) or live suggestions
	const dropdownItems: { type: 'recent' | 'suggestion'; label: string; sub?: string }[] =
		inputVal.trim()
			? suggestions.map(d => ({ type: 'suggestion' as const, label: d.title, sub: d.tag ?? undefined }))
			: recentSearches.map(r => ({ type: 'recent' as const, label: r }))

	const commitSearch = useCallback((val: string) => {
		const q = val.trim()
		if (!q) return
		saveRecent(q)
		setRecentSearches(loadRecent())
		setInputVal(q)
		setSearchQ(q)
		setShowDropdown(false)
		setActiveIdx(-1)
		setActiveTag(null)   // clear tag filter when entering search mode
		router.replace(`/deals?q=${encodeURIComponent(q)}`, { scroll: false })
	}, [router])

	const clearSearch = useCallback(() => {
		setInputVal('')
		setSearchQ('')
		setShowDropdown(false)
		setActiveIdx(-1)
		inputRef.current?.focus()
		router.replace('/deals', { scroll: false })
	}, [router])

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

	// Visible deals — tag filter is cleared in search mode
	const visible = useMemo(() => {
		let list = activeDeals
		if (activeTag && !isSearchMode) list = list.filter(d => d.tag === activeTag)
		if (searchQ.trim()) {
			const q = searchQ.toLowerCase()
			list = list.filter(d =>
				d.title.toLowerCase().includes(q) ||
				(d.description ?? '').toLowerCase().includes(q) ||
				(d.items ?? '').toLowerCase().includes(q),
			)
		}
		return list
	}, [activeDeals, activeTag, searchQ, isSearchMode])

	return (
		<CustomerShell activePage='deals'>
			<main>
				{/* ── Tag filter strip — hidden in search mode (matches menu category strip behavior) ── */}
				{!isSearchMode && (
					<div style={{ padding: '20px 56px 0', borderBottom: '1px solid var(--bf-line)', background: 'var(--bf-cream)', position: 'sticky', top: 69, zIndex: 10 }}>
						<div style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: 1280, margin: '0 auto' }} className='bf-scroll'>
							{isLoading
								? Array.from({ length: 4 }).map((_, i) => (
									<Skel key={i} h={44} style={{ width: 100, borderRadius: 0, flexShrink: 0 }} />
								))
								: (
									<>
										<button
											className='bf-btn bf-btn-md'
											onClick={() => setActiveTag(null)}
											style={{
												background: activeTag === null ? 'var(--bf-ink)' : 'transparent',
												color: activeTag === null ? '#fff' : 'var(--bf-ink-2)',
												padding: '12px 18px', borderRadius: 0, flexShrink: 0,
												borderBottom: activeTag === null ? '3px solid var(--bf-ember)' : '3px solid transparent',
												fontWeight: 700,
											}}
										>
											All{' '}
											<span className='bf-mono' style={{ opacity: 0.6, fontSize: 11 }}>{activeDeals.length}</span>
										</button>
										{tags.map(tag => {
											const count = activeDeals.filter(d => d.tag === tag).length
											return (
												<button
													key={tag}
													className='bf-btn bf-btn-md'
													onClick={() => setActiveTag(tag)}
													style={{
														background: activeTag === tag ? 'var(--bf-ink)' : 'transparent',
														color: activeTag === tag ? '#fff' : 'var(--bf-ink-2)',
														padding: '12px 18px', borderRadius: 0, flexShrink: 0,
														borderBottom: activeTag === tag ? '3px solid var(--bf-ember)' : '3px solid transparent',
														fontWeight: 700,
													}}
												>
													{tag}{' '}
													<span className='bf-mono' style={{ opacity: 0.6, fontSize: 11 }}>{count}</span>
												</button>
											)
										})}
									</>
								)
							}
						</div>
					</div>
				)}

				<div style={{ padding: '24px 56px 56px', maxWidth: 1280, margin: '0 auto' }}>
					{/* ── Header ── */}
					<div style={{ marginBottom: 18 }}>
						{isLoading ? (
							<>
								<Skel h={12} style={{ width: 120, marginBottom: 8 }} />
								<Skel h={44} style={{ width: 200 }} />
							</>
						) : (
							<>
								<div className='bf-eyebrow'>
									{isSearchMode
										? `${visible.length} RESULT${visible.length !== 1 ? 'S' : ''}`
										: `${activeTag ? `${activeTag.toUpperCase()} · ` : ''}${visible.length} DEAL${visible.length !== 1 ? 'S' : ''}`}
								</div>
								<h1 style={{ fontWeight: 800, fontSize: 44, margin: '6px 0 0', letterSpacing: '-0.028em' }}>
									{isSearchMode ? <>&ldquo;{searchQ}&rdquo;</> : (activeTag ?? 'All Deals')}
								</h1>
							</>
						)}
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
								placeholder='Search deals…'
								autoComplete='off'
								spellCheck={false}
							/>

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

					{/* ── Deals grid ── */}
					{isLoading ? (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
							{Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={340} />)}
						</div>
					) : activeDeals.length === 0 ? (
						<div style={{ padding: '80px 0', textAlign: 'center' }}>
							<div style={{ fontSize: 48, marginBottom: 14 }}>🎉</div>
							<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Deals coming soon</div>
							<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8, maxWidth: 320, margin: '8px auto 0' }}>
								We&apos;re cooking something special. Check back soon!
							</div>
						</div>
					) : visible.length === 0 ? (
						<div style={{ padding: '64px 0', textAlign: 'center' }}>
							<div style={{ fontSize: 40, marginBottom: 12 }}>
								{isSearchMode ? '🔍' : '🏷️'}
							</div>
							<div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
								{isSearchMode ? `No results for "${searchQ}"` : 'Nothing here yet'}
							</div>
							<div style={{ color: 'var(--bf-ink-2)', fontSize: 13, marginTop: 6 }}>
								{isSearchMode
									? 'Try a different search or browse all deals.'
									: 'No deals in this category yet.'}
							</div>
							{isSearchMode ? (
								<button onClick={clearSearch} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16 }}>
									Clear search
								</button>
							) : (
								<button onClick={() => setActiveTag(null)} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16 }}>
									Browse all
								</button>
							)}
						</div>
					) : (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
							{visible.map((deal, i) => (
								<DealCard key={deal.id} d={deal} tone={TONES[i % TONES.length]} />
							))}
						</div>
					)}
				</div>
			</main>
		</CustomerShell>
	)
}

export { DealsExperience }
