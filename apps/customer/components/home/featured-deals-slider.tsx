'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { rs, parseDealItems, getDealExpiryBadge, type Deal } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'

const AUTO_MS = 5200

function ChevLeft() {
	return (
		<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
			<path d='M15 18l-6-6 6-6' />
		</svg>
	)
}

function ChevRight() {
	return (
		<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
			<path d='M9 18l6-6-6-6' />
		</svg>
	)
}

function CheckMini() {
	return (
		<svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={3.5} strokeLinecap='round' strokeLinejoin='round'>
			<polyline points='20 6 9 17 4 12' />
		</svg>
	)
}

function ArrowRight() {
	return (
		<svg width={12} height={12} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
			<path d='M5 12h14' />
			<path d='m12 5 7 7-7 7' />
		</svg>
	)
}

export function FeaturedDealsSlider({ deals }: { deals: Deal[] }) {
	const [idx, setIdx] = useState(0)
	const [dir, setDir] = useState<'r' | 'l'>('r')
	const [paused, setPaused] = useState(false)
	const touchX = useRef<number | null>(null)
	const n = deals.length

	const router = useRouter()
	const cartItems = useCartStore((s) => s.items)
	const token = useAuthStore((s) => s.token)
	const addItem = useCartStore((s) => s.addItem)

	const go = useCallback((i: number, d: 'r' | 'l') => {
		setDir(d)
		setIdx(i)
	}, [])

	const next = useCallback(() => go((idx + 1) % n, 'r'), [idx, n, go])
	const prev = useCallback(() => go((idx - 1 + n) % n, 'l'), [idx, n, go])

	useEffect(() => {
		if (n < 2 || paused) return
		const t = setInterval(next, AUTO_MS)
		return () => clearInterval(t)
	}, [n, paused, next])

	if (!n) return null

	const deal = deals[idx]
	const inCart = cartItems.some((i) => i.dealId === deal.id)
	const expiryBadge = getDealExpiryBadge(deal.expiresAt)
	const savings =
		deal.originalPrice && deal.discountPrice && deal.originalPrice > deal.discountPrice
			? deal.originalPrice - deal.discountPrice
			: null
	const parsedItems = parseDealItems(deal.items)
	const hasFlavorItems = parsedItems.some((i) => (i.availableFlavors?.length ?? 0) > 0)

	function handleAdd(e: React.MouseEvent) {
		e.stopPropagation()
		if (!token) {
			router.push('/auth/login?redirect=/deals')
			return
		}
		if (hasFlavorItems) {
			router.push(`/deals/${deal.id}`)
			return
		}
		addItem({
			productId: 0,
			dealId: deal.id,
			productName: deal.title,
			price: deal.discountPrice ?? 0,
			quantity: 1,
			customizations: parsedItems
				.map((i) => `${i.qty}× ${i.name}${i.size ? ' (' + i.size + ')' : ''}`)
				.join(', '),
		})
	}

	return (
		<div
			className='bf-fdslider'
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
			onTouchStart={(e) => {
				touchX.current = e.touches[0].clientX
			}}
			onTouchEnd={(e) => {
				if (touchX.current === null) return
				const diff = touchX.current - e.changedTouches[0].clientX
				if (Math.abs(diff) > 44) diff > 0 ? next() : prev()
				touchX.current = null
			}}
			aria-label='Featured deals'
			aria-roledescription='carousel'
		>
			{/* ── Live deals chip ──────────────────────────────────────── */}
			<div className='bf-fdslider-live-chip'>
				<span className='bf-live-dot' />
				Live Deals
			</div>

			{/* ── Active slide ─────────────────────────────────────────── */}
			<div
				key={`${idx}-${dir}`}
				className={`bf-fdslider-slide bf-fdslider-slide-${dir}`}
				onClick={() => router.push(`/deals/${deal.id}`)}
				role='group'
				aria-roledescription='slide'
				aria-label={`Deal ${idx + 1} of ${n}: ${deal.title}`}
			>
				{/* Media */}
				{deal.imageUrl ? (
					<img
						src={deal.imageUrl}
						alt={deal.title}
						className='bf-fdslider-img'
						draggable={false}
					/>
				) : (
					<div className='bf-fdslider-no-img'>
						<span className='bf-fdslider-no-img-emoji'>🍕</span>
						<span className='bf-fdslider-no-img-label'>{deal.title}</span>
					</div>
				)}

				{/* Gradient vignette */}
				<div className='bf-fdslider-grad' />

				{/* Counter chip */}
				{n > 1 && (
					<div className='bf-fdslider-counter'>
						{idx + 1} / {n}
					</div>
				)}

				{/* Content */}
				<div className='bf-fdslider-body'>
					{/* Pills */}
					{(deal.tag || deal.badge || savings !== null || expiryBadge) && (
						<div className='bf-fdslider-pills'>
							{deal.tag && (
								<span className='bf-fds-pill bf-fds-pill-ink'>{deal.tag}</span>
							)}
							{deal.badge && (
								<span className='bf-fds-pill bf-fds-pill-ember'>{deal.badge}</span>
							)}
							{savings !== null && (
								<span className='bf-fds-pill bf-fds-pill-leaf'>
									Save {rs(savings)}
								</span>
							)}
							{expiryBadge && (
								<span
									className={`bf-fds-pill ${expiryBadge.urgent ? 'bf-fds-pill-urgent' : 'bf-fds-pill-warm'}`}
								>
									⏱ {expiryBadge.text}
								</span>
							)}
						</div>
					)}

					{/* Title */}
					<h3 className='bf-fdslider-h'>{deal.title}</h3>
					{deal.description && (
						<p className='bf-fdslider-p'>{deal.description}</p>
					)}

					{/* Price + CTA */}
					<div className='bf-fdslider-foot'>
						<div className='bf-fdslider-price-wrap'>
							{deal.originalPrice ? (
								<span className='bf-fdslider-price-orig'>
									{rs(deal.originalPrice)}
								</span>
							) : null}
							<span className='bf-fdslider-price'>
								{rs(deal.discountPrice ?? 0)}
							</span>
						</div>

						{inCart ? (
							<button
								className='bf-fdslider-cta bf-fdslider-cta-added'
								disabled
								onClick={(e) => e.stopPropagation()}
							>
								<CheckMini /> Added
							</button>
						) : (
							<button className='bf-fdslider-cta' onClick={handleAdd}>
								{hasFlavorItems ? 'Customize' : 'Order deal'}
								<ArrowRight />
							</button>
						)}
					</div>
				</div>
			</div>

			{/* ── Controls (multi-deal only) ───────────────────────────── */}
			{n > 1 && (
				<>
					<button
						className='bf-fdslider-nav bf-fdslider-nav-l'
						onClick={(e) => {
							e.stopPropagation()
							prev()
						}}
						aria-label='Previous deal'
					>
						<ChevLeft />
					</button>
					<button
						className='bf-fdslider-nav bf-fdslider-nav-r'
						onClick={(e) => {
							e.stopPropagation()
							next()
						}}
						aria-label='Next deal'
					>
						<ChevRight />
					</button>

					{/* Dots */}
					<div className='bf-fdslider-dots' role='tablist' aria-label='Deals'>
						{deals.map((_, i) => (
							<button
								key={i}
								role='tab'
								aria-selected={i === idx}
								aria-label={`Go to deal ${i + 1}`}
								className={`bf-fdslider-dot${i === idx ? ' bf-fdslider-dot-on' : ''}`}
								onClick={(e) => {
									e.stopPropagation()
									go(i, i >= idx ? 'r' : 'l')
								}}
							/>
						))}
					</div>

					{/* Auto-play progress bar */}
					<div className='bf-fdslider-pb'>
						<div
							key={`pb-${idx}`}
							className={`bf-fdslider-pb-fill${paused ? ' bf-fdslider-pb-paused' : ''}`}
							style={{ animationDuration: `${AUTO_MS}ms` }}
						/>
					</div>
				</>
			)}
		</div>
	)
}
