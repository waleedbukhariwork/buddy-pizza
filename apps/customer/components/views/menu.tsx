'use client'
import React from 'react'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { CustomerShell } from '../layout/customer-shell'
import { FoodCard } from '../menu/food-card'
import { Icons } from '../ui/icon'
import { CatIcon } from '../ui/cat-icon'
import { useProducts, useCategories } from '../../lib/hooks'
import { type Tone } from '../ui/food-img'
import { useRouter } from 'next/navigation'
import { SearchField } from '../search/search-field'
import { useProductSearchField } from '../search/use-product-search-field'

const TONES: Tone[] = ['ember', 'amber', 'cream']

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
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
	const [view, setView] = useState<'list' | 'grid'>('grid')

	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)

	const router = useRouter()
	const search = useProductSearchField({
		onCommit: (q) => router.replace(`/menu?q=${encodeURIComponent(q)}`, { scroll: false }),
		onClear: () => router.replace('/menu', { scroll: false }),
	})

	const catStripRef = useRef<HTMLDivElement>(null)
	const tabsScrollRef = useRef<HTMLDivElement>(null)
	const scrollingToRef = useRef<number | null>(null)

	const { data: products, isLoading: productsLoading } = useProducts()
	const { data: categories, isLoading: catsLoading } = useCategories()
	const activeCategories = useMemo(() => categories?.filter(c => c.isActive) ?? [], [categories])

	const {
		isSearchMode,
		searchQ,
		searchData,
		searchLoading,
		searchError,
	} = search

	useEffect(() => {
		const q = new URLSearchParams(window.location.search).get('q')
		search.syncFromUrl(q)
	}, [])

	useEffect(() => {
		if (isSearchMode || activeCategories.length === 0) return
		const hash = window.location.hash
		const params = new URLSearchParams(window.location.search)
		const catParam = hash.match(/^#cat-(\d+)$/)?.[1] ?? params.get('category')
		if (!catParam) return
		const id = Number(catParam)
		if (!Number.isFinite(id)) return
		scrollingToRef.current = id
		setActiveId(id)
		const t = setTimeout(() => {
			document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			setTimeout(() => { scrollingToRef.current = null }, 600)
		}, 350)
		return () => clearTimeout(t)
	}, [isSearchMode, activeCategories.length, products])

	useEffect(() => {
		if (typeof window !== 'undefined' && window.innerWidth < 768) setView('list')
	}, [])

	// No hide-on-scroll needed — the header is fixed and the category strip
	// is sticky below it via CSS (top: 69px / 57px).

	// Scroll active category tab into view (horizontal only — avoid scrollIntoView which also scrolls the page)
	useEffect(() => {
		const container = tabsScrollRef.current
		if (!container) return
		const activeBtn = container.querySelector('[data-active="true"]') as HTMLElement | null
		if (!activeBtn) return
		const targetLeft = activeBtn.offsetLeft - (container.clientWidth - activeBtn.offsetWidth) / 2
		container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
	}, [activeId])

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

	const categorySections = useMemo(() => {
		if (!products) return []
		return activeCategories.map((cat) => ({
			category: cat,
			items: products.filter((p) => p.categoryId === cat.id && p.isAvailable),
		})).filter((s) => s.items.length > 0)
	}, [products, activeCategories])

	const scrollToCategory = useCallback((id: number | null) => {
		if (id === null) {
			window.scrollTo({ top: 0, behavior: 'smooth' })
			setActiveId(null)
			window.history.replaceState(null, '', '/menu')
			return
		}
		scrollingToRef.current = id
		setActiveId(id)
		document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		window.history.replaceState(null, '', `/menu#cat-${id}`)
		setTimeout(() => { scrollingToRef.current = null }, 700)
	}, [])

	const totalMenuItems = categorySections.reduce((n, s) => n + s.items.length, 0)
	const isLoading = catsLoading || productsLoading

	useEffect(() => {
		if (isSearchMode || categorySections.length === 0) return
		const sections = categorySections
			.map((s) => document.getElementById(`cat-${s.category.id}`))
			.filter(Boolean) as HTMLElement[]
		if (sections.length === 0) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (scrollingToRef.current != null) return
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
				if (visible[0]?.target.id) {
					const id = Number(visible[0].target.id.replace('cat-', ''))
					if (Number.isFinite(id)) setActiveId(id)
				}
			},
			{ rootMargin: '-120px 0px -55% 0px', threshold: [0.08, 0.2, 0.4] },
		)
		sections.forEach((el) => observer.observe(el))
		return () => observer.disconnect()
	}, [isSearchMode, categorySections])

	return (
		<CustomerShell activePage='menu'>
			<main>
				{/* Category strip — hidden while in search mode */}
				{!isSearchMode && (
					<div ref={catStripRef} className='bf-menu-cat-strip'>
						<div className='bf-menu-cat-strip-inner'>

							{/* Left fade + scroll arrow */}
							{canScrollLeft && (
								<>
									<div style={{ position: 'absolute', left: 'var(--bf-page-pad)', top: 10, bottom: 0, width: 72, background: 'linear-gradient(to right, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button className='bf-cat-scroll-btn' onClick={() => scrollCats('left')} style={{ position: 'absolute', left: 'calc(var(--bf-page-pad) + 4px)', top: '50%', transform: 'translateY(-65%)', zIndex: 2 }}>
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
									: (
										<>
											<button
												type='button'
												data-active={activeId === null ? 'true' : undefined}
												className='bf-cat-menu-pill'
												onClick={() => scrollToCategory(null)}
											>
												<span>All</span>
												<span className='bf-cat-menu-pill-count'>{totalMenuItems}</span>
											</button>
											{activeCategories.map((c) => {
												const count = products?.filter((p) => p.categoryId === c.id && p.isAvailable).length ?? 0
												const isActive = c.id === activeId
												return (
													<button
														key={c.id}
														type='button'
														data-active={isActive ? 'true' : undefined}
														className='bf-cat-menu-pill'
														onClick={() => scrollToCategory(c.id)}
													>
														<CatIcon name={c.name} size={18} />
														<span>{c.name}</span>
														{count > 0 && <span className='bf-cat-menu-pill-count'>{count}</span>}
													</button>
												)
											})}
										</>
									)
								}
							</div>

							{/* Right fade + scroll arrow */}
							{canScrollRight && (
								<>
									<div style={{ position: 'absolute', right: 'var(--bf-page-pad)', top: 10, bottom: 0, width: 72, background: 'linear-gradient(to left, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button className='bf-cat-scroll-btn' onClick={() => scrollCats('right')} style={{ position: 'absolute', right: 'calc(var(--bf-page-pad) + 4px)', top: '50%', transform: 'translateY(-65%)', zIndex: 2 }}>
										<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M9 18l6-6-6-6' /></svg>
									</button>
								</>
							)}
						</div>
					</div>
				)}

				<div className='bf-page-main'>
					<div className='bf-menu-page-head'>
						<div>
							{isSearchMode ? (
								<>
									<div className='bf-eyebrow'>
										{searchLoading ? 'SEARCHING…' : `${searchData?.totalElements ?? 0} RESULTS`}
									</div>
									<h1 className='bf-menu-page-title'>&ldquo;{searchQ}&rdquo;</h1>
								</>
							) : isLoading ? (
								<>
									<Skel h={12} style={{ width: 120, marginBottom: 8 }} />
									<Skel h={44} style={{ width: 200 }} />
								</>
							) : (
								<>
									<div className='bf-eyebrow'>FULL MENU · {totalMenuItems} ITEMS</div>
									<h1 className='bf-menu-page-title'>Order your feast</h1>
								</>
							)}
						</div>
						<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
							<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={() => setView('grid')} style={{ width: 32, height: 32, background: view === 'grid' ? 'var(--bf-ink)' : undefined, color: view === 'grid' ? '#fff' : undefined }}>{Icons.grid}</button>
							<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={() => setView('list')} style={{ width: 32, height: 32, background: view === 'list' ? 'var(--bf-ink)' : undefined, color: view === 'list' ? '#fff' : undefined }}>{Icons.list}</button>
						</div>
					</div>

					<SearchField
						inputRef={search.inputRef}
						searchWrapRef={search.searchWrapRef}
						inputVal={search.inputVal}
						onInputChange={(v) => { search.setInputVal(v); search.setActiveIdx(-1) }}
						onFocus={() => {}}
						onKeyDown={search.handleKeyDown}
						onClear={search.clearSearch}
						placeholder={`Search ${activeCategories.find((c) => c.id === activeId)?.name ?? 'all items'}…`}
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
						committedLoading={isSearchMode && searchLoading}
					/>

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
									<button onClick={() => search.commitSearch(searchQ)} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 20 }}>
										Retry
									</button>
								</div>
							) : searchLoading ? (
								view === 'list' ? (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
										{Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={118} />)}
									</div>
								) : (
									<div className='bf-menu-products-grid'>
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
									<button onClick={search.clearSearch} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 20 }}>
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
										<div className='bf-menu-products-grid'>
											{searchData.content.map((it, i) => <FoodCard key={it.id} item={it} variant='grid' tone={TONES[i % 3]} />)}
										</div>
									)}

									<Pagination
										page={searchData.page}
										totalPages={searchData.totalPages}
										onPage={p => { search.setSearchPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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
						isLoading ? (
							view === 'list' ? (
								<div className='bf-menu-products-list'>
									{Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={118} />)}
								</div>
							) : (
								<div className='bf-menu-products-grid'>
									{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={220} />)}
								</div>
							)
						) : categorySections.length === 0 ? (
							<div style={{ padding: '80px 0', textAlign: 'center' }}>
								<div style={{ fontSize: 48, marginBottom: 14 }}>🍕</div>
								<div style={{ fontWeight: 800, fontSize: 22 }}>Menu coming soon</div>
								<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8 }}>We&apos;re still setting up. Check back shortly!</div>
							</div>
						) : (
							categorySections.map((section, si) => (
								<section
									key={section.category.id}
									id={`cat-${section.category.id}`}
									className='bf-menu-section'
								>
									<h2 className='bf-menu-section-title'>
										<CatIcon name={section.category.name} size={22} />
										{section.category.name}
										<span className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', fontWeight: 600 }}>
											{section.items.length}
										</span>
									</h2>
									{view === 'list' ? (
										<div className='bf-menu-products-list'>
											{section.items.map((it, i) => (
												<FoodCard key={it.id} item={it} variant='list' tone={TONES[(si + i) % 3]} />
											))}
										</div>
									) : (
										<div className='bf-menu-products-grid'>
											{section.items.map((it, i) => (
												<FoodCard key={it.id} item={it} variant='grid' tone={TONES[(si + i) % 3]} />
											))}
										</div>
									)}
								</section>
							))
						)
					)}
				</div>
			</main>

			<style>{`@keyframes bf-spin { to { transform: rotate(360deg); } }`}</style>
		</CustomerShell>
	)
}

export { MenuExperience }
