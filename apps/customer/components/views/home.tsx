'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { CustomerShell } from '../layout/customer-shell'
import { useSearch } from '../../lib/search-context'
import { FoodCard } from '../menu/food-card'
import { CatIcon } from '../ui/cat-icon'
import { DealCard, SectionRow, TrustStat } from '../home/home-primitives'
import { ReorderCard } from '../home/reorder-card'
import { type Tone } from '../ui/food-img'
import { Icons } from '../ui/icon'
import { useProducts, useCategories, useDeals } from '../../lib/hooks'
import { useDeliveryStore, formatEta } from '../../lib/delivery-store'

const TONES: Tone[] = ['ember', 'amber', 'ember', 'amber', 'ember', 'amber', 'ember', 'amber']
const DEAL_TONES: Tone[] = ['ember', 'amber', 'ink']

type TimeSlot = 'morning' | 'lunch' | 'dinner' | 'night' | null

const TIME_CONFIG: Record<NonNullable<TimeSlot>, { msg: string; bg: string; color: string }> = {
	morning: { msg: '🌅 Good morning — breakfast specials are live', bg: 'var(--bf-amber-08)', color: 'var(--bf-ink)' },
	lunch: { msg: '⏰ Lunch hour · Order now, eat before 2 PM', bg: 'var(--bf-ember-08)', color: 'var(--bf-ink)' },
	dinner: { msg: '🌙 Dinner time — family deals available', bg: 'var(--bf-amber-08)', color: 'var(--bf-ink)' },
	night: { msg: "🔥 Late night? We're still cooking", bg: 'var(--bf-ink)', color: '#fff' },
}

function TimeBar() {
	const [slot, setSlot] = useState<TimeSlot>(null)
	useEffect(() => {
		const h = new Date().getHours()
		if (h >= 6 && h < 11) setSlot('morning')
		else if (h >= 11 && h < 15) setSlot('lunch')
		else if (h >= 17 && h < 21) setSlot('dinner')
		else setSlot('night')
	}, [])
	if (!slot) return null
	const { msg, bg, color } = TIME_CONFIG[slot]
	return (
		<div className='bf-time-bar' style={{ background: bg, color }}>
			<span>{msg}</span>
		</div>
	)
}

function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

