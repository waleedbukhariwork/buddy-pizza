'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { CustomerShell } from '../layout/customer-shell'
import { FoodCard } from '../menu/food-card'
import { CatIcon } from '../ui/cat-icon'
import { DealCard, SectionRow } from '../home/home-primitives'
import { ReorderCard } from '../home/reorder-card'
import { type Tone } from '../ui/food-img'
import { Icons } from '../ui/icon'
import { useSearch } from '../../lib/search-context'
import { useProducts, useCategories, useDeals } from '../../lib/hooks'
import { useDeliveryStore, formatEta } from '../../lib/delivery-store'
import { FeaturedDealsSlider } from '../home/featured-deals-slider'

const TONES: Tone[] = [
	'ember',
	'amber',
	'ember',
	'amber',
	'ember',
	'amber',
	'ember',
	'amber',
]
const DEAL_TONES: Tone[] = ['ember', 'amber', 'ink']

// ─── Reveal hook ──────────────────────────────────────────────────────────────
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

// ─── Count-up value hook ──────────────────────────────────────────────────────
function useCountUpValue(
	target: number,
	active: boolean,
	duration = 1400,
): number {
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

// ─── Hero V3 (dark, editorial) ────────────────────────────────────────────────
function HeroV3() {
	const { area, etaMinutes, hydrate } = useDeliveryStore()
	const { data: deals } = useDeals()
	const [mounted, setMounted] = useState(false)
	const [arrivalTime, setArrivalTime] = useState<string | null>(null)

	useEffect(() => {
		hydrate()
	}, [hydrate])
	useEffect(() => {
		setArrivalTime(formatEta(etaMinutes))
	}, [etaMinutes])
	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 60)
		return () => clearTimeout(t)
	}, [])

	const activeDeals = deals?.filter((d) => d.isActive) ?? []
	const featuredDeals = activeDeals.filter((d) => d.isFeatured)

	const WORDS = [
		{ text: 'HOT', mod: 'light' },
		{ text: 'PIZZA.', mod: 'ember' },
		{ text: 'AT YOUR', mod: 'light' },
		{ text: 'DOOR.', mod: 'dim' },
	] as const

	return (
		<section className='bf-hero-v3'>
			{/* Ambient glows */}
			<div className='bf-hero-v3-glow-r' />
			<div className='bf-hero-v3-glow-l' />

			<div className='bf-hero-v3-inner'>
				{/* Status row */}
				<div
					className={`bf-hero-v3-topbar${mounted ? ' bf-rw' : ''}`}
					style={{ '--d': '0s' } as React.CSSProperties}
				>
					<div className='bf-hero-v3-live'>
						<span className='bf-live-dot' />
						OPEN · DELIVERING NOW
					</div>
					<div className='bf-hero-v3-area'>
						Delivering to <strong>{area}</strong>
						{arrivalTime && <span> · ~{arrivalTime}</span>}
					</div>
				</div>

				{/* Main 2-column grid */}
				<div className='bf-hero-v3-grid'>
					{/* Left — text */}
					<div className='bf-hero-v3-text'>
						<h1 className='bf-hero-v3-headline'>
							{WORDS.map(({ text, mod }, i) => (
								<span
									key={text}
									className={`bf-hero-v3-word bf-hero-v3-word-${mod}${mounted ? ' bf-rw' : ''}`}
									style={
										{ '--d': `${0.08 + i * 0.14}s` } as React.CSSProperties
									}
								>
									{text}
								</span>
							))}
						</h1>

						<p
							className={`bf-hero-v3-sub${mounted ? ' bf-rw' : ''}`}
							style={{ '--d': '0.64s' } as React.CSSProperties}
						>
							Pizza, burgers, shawarma, wings and more — straight from our
							kitchen.
							<br />
							No middleman. No cold food.
						</p>

						<div
							className={`bf-hero-v3-actions${mounted ? ' bf-rw' : ''}`}
							style={{ '--d': '0.76s' } as React.CSSProperties}
						>
							<SearchTrigger />
							<Link href='/menu' className='bf-hero-v3-order-btn'>
								Order now
								<svg
									width={14}
									height={14}
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth={2.5}
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<path d='M5 12h14' />
									<path d='m12 5 7 7-7 7' />
								</svg>
							</Link>
						</div>

						<div
							className={`bf-hero-v3-trust${mounted ? ' bf-rw' : ''}`}
							style={{ '--d': '0.88s' } as React.CSSProperties}
						>
							{[
								{ k: `~${etaMinutes} min`, v: 'avg. delivery' },
								{ k: '4.9 ★', v: 'customer rating' },
								{ k: 'Rs. 0', v: 'free above Rs 500' },
							].map((stat, i) => (
								<React.Fragment key={i}>
									{i > 0 && <span className='bf-hero-v3-trust-sep' />}
									<div className='bf-hero-v3-trust-item'>
										<span className='bf-hero-v3-tk'>{stat.k}</span>
										<span className='bf-hero-v3-tv'>{stat.v}</span>
									</div>
								</React.Fragment>
							))}
						</div>
					</div>

					{/* Right — Featured deals slider */}
					<div
						className={`bf-hero-v3-visual${mounted ? ' bf-rw' : ''}`}
						style={{ '--d': '0.22s' } as React.CSSProperties}
					>
						{featuredDeals.length > 0 ? (
							<FeaturedDealsSlider deals={featuredDeals} />
						) : (
							/* Fallback placeholder when no deals */
							<div className='bf-hero-v3-img-wrap bf-float'>
								<div
									className='bf-img bf-img-ember'
									style={{ width: '100%', height: '100%', borderRadius: 0 }}
								>
									<span className='bf-img-cap'>
										hero · pepperoni pie, top-down
									</span>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Amber marquee bridge — dark → cream */}
			<div className='bf-menu-marquee' aria-hidden='true'>
				<div className='bf-menu-marquee-track'>
					<span>
						PEPPERONI · BURGERS · SHAWARMA · CRISPY WINGS · LOADED FRIES ·
						SUNDAES · WRAPS · FRESH SIDES ·{' '}
					</span>
					<span aria-hidden='true'>
						PEPPERONI · BURGERS · SHAWARMA · CRISPY WINGS · LOADED FRIES ·
						SUNDAES · WRAPS · FRESH SIDES ·{' '}
					</span>
				</div>
			</div>
		</section>
	)
}

