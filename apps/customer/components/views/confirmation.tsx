'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icons } from '../ui/icon'
import { Logo } from '../ui/logo'
import { CartTotals } from '../ui/cart-totals'
import { CartItemRow } from '../cart/cart-drawer'
import { ReceiptModal } from '../ui/receipt'
import type { CartItem } from '@shared/index'
import type { PlacedOrder } from '../../lib/hooks'

// ─── Checkout stepper (used by checkout.tsx too) ──────────────────────────────
function Stepper({ active }: { active: number }) {
	const steps = ['Cart', 'Checkout', 'Confirmation']
	return (
		<div className='bf-flow-stepper' style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
			{steps.map((s, i) => (
				<div key={i} className='bf-flow-step' data-active={i === active ? 'true' : undefined} data-done={i < active ? 'true' : undefined} style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{
							width: 22,
							height: 22,
							borderRadius: 999,
							display: 'grid',
							placeItems: 'center',
							background: i < active ? 'var(--bf-leaf)' : i === active ? 'var(--bf-ember)' : 'var(--bf-paper)',
							color: i <= active ? '#fff' : 'var(--bf-mute)',
							font: '700 11px var(--bf-mono)',
							boxShadow: i > active ? 'inset 0 0 0 1.5px var(--bf-line-2)' : 'none',
						}}>
							{i < active ? (
								<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
									<path d='M4 12l5 5L20 6' />
								</svg>
							) : i + 1}
						</span>
						<span className='bf-flow-step-label' style={{ font: i === active ? '700 13px var(--bf-font)' : '500 13px var(--bf-font)', color: i <= active ? 'var(--bf-ink)' : 'var(--bf-mute)' }}>
							{s}
						</span>
					</div>
					{i < steps.length - 1 && (
						<span className='bf-flow-step-rule' style={{ width: 28, height: 1, background: 'var(--bf-line-2)', margin: '0 8px' }} />
					)}
				</div>
			))}
		</div>
	)
}

// ─── Confetti burst (disappears after 2s) ─────────────────────────────────────
const CONFETTI_COLORS = ['var(--bf-ember)', 'var(--bf-amber)', '#fff', '#e8431f', '#ffb627']

