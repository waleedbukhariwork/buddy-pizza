'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react'
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

function useReveal() {
	const ref = useRef<HTMLElement>(null)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.classList.add('bf-in')
					io.disconnect()
				}
			},
			{ threshold: 0.08 },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [])
	return ref
}

function useCountUpValue(target: number, active: boolean, duration = 1400): number {
	const [value, setValue] = useState(0)
	useEffect(() => {
		if (!active) return
		setValue(0)
		const start = performance.now()
		let raf: number
		const tick = (now: number) => {
			const t = Math.min((now - start) / duration, 1)
			const eased = 1 - Math.pow(1 - t, 4)
			setValue(Math.round(eased * target))
			if (t < 1) raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [active, target, duration])
	return value
}

function GridReveal({ children }: { children: React.ReactNode }) {
	const ref = useReveal()
	return <div ref={ref as React.RefObject<HTMLDivElement>} className='bf-reveal'>{children}</div>
}

function DealsExperience() {
	const router = useRouter()
	const { data: deals, isLoading } = useDeals()
	const [activeTag, setActiveTag] = useState<string | null>(null)
	const [mounted, setMounted] = useState(false)
	const [statsInView, setStatsInView] = useState(false)
	const statsRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 80)
		return () => clearTimeout(t)
	}, [])

	useEffect(() => {
		const el = statsRef.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setStatsInView(true)
					io.disconnect()
				}
			},
			{ threshold: 0.2 },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [])

	const activeDeals = useMemo(() => deals?.filter(d => d.isActive) ?? [], [deals])

	const search = useDealsSearchField(activeDeals, {
		onCommit: (q) => {
			setActiveTag(null)
			router.replace(`/deals?q=${encodeURIComponent(q)}`, { scroll: false })
		},
		onClear: () => router.replace('/deals', { scroll: false }),
	})

	const { isSearchMode, searchQ } = search
	const countedDeals = useCountUpValue(activeDeals.length, statsInView && !isSearchMode)

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
<div className='bf-page-main'>
					{/* ── Header ── */}
					<div ref={statsRef as React.RefObject<HTMLDivElement>} style={{ marginBottom: 18 }}>
						{isLoading ? (
							<>
								<Skel h={12} style={{ width: 120, marginBottom: 8 }} />
								<Skel h={44} style={{ width: 200 }} />
							</>
						) : (
							<>
								<div className={`bf-eyebrow${mounted ? ' bf-rw' : ''}`} style={{ '--d': '0s' } as React.CSSProperties}>
									{isSearchMode
										? `${visible.length} RESULT${visible.length !== 1 ? 'S' : ''}`
										: `${activeTag ? `${activeTag.toUpperCase()} · ` : ''}${countedDeals} DEAL${(isSearchMode ? visible.length : countedDeals) !== 1 ? 'S' : ''}`}
								</div>
								<h1 className={`${mounted ? ' bf-rw' : ''}`} style={{ fontWeight: 800, fontSize: 'clamp(28px, 8vw, 44px)', margin: '6px 0 0', letterSpacing: '-0.028em', '--d': '0.14s' } as React.CSSProperties}>
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
						<div className='bf-deals-grid-page' style={{ gap: 16 }}>
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
						<GridReveal>
							<div className='bf-deals-grid-page'>
								{visible.map((deal, i) => (
									<DealCard key={deal.id} d={deal} tone={TONES[i % TONES.length]} />
								))}
							</div>
						</GridReveal>
					)}
				</div>
			</main>
		</CustomerShell>
	)
}

export { DealsExperience }