// ─── Stats V2 (animated count-up) ────────────────────────────────────────────
function StatsV2({ etaMinutes }: { etaMinutes: number }) {
	const [inView, setInView] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true)
					io.disconnect()
				}
			},
			{ threshold: 0.2 },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [])

	const eta = useCountUpValue(etaMinutes, inView)
	const items = useCountUpValue(40, inView)
	const orders = useCountUpValue(1200, inView, 1600)

	return (
		<div className='bf-stats-v2-wrap'>
			<div ref={ref} className='bf-stats-v2'>
				<div className='bf-stat-v2'>
					<div className='bf-stat-v2-num'>
						<span className='bf-stat-v2-acc'>~</span>
						{eta}
					</div>
					<div className='bf-stat-v2-lbl'>min delivery</div>
				</div>
				<div className='bf-stat-v2'>
					<div className='bf-stat-v2-num'>
						4.9<span className='bf-stat-v2-acc'>★</span>
					</div>
					<div className='bf-stat-v2-lbl'>customer rating</div>
				</div>
				<div className='bf-stat-v2'>
					<div className='bf-stat-v2-num'>
						{items}
						<span className='bf-stat-v2-acc'>+</span>
					</div>
					<div className='bf-stat-v2-lbl'>menu items</div>
				</div>
				<div className='bf-stat-v2'>
					<div className='bf-stat-v2-num'>
						{orders.toLocaleString()}
						<span className='bf-stat-v2-acc'>+</span>
					</div>
					<div className='bf-stat-v2-lbl'>happy customers</div>
				</div>
			</div>
		</div>
	)
}