function Confetti() {
	const [show, setShow] = useState(true)
	useEffect(() => {
		const t = setTimeout(() => setShow(false), 2200)
		return () => clearTimeout(t)
	}, [])
	if (!show) return null

	const pieces = Array.from({ length: 24 }, (_, i) => ({
		left: `${(i / 24) * 100 + (Math.sin(i * 1.3) * 4)}%`,
		color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
		delay: `${(i % 8) * 0.07}s`,
		duration: `${1.1 + (i % 5) * 0.18}s`,
		size: `${7 + (i % 5) * 3}px`,
		rotation: `${(i * 47) % 360}deg`,
		isCircle: i % 3 === 0,
	}))

	return (
		<div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99, overflow: 'hidden' }}>
			{pieces.map((p, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						top: -20,
						left: p.left,
						width: p.size,
						height: p.size,
						background: p.color,
						borderRadius: p.isCircle ? '50%' : '2px',
						animation: `bf-confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
						'--r': p.rotation,
					} as React.CSSProperties}
				/>
			))}
		</div>
	)
}

// ─── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ startSeconds = 32 * 60 }: { startSeconds?: number }) {
	const [secs, setSecs] = useState(startSeconds)
	useEffect(() => {
		const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
		return () => clearInterval(id)
	}, [])
	const m = Math.floor(secs / 60)
	const s = secs % 60
	return (
		<span style={{ fontFamily: 'var(--bf-mono)', fontWeight: 800, fontSize: 40, letterSpacing: '-0.02em', color: 'var(--bf-ember)' }}>
			{m}:{String(s).padStart(2, '0')}
		</span>
	)
}

// ─── Order status → progress step ────────────────────────────────────────────
const STATUS_STEP: Record<string, number> = {
	NEW: 0,
	PREPARING: 1,
	READY: 1,
	WITH_RIDER: 2,
	DELIVERED: 3,
	CANCELLED: 0,
}

// ─── Progress tracker ─────────────────────────────────────────────────────────
const STEPS = ['Received', 'Preparing', 'With rider', 'Delivered'] as const

function ProgressTracker({ activeStep }: { activeStep: number }) {
	return (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', marginTop: 6 }}>
			<div style={{ position: 'absolute', top: 11, left: 16, right: 16, height: 3, background: 'var(--bf-line-2)', borderRadius: 999 }} />
			<div style={{
				position: 'absolute',
				top: 11,
				left: 16,
				width: `calc((100% - 32px) * ${activeStep / (STEPS.length - 1)})`,
				height: 3,
				background: 'var(--bf-ember)',
				borderRadius: 999,
				transition: 'width 0.6s ease',
			}} />
			{STEPS.map((label, i) => {
				const done = i < activeStep
				const active = i === activeStep
				return (
					<div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', width: 80 }}>
						<span
							className={active ? 'bf-step-active' : undefined}
							style={{
								width: 24,
								height: 24,
								borderRadius: '50%',
								background: done ? 'var(--bf-leaf)' : active ? 'var(--bf-ember)' : 'var(--bf-paper)',
								color: done || active ? '#fff' : 'var(--bf-mute)',
								boxShadow: done || active ? '0 0 0 4px var(--bf-cream)' : 'inset 0 0 0 1.5px var(--bf-line-2), 0 0 0 4px var(--bf-cream)',
								display: 'grid',
								placeItems: 'center',
								transition: 'background 0.3s',
							}}
						>
							{done && (
								<svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
									<path d='M4 12l5 5L20 6' />
								</svg>
							)}
						</span>
						<span style={{ font: '700 11.5px var(--bf-font)', color: done || active ? 'var(--bf-ink)' : 'var(--bf-mute)', textAlign: 'center' }}>
							{label}
						</span>
					</div>
				)
			})}
		</div>
	)
}

// ─── Tone cycle for cart items (no tone in order data) ────────────────────────
const TONES = ['ember', 'amber', 'ink', 'cream'] as const

// ─── CONFIRMATION ─────────────────────────────────────────────────────────────
function ConfirmationExperience() {
	const [orderData, setOrderData] = useState<{
		order: PlacedOrder
		cartSnapshot: CartItem[]
	} | null>(null)
	const [showReceipt, setShowReceipt] = useState(false)

	useEffect(() => {
		try {
			const raw = sessionStorage.getItem('bf_last_order')
			if (raw) setOrderData(JSON.parse(raw))
		} catch {
			// sessionStorage unavailable or malformed — show fallback
		}
	}, [])

	const order = orderData?.order
	const cartItems = orderData?.cartSnapshot ?? []
	const activeStep = STATUS_STEP[order?.status ?? 'NEW'] ?? 0
	const subtotal = order?.total ?? cartItems.reduce((s, i) => s + (i.sizePrice ?? i.price) * i.quantity, 0)
	const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0)

	return (
		<div style={{ minHeight: '100vh', background: 'var(--bf-cream)' }}>
			<Confetti />

			<header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 56px', borderBottom: '1px solid var(--bf-line)' }}>
				<Logo size={22} />
				<Stepper active={2} />
				<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-sm'>Back to menu</Link>
			</header>

			<div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 32px 56px' }}>
				{/* ── Hero success state ── */}
				<div className='bf-fade-up' style={{ textAlign: 'center' }}>
					<div style={{
						display: 'inline-grid',
						placeItems: 'center',
						width: 72,
						height: 72,
						borderRadius: '50%',
						background: 'var(--bf-leaf)',
						color: '#fff',
						marginBottom: 16,
					}}>
						<svg width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round'>
							<path
								d='M4 12l5 5L20 6'
								strokeDasharray='40'
								style={{ animation: 'bf-check-draw 0.5s 0.1s ease forwards', strokeDashoffset: 40 } as React.CSSProperties}
							/>
						</svg>
					</div>
					<div className='bf-eyebrow' style={{ color: 'var(--bf-leaf)' }}>ORDER CONFIRMED</div>
					<h1 style={{ fontWeight: 900, fontSize: 56, letterSpacing: '-0.035em', lineHeight: 0.92, margin: '8px 0 6px' }}>
						It's on the way.
					</h1>
					<p style={{ fontSize: 16, color: 'var(--bf-ink-2)', margin: 0 }}>
						We've sent the order to the kitchen. The rider will call when nearby.
					</p>
				</div>

				<div className='bf-confirmation-grid' style={{ display: 'grid', gap: 18, marginTop: 32 }}>
					{/* ── Order + ETA card ── */}
					<div className='bf-card bf-fade-up-1' style={{ padding: 22 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<div>
								<div className='bf-eyebrow'>ORDER</div>
								<div style={{ fontWeight: 800, fontSize: 26, marginTop: 4 }}>
									{order ? `#${order.orderNumber}` : '—'}
								</div>
							</div>
							<div style={{ textAlign: 'right' }}>
								<div className='bf-eyebrow'>ARRIVING IN</div>
								<Countdown startSeconds={32 * 60} />
								<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 2 }}>
									est. by {new Date(Date.now() + 32 * 60_000).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true })}
								</div>
							</div>
						</div>
						<hr className='bf-rule' />
						<ProgressTracker activeStep={activeStep} />
						<hr className='bf-rule' />
						{/* Rider card */}
						<div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--bf-cream-2)', borderRadius: 12, alignItems: 'center' }}>
							<div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bf-ink)', display: 'grid', placeItems: 'center', color: '#fff' }}>
								{Icons.bike}
							</div>
							<div style={{ flex: 1 }}>
								<div className='bf-eyebrow'>YOUR RIDER</div>
								<div style={{ font: '800 15px var(--bf-font)', marginTop: 2 }}>Awaiting assignment</div>
							</div>
							<button className='bf-btn bf-btn-outline bf-btn-sm' disabled style={{ opacity: 0.5 }}>
								{Icons.phone} Call
							</button>
						</div>
					</div>

					{/* ── Order summary card ── */}
					<div className='bf-card bf-fade-up-2' style={{ padding: 22 }}>
						<div className='bf-eyebrow'>SUMMARY</div>
						<h3 style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>
							{totalItems} item{totalItems !== 1 ? 's' : ''} · COD
						</h3>
						<div style={{ marginTop: 8 }}>
							{cartItems.length > 0 ? (
								cartItems.map((it, i) => (
									<CartItemRow
										key={`${it.productId}-${it.size ?? ''}-${i}`}
										name={`${it.productName}${it.size ? ` · ${it.size}` : ''}`}
										qty={it.quantity}
										price={(it.sizePrice ?? it.price) * it.quantity}
										tone={TONES[i % TONES.length]}
										compact
									/>
								))
							) : (
								// Fallback if sessionStorage was cleared
								<p style={{ fontSize: 13, color: 'var(--bf-mute)' }}>Order placed successfully.</p>
							)}
						</div>
						<hr className='bf-rule' />
						<CartTotals subtotal={subtotal} delivery={0} />
						{order?.deliveryAddress && (
							<>
								<hr className='bf-rule' />
								<div style={{ font: '600 12px var(--bf-font)', color: 'var(--bf-ink-2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
									{Icons.pin}<span>{order.deliveryAddress}</span>
								</div>
							</>
						)}
					</div>
				</div>

				{/* ── CTAs ── */}
				<div className='bf-fade-up-3' style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center' }}>
					<button className='bf-btn bf-btn-ink bf-btn-md'>Track live</button>
					<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-md'>Order again</Link>
					<button className='bf-btn bf-btn-ghost bf-btn-md' onClick={() => setShowReceipt(true)}>
						{Icons.receipt} Receipt
					</button>
				</div>

				{showReceipt && order && (
					<ReceiptModal
						order={order}
						cartItems={cartItems}
						onClose={() => setShowReceipt(false)}
					/>
				)}
			</div>
		</div>
	)
}

export { Stepper, ConfirmationExperience }
