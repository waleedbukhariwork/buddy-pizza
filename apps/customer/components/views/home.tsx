'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CustomerShell } from '../layout/customer-shell'
import { FoodCard } from '../menu/food-card'
import { CatIcon } from '../ui/cat-icon'
import { DealCard, SectionRow, TrustStat } from '../home/home-primitives'
import { type Tone } from '../ui/food-img'
import { Icons } from '../ui/icon'
import { useProducts, useCategories, useDeals } from '../../lib/hooks'

const TONES: Tone[] = ['ember', 'amber', 'ember', 'amber', 'ember', 'amber', 'ember', 'amber']
const DEAL_TONES: Tone[] = ['ember', 'amber', 'ink']

// ─── Time-of-day banner ───────────────────────────────────────────────────────
type TimeSlot = 'morning' | 'lunch' | 'dinner' | 'night' | null

const TIME_CONFIG: Record<NonNullable<TimeSlot>, { msg: string; bg: string; color: string }> = {
	morning: { msg: '🌅 Good morning — breakfast specials are live', bg: 'var(--bf-amber-08)', color: 'var(--bf-ink)' },
	lunch:   { msg: '⏰ Lunch hour · Order now, eat before 2 PM', bg: 'var(--bf-ember-08)', color: 'var(--bf-ink)' },
	dinner:  { msg: '🌙 Dinner time — family deals available', bg: 'var(--bf-amber-08)', color: 'var(--bf-ink)' },
	night:   { msg: "🔥 Late night? We're still cooking", bg: 'var(--bf-ink)', color: '#fff' },
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

// ─── Skeleton block ───────────────────────────────────────────────────────────
function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeExperience() {
	const router = useRouter()
	const [q, setQ] = useState('')
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)
	const catScrollRef = useRef<HTMLDivElement>(null)

	const { data: products, isLoading: productsLoading } = useProducts()
	const { data: categories, isLoading: catsLoading } = useCategories()
	const { data: deals, isLoading: dealsLoading } = useDeals()

	const updateScrollArrows = useCallback(() => {
		const el = catScrollRef.current
		if (!el) return
		setCanScrollLeft(el.scrollLeft > 8)
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
	}, [])

	const scrollCats = useCallback((dir: 'left' | 'right') => {
		const el = catScrollRef.current
		if (!el) return
		el.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
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

	const activeCategories = categories?.filter(c => c.isActive) ?? []
	const activeDeals = deals?.filter(d => d.isActive).slice(0, 3) ?? []
	const featuredProducts = products?.filter(p => p.isAvailable).slice(0, 8) ?? []

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		router.push(q.trim() ? `/menu?q=${encodeURIComponent(q.trim())}` : '/menu')
	}

	return (
		<CustomerShell activePage='home'>
			<TimeBar />
			<main>
				{/* ── Hero ── */}
				<section style={{
					padding: '0 56px',
					minHeight: 'calc(100vh - 81px)',
					display: 'grid',
					gridTemplateColumns: '1.05fr .95fr',
					gap: 48,
					alignItems: 'center',
					maxWidth: 1280,
					margin: '0 auto',
				}}>
					<div>
						<span className='bf-pill bf-pill-amber' style={{ marginBottom: 18 }}>
							<svg width='8' height='8' viewBox='0 0 8 8' className='bf-pulse'><circle cx='4' cy='4' r='3.5' fill='currentColor' /></svg>
							OPEN · DELIVERING NOW
						</span>
						{/* Syne display font on the hero headline */}
						<h1 className='bf-display' style={{ fontSize: 88, margin: '10px 0 0' }}>
							Hot pizza.<br />
							<span style={{ color: 'var(--bf-ember)' }}>At your door.</span>
						</h1>
						<p style={{ fontSize: 17, color: 'var(--bf-ink-2)', maxWidth: 460, marginTop: 22, lineHeight: 1.55 }}>
							Pizza, burgers, shawarma, wings and more — straight from our kitchen. No middleman. No cold food.
						</p>

						{/* Search */}
						<form onSubmit={handleSearch} style={{
							display: 'flex',
							alignItems: 'center',
							marginTop: 30,
							background: 'var(--bf-paper)',
							borderRadius: 999,
							boxShadow: 'var(--bf-shadow-md)',
							border: '1.5px solid var(--bf-line-2)',
							padding: '5px 5px 5px 18px',
							maxWidth: 480,
						}}>
							<span style={{ color: 'var(--bf-mute)', flexShrink: 0, display: 'flex' }}>{Icons.search}</span>
							<input
								value={q}
								onChange={e => setQ(e.target.value)}
								style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--bf-font)', fontSize: 14, padding: '8px 12px', flex: 1, color: 'var(--bf-ink)', minWidth: 0 }}
								placeholder='Search pizza, burgers, deals…'
							/>
							<button type='submit' className='bf-btn bf-btn-primary bf-btn-md'>Search</button>
						</form>

						<div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
							<Link className='bf-btn bf-btn-primary bf-btn-lg' href='/menu'>Order now {Icons.arrow}</Link>
							<Link className='bf-btn bf-btn-outline bf-btn-lg' href='/menu'>See the menu</Link>
						</div>
						<div style={{ display: 'flex', gap: 28, marginTop: 30, alignItems: 'center' }}>
							<TrustStat k='25 min' v='Average delivery' />
							<TrustStat k='4.9★' v='Customer rated' />
							<TrustStat k='Rs. 0' v='Free delivery' />
						</div>
					</div>

					{/* Hero image — float animation applied */}
					<div style={{ position: 'relative', height: 540 }}>
						<div className='bf-img bf-img-ember bf-float' style={{ position: 'absolute', inset: 0, borderRadius: 28 }}>
							<span className='bf-img-cap'>hero · pepperoni pie, top-down</span>
						</div>
						{/* Featured deal float card */}
						{activeDeals[0] && (
							<div style={{
								position: 'absolute',
								bottom: 18,
								left: 18,
								right: 18,
								background: 'var(--bf-paper)',
								borderRadius: 16,
								padding: 14,
								boxShadow: 'var(--bf-shadow-md)',
								display: 'flex',
								gap: 12,
								alignItems: 'center',
							}}>
								<div style={{
									width: 56,
									height: 56,
									borderRadius: 12,
									background: 'var(--bf-ember)',
									display: 'grid',
									placeItems: 'center',
									color: '#fff',
									fontWeight: 900,
									fontSize: 11,
									fontFamily: 'var(--bf-mono)',
									flexShrink: 0,
								}}>
									{activeDeals[0].badge ?? '−%'}
								</div>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div className='bf-eyebrow' style={{ fontSize: 10 }}>FEATURED DEAL</div>
									<div style={{ fontWeight: 800, fontSize: 16 }}>{activeDeals[0].title}</div>
									{activeDeals[0].description && (
										<div style={{ color: 'var(--bf-ink-2)', fontSize: 12.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{activeDeals[0].description}
										</div>
									)}
								</div>
								<div style={{ textAlign: 'right', flexShrink: 0 }}>
									{activeDeals[0].originalPrice && (
										<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
											Rs. {activeDeals[0].originalPrice.toLocaleString('en-PK')}
										</div>
									)}
									<div style={{ fontWeight: 800, fontSize: 22, color: 'var(--bf-ember)' }}>
										Rs. {(activeDeals[0].discountPrice ?? 0).toLocaleString('en-PK')}
									</div>
								</div>
							</div>
						)}
					</div>
				</section>

				{/* ── Categories — horizontal pill strip ── */}
				<section style={{ padding: '40px 56px 8px', maxWidth: 1280, margin: '0 auto' }}>
					<SectionRow title='Browse the menu' link='/menu' />
					{catsLoading ? (
						<div style={{ display: 'flex', gap: 10 }}>
							{Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={88} style={{ width: 100, flexShrink: 0, borderRadius: 16 }} />)}
						</div>
					) : activeCategories.length === 0 ? (
						<div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--bf-ink-2)' }}>
							<div style={{ fontSize: 13 }}>Categories coming soon.</div>
							<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 12, display: 'inline-flex' }}>Browse menu</Link>
						</div>
					) : (
						<div style={{ position: 'relative' }}>
							{/* Left fade + arrow */}
							{canScrollLeft && (
								<>
									<div style={{ position: 'absolute', left: 0, top: 0, bottom: 4, width: 72, background: 'linear-gradient(to right, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button className='bf-cat-scroll-btn' onClick={() => scrollCats('left')} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-60%)', zIndex: 2 }}>
										<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M15 18l-6-6 6-6' /></svg>
									</button>
								</>
							)}

							<div ref={catScrollRef} className='bf-cat-strip'>
								{activeCategories.map((c) => (
									<Link
										key={c.id}
										href={`/menu?category=${c.id}`}
										className='bf-cat-pill'
									>
										<CatIcon name={c.name} size={26} />
										<span className='bf-cat-pill-label'>{c.name}</span>
										<span className='bf-mono' style={{ fontSize: 9.5, color: 'var(--bf-mute)' }}>
											{products?.filter(p => p.categoryId === c.id && p.isAvailable).length ?? '—'}
										</span>
									</Link>
								))}
							</div>

							{/* Right fade + arrow */}
							{canScrollRight && (
								<>
									<div style={{ position: 'absolute', right: 0, top: 0, bottom: 4, width: 72, background: 'linear-gradient(to left, var(--bf-cream) 35%, transparent)', zIndex: 1, pointerEvents: 'none' }} />
									<button className='bf-cat-scroll-btn' onClick={() => scrollCats('right')} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-60%)', zIndex: 2 }}>
										<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M9 18l6-6-6-6' /></svg>
									</button>
								</>
							)}
						</div>
					)}
				</section>

				{/* ── Deals ── */}
				{(dealsLoading || activeDeals.length > 0) && (
					<section id='deals' style={{ padding: '32px 56px 8px', maxWidth: 1280, margin: '0 auto' }}>
						<SectionRow title="Today's deals" link='/menu' eyebrow='LIMITED' />
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
							{dealsLoading
								? Array.from({ length: 3 }).map((_, i) => <Skel key={i} h={240} />)
								: activeDeals.map((d, i) => <DealCard key={d.id} d={d} tone={DEAL_TONES[i % 3]} />)
							}
						</div>
					</section>
				)}

				{/* ── Fan Favourites (renamed from "Most ordered") ── */}
				<section style={{ padding: '32px 56px 56px', maxWidth: 1280, margin: '0 auto' }}>
					<SectionRow title='Fan Favourites' link='/menu' />
					{productsLoading ? (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
							{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={230} />)}
						</div>
					) : featuredProducts.length === 0 ? (
						<div style={{ padding: '64px 0', textAlign: 'center' }}>
							<div style={{ fontSize: 48, marginBottom: 14 }}>🍕</div>
							<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Menu loading up</div>
							<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8 }}>
								We're cooking up something fresh. Check back soon.
							</div>
							<Link href='/menu' className='bf-btn bf-btn-primary bf-btn-md' style={{ marginTop: 20, display: 'inline-flex' }}>
								Browse menu {Icons.arrow}
							</Link>
						</div>
					) : (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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