// ─── Dark bottom CTA ──────────────────────────────────────────────────────────
function DarkCta() {
	const ref = useReveal()
	return (
		<section
			ref={ref as React.RefObject<HTMLElement>}
			className='bf-dark-cta bf-reveal'
		>
			<div className='bf-dark-cta-inner'>
				<span className='bf-dark-cta-eyebrow'>Still deciding?</span>
				<h2 className='bf-dark-cta-headline'>
					Your next favourite
					<br />
					meal is one tap away.
				</h2>
				<div className='bf-dark-cta-btns'>
					<Link href='/menu' className='bf-btn bf-btn-lg bf-dark-cta-primary'>
						Order now {Icons.arrow}
					</Link>
					<Link href='/deals' className='bf-btn bf-btn-lg bf-dark-cta-ghost'>
						View deals
					</Link>
				</div>
			</div>
		</section>
	)
}

// ─── Main home experience ─────────────────────────────────────────────────────
function SearchTrigger() {
	const { openSearch } = useSearch()
	return (
		<div
			className='bf-hero-search'
			role='button'
			tabIndex={0}
			onClick={openSearch}
			onKeyDown={(e) => {
				if (e.key === 'Enter') openSearch()
			}}
		>
			<span style={{ color: 'var(--bf-mute)', display: 'flex' }}>
				{Icons.search}
			</span>
			<input
				readOnly
				placeholder='Search pizza, burgers, deals…'
				aria-label='Search menu'
			/>
			<span
				className='bf-btn bf-btn-primary bf-btn-md'
				style={{ pointerEvents: 'none' }}
			>
				Search
			</span>
		</div>
	)
}

