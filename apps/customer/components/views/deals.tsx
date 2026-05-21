'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerShell } from '../layout/customer-shell'
import { DealCard } from '../home/home-primitives'
import { SearchField } from '../search/search-field'
import { useDealsSearchField } from '../search/use-deals-search-field'
import { useDeals } from '../../lib/hooks'
import { type Tone } from '../ui/food-img'

const TONES: Tone[] = ['ember', 'amber', 'cream']

function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

function DealsExperience() {
	const router = useRouter()
	const { data: deals, isLoading } = useDeals()
	const [activeTag, setActiveTag] = useState<string | null>(null)

	const activeDeals = useMemo(() => deals?.filter(d => d.isActive) ?? [], [deals])

	const search = useDealsSearchField(activeDeals, {
		onCommit: (q) => {
			setActiveTag(null)
			router.replace(`/deals?q=${encodeURIComponent(q)}`, { scroll: false })
		},
		onClear: () => router.replace('/deals', { scroll: false }),
	})

	const { isSearchMode, searchQ } = search

	useEffect(() => {
		const q = new URLSearchParams(window.location.search).get('q')
		search.syncFromUrl(q)
	}, [])

	const tags = useMemo(() => {
		const seen = new Set<string>()
		activeDeals.forEach(d => { if (d.tag) seen.add(d.tag) })
		return Array.from(seen)
	}, [activeDeals])

	useEffect(() => {
		if (activeTag && !tags.includes(activeTag)) setActiveTag(null)
	}, [tags, activeTag])

	const visible = useMemo(() => {
		if (isSearchMode) return search.visibleDeals
		let list = activeDeals
		if (activeTag) list = list.filter((d) => d.tag === activeTag)
		return list
	}, [isSearchMode, search.visibleDeals, activeDeals, activeTag])

	return (
		<CustomerShell activePage='deals'>
			<main>
				{/* ── Tag filter strip — hidden in search mode (matches menu category strip behavior) ── */}
				{!isSearchMode && (
					<div className='bf-menu-cat-strip'>
						<div className='bf-menu-cat-strip-inner bf-scroll' style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
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

				<div className='bf-page-main'>
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

					<SearchField
						inputRef={search.inputRef}
						searchWrapRef={search.searchWrapRef}
						inputVal={search.inputVal}
						onInputChange={(v) => { search.setInputVal(v); search.setActiveIdx(-1) }}
						onFocus={() => {}}
						onKeyDown={search.handleKeyDown}
						onClear={search.clearSearch}
						placeholder='Search deals…'
						isActive={isSearchMode}
						showDropdown={search.showDropdown}
						setShowDropdown={search.setShowDropdown}
						dropdownItems={search.dropdownItems}
						sectionLabel={search.sectionLabel}
						suggestLoading={search.suggestLoading}
						emptyMessage={search.emptyMessage}
						activeIdx={search.activeIdx}
						onSelect={search.commitSearch}
						onHover={search.setActiveIdx}
						onClearRecents={search.clearRecent}
						showClearRecents={!search.inputVal.trim() && search.recentSearches.length > 0}
					/>

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
								<button onClick={search.clearSearch} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16 }}>
									Clear search
								</button>
							) : (
								<button onClick={() => setActiveTag(null)} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16 }}>
									Browse all
								</button>
							)}
						</div>
					) : (
						<div className='bf-deals-grid-page'>
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
