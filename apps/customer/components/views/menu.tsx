'use client'
import React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { CustomerShell } from '../layout/customer-shell'
import { FoodCard } from '../menu/food-card'
import { Icons } from '../ui/icon'
import { useProducts, useCategories } from '../../lib/hooks'
import { type Tone } from '../ui/food-img'
import Link from 'next/link'

const TONES: Tone[] = ['ember', 'amber', 'cream']

// ─── Skeleton block ───────────────────────────────────────────────────────────
function Skel({ h, style }: { h: number; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, ...style }} />
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
function MenuExperience() {
	const [activeId, setActiveId] = useState<number | null>(null)
	const [view, setView] = useState<'list' | 'grid'>('list')
	const [searchQ, setSearchQ] = useState('')

	const { data: products, isLoading: productsLoading } = useProducts()
	const { data: categories, isLoading: catsLoading } = useCategories()

	const activeCategories = useMemo(() => categories?.filter(c => c.isActive) ?? [], [categories])

	// Auto-select first category or honour ?category= from URL
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const q = params.get('q')
		const catParam = params.get('category')
		if (q) setSearchQ(q)
		if (catParam) {
			setActiveId(Number(catParam))
		} else if (activeCategories.length > 0 && activeId === null) {
			setActiveId(activeCategories[0].id)
		}
	}, [activeCategories, activeId])

	const activeCategory = activeCategories.find(c => c.id === activeId)

	const visible = useMemo(() => {
		if (!products || activeId === null) return []
		const byCategory = products.filter(p => p.categoryId === activeId && p.isAvailable)
		if (!searchQ.trim()) return byCategory
		const q = searchQ.toLowerCase()
		return byCategory.filter(m =>
			m.name.toLowerCase().includes(q) ||
			(m.description ?? '').toLowerCase().includes(q)
		)
	}, [products, activeId, searchQ])

	const isLoading = catsLoading || productsLoading

	return (
		<CustomerShell activePage='menu'>
			<main>
				{/* Category strip */}
				<div style={{ padding: '20px 56px 0', borderBottom: '1px solid var(--bf-line)', background: 'var(--bf-cream)', position: 'sticky', top: 69, zIndex: 10 }}>
					<div style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: 1280, margin: '0 auto' }} className='bf-scroll'>
						{catsLoading
							? Array.from({ length: 5 }).map((_, i) => (
								<Skel key={i} h={44} style={{ width: 100, borderRadius: 0, flexShrink: 0 }} />
							))
							: activeCategories.map(c => (
								<button
									key={c.id}
									className='bf-btn bf-btn-md'
									onClick={() => { setActiveId(c.id); setSearchQ('') }}
									style={{
										background: c.id === activeId ? 'var(--bf-ink)' : 'transparent',
										color: c.id === activeId ? '#fff' : 'var(--bf-ink-2)',
										padding: '12px 18px', borderRadius: 0,
										borderBottom: c.id === activeId ? '3px solid var(--bf-ember)' : '3px solid transparent',
										fontWeight: 700,
									}}
								>
									{c.name}{' '}
									<span className='bf-mono' style={{ opacity: 0.6, fontSize: 11 }}>
										{products?.filter(p => p.categoryId === c.id && p.isAvailable).length ?? ''}
									</span>
								</button>
							))
						}
					</div>
				</div>

				<div style={{ padding: '24px 56px 56px', maxWidth: 1280, margin: '0 auto' }}>
					{/* Header row */}
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
						<div>
							{isLoading ? (
								<>
									<Skel h={12} style={{ width: 120, marginBottom: 8 }} />
									<Skel h={44} style={{ width: 200 }} />
								</>
							) : (
								<>
									<div className='bf-eyebrow'>CATEGORY · {visible.length} ITEMS</div>
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

					{/* Search */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bf-paper)', borderRadius: 999, border: '1.5px solid var(--bf-line-2)', padding: '7px 7px 7px 16px', marginBottom: 18, maxWidth: 420 }}>
						<span style={{ color: 'var(--bf-mute)', flexShrink: 0, display: 'flex' }}>{Icons.search}</span>
						<input
							value={searchQ}
							onChange={e => setSearchQ(e.target.value)}
							style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--bf-font)', fontSize: 14, flex: 1, color: 'var(--bf-ink)', minWidth: 0 }}
							placeholder={`Search in ${activeCategory?.name ?? 'menu'}…`}
						/>
						{searchQ && (
							<button onClick={() => setSearchQ('')} className='bf-btn bf-btn-ghost' style={{ width: 28, height: 28, padding: 0, borderRadius: 999, color: 'var(--bf-mute)' }}>{Icons.x}</button>
						)}
					</div>

					{/* Items */}
					{isLoading ? (
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
								We're still setting up. Check back shortly!
							</div>
						</div>
					) : visible.length === 0 ? (
						<div style={{ padding: '64px 0', textAlign: 'center' }}>
							<div style={{ fontSize: 40, marginBottom: 12 }}>
								{searchQ ? '🔍' : '🍽️'}
							</div>
							<div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
								{searchQ ? 'No results found' : 'Nothing here yet'}
							</div>
							<div style={{ color: 'var(--bf-ink-2)', fontSize: 13, marginTop: 6 }}>
								{searchQ
									? 'Try a different search or browse another category.'
									: 'We\'re adding items here soon. Try another category!'
								}
							</div>
							{searchQ && (
								<button onClick={() => setSearchQ('')} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16 }}>
									Clear search
								</button>
							)}
							{!searchQ && (
								<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16, display: 'inline-flex' }}>
									Browse all
								</Link>
							)}
						</div>
					) : view === 'list' ? (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							{visible.map((it, i) => (
								<FoodCard key={it.id} item={it} variant='list' tone={TONES[i % 3]} />
							))}
						</div>
					) : (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
							{visible.map((it, i) => (
								<FoodCard key={it.id} item={it} variant='grid' tone={TONES[i % 3]} />
							))}
						</div>
					)}
				</div>
			</main>
		</CustomerShell>
	)
}

export { MenuExperience }