function HomeExperience() {
	const { etaMinutes, hydrate } = useDeliveryStore()
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)
	const catScrollRef = useRef<HTMLDivElement>(null)
	const catRevealRef = useReveal()
	const dealsRevealRef = useReveal()
	const favsRevealRef = useReveal()

	const { data: products, isLoading: productsLoading } = useProducts()
	const { data: categories, isLoading: catsLoading } = useCategories()
	const { data: deals, isLoading: dealsLoading } = useDeals()

	useEffect(() => {
		hydrate()
	}, [hydrate])

	const updateScrollArrows = useCallback(() => {
		const el = catScrollRef.current
		if (!el) return
		setCanScrollLeft(el.scrollLeft > 8)
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
	}, [])

	const scrollCats = useCallback((dir: 'left' | 'right') => {
		catScrollRef.current?.scrollBy({
			left: dir === 'left' ? -240 : 240,
			behavior: 'smooth',
		})
	}, [])

	useEffect(() => {
		const el = catScrollRef.current
		if (!el) return
		updateScrollArrows()
		el.addEventListener('scroll', updateScrollArrows, { passive: true })
		const ro = new ResizeObserver(updateScrollArrows)
		ro.observe(el)
		return () => {
			el.removeEventListener('scroll', updateScrollArrows)
			ro.disconnect()
		}
	}, [updateScrollArrows, categories])

	const activeCategories = categories?.filter((c) => c.isActive) ?? []
	const activeDeals = deals?.filter((d) => d.isActive).slice(0, 3) ?? []
	const featuredProducts =
		products?.filter((p) => p.isAvailable).slice(0, 8) ?? []

	return (
		<CustomerShell activePage='home'>
			<main>
				<HeroV3 />
				<ReorderCard />
				<StatsV2 etaMinutes={etaMinutes} />

				{/* ── Categories ── */}
				<section
					ref={catRevealRef as React.RefObject<HTMLElement>}
					className='bf-page-section bf-reveal'
				>
					<SectionRow title='Browse the menu' link='/menu' />
					{catsLoading ? (
						<div style={{ display: 'flex', gap: 10 }}>
							{Array.from({ length: 6 }).map((_, i) => (
								<Skel
									key={i}
									h={88}
									style={{ width: 100, flexShrink: 0, borderRadius: 16 }}
								/>
							))}
						</div>
					) : (
						<div style={{ position: 'relative' }}>
							{canScrollLeft && (
								<>
									<div
										style={{
											position: 'absolute',
											left: 0,
											top: 0,
											bottom: 4,
											width: 72,
											background:
												'linear-gradient(to right, var(--bf-cream) 35%, transparent)',
											zIndex: 1,
											pointerEvents: 'none',
										}}
									/>
									<button
										type='button'
										className='bf-cat-scroll-btn'
										onClick={() => scrollCats('left')}
										style={{
											position: 'absolute',
											left: 4,
											top: '50%',
											transform: 'translateY(-60%)',
											zIndex: 2,
										}}
										aria-label='Scroll categories left'
									>
										<svg
											width={13}
											height={13}
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth={2.5}
										>
											<path d='M15 18l-6-6 6-6' />
										</svg>
									</button>
								</>
							)}
							<div ref={catScrollRef} className='bf-cat-strip'>
								{activeCategories.map((c) => (
									<Link
										key={c.id}
										href={`/menu#cat-${c.id}`}
										className='bf-cat-pill'
									>
										<CatIcon name={c.name} size={26} />
										<span className='bf-cat-pill-label'>{c.name}</span>
										<span
											className='bf-mono'
											style={{ fontSize: 9.5, color: 'var(--bf-mute)' }}
										>
											{products?.filter(
												(p) => p.categoryId === c.id && p.isAvailable,
											).length ?? '—'}
										</span>
									</Link>
								))}
							</div>
							{canScrollRight && (
								<>
									<div
										style={{
											position: 'absolute',
											right: 0,
											top: 0,
											bottom: 4,
											width: 72,
											background:
												'linear-gradient(to left, var(--bf-cream) 35%, transparent)',
											zIndex: 1,
											pointerEvents: 'none',
										}}
									/>
									<button
										type='button'
										className='bf-cat-scroll-btn'
										onClick={() => scrollCats('right')}
										style={{
											position: 'absolute',
											right: 4,
											top: '50%',
											transform: 'translateY(-60%)',
											zIndex: 2,
										}}
										aria-label='Scroll categories right'
									>
										<svg
											width={13}
											height={13}
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth={2.5}
										>
											<path d='M9 18l6-6-6-6' />
										</svg>
									</button>
								</>
							)}
						</div>
					)}
				</section>

				{/* ── Deals (bento grid) ── */}
				{(dealsLoading || activeDeals.length > 0) && (
					<section
						ref={dealsRevealRef as React.RefObject<HTMLElement>}
						id='deals'
						className='bf-page-section bf-reveal'
					>
						<SectionRow title='Buddy Deals' link='/deals' eyebrow='LIMITED' />
						<div
							className={[
								'bf-deals-bento',
								activeDeals.length === 1 ? 'bf-deals-bento-one' : '',
								activeDeals.length === 2 ? 'bf-deals-bento-two' : '',
							]
								.filter(Boolean)
								.join(' ')}
						>
							{dealsLoading
								? Array.from({ length: 3 }).map((_, i) => (
										<Skel key={i} h={i === 0 ? 420 : 190} />
									))
								: activeDeals.map((d, i) => (
										<DealCard
											key={d.id}
											d={d}
											tone={DEAL_TONES[i % 3]}
											featured={i === 0}
										/>
									))}
						</div>
					</section>
				)}

				{/* ── Fan Favourites ── */}
				<section
					ref={favsRevealRef as React.RefObject<HTMLElement>}
					className='bf-page-section bf-reveal'
					style={{ paddingBottom: 56 }}
				>
					<SectionRow title='Buddy Items' link='/menu' />
					{productsLoading ? (
						<div className='bf-favourites-grid'>
							{Array.from({ length: 8 }).map((_, i) => (
								<Skel key={i} h={230} />
							))}
						</div>
					) : featuredProducts.length === 0 ? (
						<div style={{ padding: '64px 0', textAlign: 'center' }}>
							<div style={{ fontSize: 48, marginBottom: 14 }}>🍕</div>
							<div style={{ fontWeight: 800, fontSize: 22 }}>
								Menu loading up
							</div>
							<Link
								href='/menu'
								className='bf-btn bf-btn-primary bf-btn-md'
								style={{ marginTop: 20, display: 'inline-flex' }}
							>
								Browse menu {Icons.arrow}
							</Link>
						</div>
					) : (
						<div className='bf-favourites-grid'>
							{featuredProducts.map((item, i) => (
								<FoodCard
									key={item.id}
									item={item}
									variant='grid'
									tone={TONES[i % 8]}
								/>
							))}
						</div>
					)}
				</section>

				<DarkCta />
			</main>
		</CustomerShell>
	)
}

export { HomeExperience }