function HomeExperience() {
	const { openSearch } = useSearch()
	const { area, etaMinutes, hydrate } = useDeliveryStore()
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)
	const catScrollRef = useRef<HTMLDivElement>(null)

	const { data: products, isLoading: productsLoading } = useProducts()
	const { data: categories, isLoading: catsLoading } = useCategories()
	const { data: deals, isLoading: dealsLoading } = useDeals()

	useEffect(() => { hydrate() }, [hydrate])

	const updateScrollArrows = useCallback(() => {
		const el = catScrollRef.current
		if (!el) return
		setCanScrollLeft(el.scrollLeft > 8)
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
	}, [])

	const scrollCats = useCallback((dir: 'left' | 'right') => {
		catScrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
	}, [])

	useEffect(() => {
		const el = catScrollRef.current
		if (!el) return
		updateScrollArrows()
		el.addEventListener('scroll', updateScrollArrows, { passive: true })
		const ro = new ResizeObserver(updateScrollArrows)
		ro.observe(el)
		return () => { el.removeEventListener('scroll', updateScrollArrows); ro.disconnect() }
	}, [updateScrollArrows, categories])

	const activeCategories = categories?.filter((c) => c.isActive) ?? []
	const activeDeals = deals?.filter((d) => d.isActive).slice(0, 3) ?? []
	const featuredProducts = products?.filter((p) => p.isAvailable).slice(0, 8) ?? []
	const [arrivalTime, setArrivalTime] = useState<string | null>(null)
	useEffect(() => { setArrivalTime(formatEta(etaMinutes)) }, [etaMinutes])

	return (
		<CustomerShell activePage='home'>
			<TimeBar />
			<main>
				<section className='bf-hero'>
					<div className='bf-hero-grid'>
						<div className='bf-hero-content'>
							<span className='bf-pill bf-pill-amber' style={{ marginBottom: 14, alignSelf: 'flex-start' }}>
								<svg width='8' height='8' viewBox='0 0 8 8' className='bf-pulse'><circle cx='4' cy='4' r='3.5' fill='currentColor' /></svg>
								OPEN · DELIVERING NOW
							</span>
							<h1 className='bf-display bf-hero-title'>
								Hot pizza.
								<br />
								<span className='bf-hero-title-accent'>At your door.</span>
							</h1>
							<p className='bf-hero-sub'>
								Pizza, burgers, shawarma, wings and more — straight from our kitchen. No middleman. No cold food.
							</p>
							<div className='bf-hero-delivery-line'>
								<span>Delivering to <strong>{area}</strong></span>
								<span>·</span>
								{arrivalTime && <span className='bf-mono'>~{arrivalTime}</span>}
								<span>·</span>
								<span>Free above Rs 500</span>
							</div>

							<div className='bf-hero-search' role='button' tabIndex={0} onClick={openSearch} onKeyDown={(e) => { if (e.key === 'Enter') openSearch() }}>
								<span style={{ color: 'var(--bf-mute)', display: 'flex' }}>{Icons.search}</span>
								<input readOnly placeholder='Search pizza, burgers, deals…' aria-label='Search menu' />
								<span className='bf-btn bf-btn-primary bf-btn-md' style={{ pointerEvents: 'none' }}>Search</span>
							</div>

							<div className='bf-hero-ctas'>
								<Link className='bf-btn bf-btn-primary bf-btn-lg' href='/menu'>Order now {Icons.arrow}</Link>
								<Link className='bf-btn bf-btn-outline bf-btn-lg' href='/deals'>See deals</Link>
							</div>
							<div className='bf-hero-trust'>
								<TrustStat k={`${etaMinutes} min`} v='Average delivery' />
								<TrustStat k='4.9★' v='Customer rated' />
								<TrustStat k='Rs. 0' v='Free delivery' />
							</div>
						</div>

						<div className='bf-hero-visual'>
							<div className='bf-img bf-img-ember bf-float bf-hero-img-frame'>
								<span className='bf-img-cap'>hero · pepperoni pie, top-down</span>
							</div>
							{activeDeals[0] && (
								<div className='bf-hero-deal-float'>
									<div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bf-ember)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 11, fontFamily: 'var(--bf-mono)', flexShrink: 0 }}>
										{activeDeals[0].badge ?? 'DEAL'}
									</div>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div className='bf-eyebrow' style={{ fontSize: 10 }}>FEATURED DEAL</div>
										<div style={{ fontWeight: 800, fontSize: 16 }}>{activeDeals[0].title}</div>
									</div>
									<Link href='/deals' className='bf-btn bf-btn-ink bf-btn-sm' style={{ flexShrink: 0 }}>View</Link>
								</div>
							)}
						</div>
					</div>
				</section>

				<ReorderCard />

				<section className='bf-page-section'>
					<SectionRow title='Browse the menu' link='/menu' />
					{catsLoading ? (
						<div style={{ display: 'flex', gap: 10 }}>
							{Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={88} style={{ width: 100, flexShrink: 0, borderRadius: 16 }} />)}
						</div>
					) : (
						<div style={{ position: 'relative' }}>
							{canScrollLeft && (
								<>
									<div style={{ position: 'absolute', left: 0, top: 0, bottom: 4, width: 72, background: 'linear-gradient(to right, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button type='button' className='bf-cat-scroll-btn' onClick={() => scrollCats('left')} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-60%)', zIndex: 2 }} aria-label='Scroll categories left'>
										<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5}><path d='M15 18l-6-6 6-6' /></svg>
									</button>
								</>
							)}
							<div ref={catScrollRef} className='bf-cat-strip'>
								{activeCategories.map((c) => (
									<Link key={c.id} href={`/menu#cat-${c.id}`} className='bf-cat-pill'>
										<CatIcon name={c.name} size={26} />
										<span className='bf-cat-pill-label'>{c.name}</span>
										<span className='bf-mono' style={{ fontSize: 9.5, color: 'var(--bf-mute)' }}>
											{products?.filter((p) => p.categoryId === c.id && p.isAvailable).length ?? '—'}
										</span>
									</Link>
								))}
							</div>
							{canScrollRight && (
								<>
									<div style={{ position: 'absolute', right: 0, top: 0, bottom: 4, width: 72, background: 'linear-gradient(to left, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button type='button' className='bf-cat-scroll-btn' onClick={() => scrollCats('right')} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-60%)', zIndex: 2 }} aria-label='Scroll categories right'>
										<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5}><path d='M9 18l6-6-6-6' /></svg>
									</button>
								</>
							)}
						</div>
					)}
				</section>

				{(dealsLoading || activeDeals.length > 0) && (
					<section id='deals' className='bf-page-section'>
						<SectionRow title="Today's deals" link='/deals' eyebrow='LIMITED' />
						<div className='bf-deals-grid-home'>
							{dealsLoading
								? Array.from({ length: 3 }).map((_, i) => <Skel key={i} h={240} />)
								: activeDeals.map((d, i) => <DealCard key={d.id} d={d} tone={DEAL_TONES[i % 3]} />)}
						</div>
					</section>
				)}

				<section className='bf-page-section' style={{ paddingBottom: 56 }}>
					<SectionRow title='Fan Favourites' link='/menu' />
					{productsLoading ? (
						<div className='bf-favourites-grid'>
							{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={230} />)}
						</div>
					) : featuredProducts.length === 0 ? (
						<div style={{ padding: '64px 0', textAlign: 'center' }}>
							<div style={{ fontSize: 48, marginBottom: 14 }}>🍕</div>
							<div style={{ fontWeight: 800, fontSize: 22 }}>Menu loading up</div>
							<Link href='/menu' className='bf-btn bf-btn-primary bf-btn-md' style={{ marginTop: 20, display: 'inline-flex' }}>
								Browse menu {Icons.arrow}
							</Link>
						</div>
					) : (
						<div className='bf-favourites-grid'>
							{featuredProducts.map((item, i) => (
								<FoodCard key={item.id} item={item} variant='grid' tone={TONES[i % 8]} />
							))}
						</div>
					)}
				</section>
			</main>
		</CustomerShell>
	)
}

export { HomeExperience }
