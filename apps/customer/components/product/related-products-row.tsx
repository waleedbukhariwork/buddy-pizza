'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { FoodCard } from '../menu/food-card'
import { type Product } from '../../lib/hooks'
import { type Tone } from '../ui/food-img'

const TONES: Tone[] = ['ember', 'amber', 'cream']

function RelatedProductsRow({
	title,
	products,
}: {
	title: string
	products: Product[]
}) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)

	const updateArrows = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		setCanScrollLeft(el.scrollLeft > 8)
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
	}, [])

	const scroll = useCallback((dir: 'left' | 'right') => {
		const el = scrollRef.current
		if (!el) return
		const step = Math.min(280, el.clientWidth * 0.85)
		el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
	}, [])

	useEffect(() => {
		const el = scrollRef.current
		if (!el) return
		updateArrows()
		el.addEventListener('scroll', updateArrows, { passive: true })
		const ro = new ResizeObserver(updateArrows)
		ro.observe(el)
		return () => {
			el.removeEventListener('scroll', updateArrows)
			ro.disconnect()
		}
	}, [updateArrows, products])

	if (products.length === 0) return null

	return (
		<div className='bf-pd-related'>
			<hr className='bf-rule' style={{ margin: '44px 0 24px' }} />
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 20 }}>
				<div>
					<div className='bf-eyebrow' style={{ marginBottom: 6, color: 'var(--bf-ember)' }}>MORE FROM</div>
					<h2 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.022em', margin: 0 }}>{title}</h2>
				</div>
				{(canScrollLeft || canScrollRight) && (
					<div className='bf-pd-related-arrows'>
						<button
							type='button'
							className='bf-cat-scroll-btn'
							onClick={() => scroll('left')}
							disabled={!canScrollLeft}
							aria-label='Scroll related items left'
							style={{ opacity: canScrollLeft ? 1 : 0.35 }}
						>
							<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M15 18l-6-6 6-6' /></svg>
						</button>
						<button
							type='button'
							className='bf-cat-scroll-btn'
							onClick={() => scroll('right')}
							disabled={!canScrollRight}
							aria-label='Scroll related items right'
							style={{ opacity: canScrollRight ? 1 : 0.35 }}
						>
							<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M9 18l6-6-6-6' /></svg>
						</button>
					</div>
				)}
			</div>

			<div className='bf-pd-related-track-wrap'>
				{canScrollLeft && (
					<div className='bf-pd-related-fade bf-pd-related-fade-left' aria-hidden='true' />
				)}
				{canScrollRight && (
					<div className='bf-pd-related-fade bf-pd-related-fade-right' aria-hidden='true' />
				)}
				<div ref={scrollRef} className='bf-pd-related-scroll'>
					{products.map((rel, i) => (
						<div key={rel.id} className='bf-pd-related-card'>
							<FoodCard item={rel} variant='compact' tone={TONES[i % TONES.length]} />
						</div>
					))}
				</div>
			</div>
			<p className='bf-pd-related-hint bf-mono'>Scroll or use arrows to see more</p>
		</div>
	)
}

export { RelatedProductsRow }
