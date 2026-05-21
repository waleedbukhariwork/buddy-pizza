'use client'
import React, { useState } from 'react'
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

// ─── Skeleton block ───────────────────────────────────────────────────────────
function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeExperience() {
	const router = useRouter()
	const [q, setQ] = useState('')

	const { data: products, isLoading: productsLoading } = useProducts()
	const { data: categories, isLoading: catsLoading } = useCategories()
	const { data: deals, isLoading: dealsLoading } = useDeals()

	const activeCategories = categories?.filter(c => c.isActive) ?? []
	const activeDeals = deals?.filter(d => d.isActive).slice(0, 3) ?? []
	const featuredProducts = products?.filter(p => p.isAvailable).slice(0, 8) ?? []

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		router.push(q.trim() ? `/menu?q=${encodeURIComponent(q.trim())}` : '/menu')
	}

	return (
		<CustomerShell activePage='home'>
			<main>
				{/* Hero — fills viewport below the sticky nav */}
				<section style={{ padding: '0 56px', minHeight: 'calc(100vh - 81px)', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 48, alignItems: 'center', maxWidth: 1280, margin: '0 auto' }}>
					<div>
						<span className='bf-pill bf-pill-amber' style={{ marginBottom: 18 }}>
							<svg width='8' height='8' viewBox='0 0 8 8' className='bf-pulse'><circle cx='4' cy='4' r='3.5' fill='currentColor' /></svg>
							OPEN · DELIVERING NOW
						</span>
						<h1 style={{ fontWeight: 900, fontSize: 92, letterSpacing: '-0.04em', lineHeight: 0.9, margin: '10px 0 0' }}>
							Made hot.<br />
							<span style={{ color: 'var(--bf-ember)' }}>Delivered fast.</span>
						</h1>
						<p style={{ fontSize: 18, color: 'var(--bf-ink-2)', maxWidth: 480, marginTop: 22, lineHeight: 1.5 }}>
							Pizza, burgers, shawarma, wings and more — straight from our kitchen in Multan. No middleman. No cold food.
						</p>

						{/* Search */}
						<form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginTop: 30, background: 'var(--bf-paper)', borderRadius: 999, boxShadow: 'var(--bf-shadow-md)', border: '1.5px solid var(--bf-line-2)', padding: '5px 5px 5px 18px', maxWidth: 480 }}>
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
							<TrustStat k='4.9★' v='Multan loved' />
							<TrustStat k='Rs. 0' v='Free delivery' />
						</div>
					</div>
					<div style={{ position: 'relative', height: 540 }}>
						<div className='bf-img bf-img-ember' style={{ position: 'absolute', inset: 0, borderRadius: 24 }}>
							<span className='bf-img-cap'>hero · pepperoni pie, top-down</span>
						</div>
						{/* Featured deal float card — shows first active deal */}
						{activeDeals[0] && (
							<div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, background: 'var(--bf-paper)', borderRadius: 16, padding: 14, boxShadow: 'var(--bf-shadow-md)', display: 'flex', gap: 12, alignItems: 'center' }}>
								<div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bf-ember)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 11, fontFamily: 'var(--bf-mono)', flexShrink: 0 }}>
									{activeDeals[0].badge ?? '−%'}
								</div>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div className='bf-eyebrow' style={{ fontSize: 10 }}>FEATURED DEAL</div>
									<div style={{ fontWeight: 800, fontSize: 16 }}>{activeDeals[0].title}</div>
									{activeDeals[0].description && (
										<div style={{ color: 'var(--bf-ink-2)', fontSize: 12.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeDeals[0].description}</div>
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

				{/* Categories */}
				<section style={{ padding: '40px 56px 8px', maxWidth: 1280, margin: '0 auto' }}>
					<SectionRow title='Browse the menu' link='/menu' />
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
						{catsLoading
							? Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={104} />)
							: activeCategories.length === 0
								? (
									<div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center', color: 'var(--bf-ink-2)' }}>
										<div style={{ fontSize: 13 }}>Categories coming soon.</div>
										<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 12, display: 'inline-flex' }}>Browse menu</Link>
									</div>
								)
								: activeCategories.map((c, i) => (
									<Link key={c.id} href={`/menu?category=${c.id}`} className='bf-card bf-lift' style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', cursor: 'pointer', border: i === 0 ? '1.5px solid var(--bf-ember)' : '1px solid var(--bf-line)', textDecoration: 'none' }}>
										<CatIcon name={c.name} size={28} />
										<div>
											<div style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
											<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)' }}>
												{products?.filter(p => p.categoryId === c.id && p.isAvailable).length ?? '—'} items
											</div>
										</div>
									</Link>
								))
						}
					</div>
				</section>

				{/* Deals — only shown when there are active deals */}
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

				{/* Most ordered */}
				<section style={{ padding: '32px 56px 56px', maxWidth: 1280, margin: '0 auto' }}>
					<SectionRow title='Most ordered' link='/menu' />
					{productsLoading ? (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
							{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={230} />)}
						</div>
					) : featuredProducts.length === 0 ? (
						<div style={{ padding: '64px 0', textAlign: 'center' }}>
							<div style={{ fontSize: 48, marginBottom: 14 }}>🍕</div>
							<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Menu loading up</div>
							<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8 }}>We're cooking up something fresh. Check back soon.</div>
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
