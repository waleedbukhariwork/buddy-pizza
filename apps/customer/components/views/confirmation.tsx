'use client'
import React from 'react'
import Link from 'next/link'
import { Icons } from '../ui/icon'
import { Logo } from '../ui/logo'
import { CartTotals } from '../ui/cart-totals'
import { CartItemRow } from '../cart/cart-drawer'


// ─── Checkout stepper ─────────────────────────────────────────────────────────
function Stepper({ active }: { active: number }) {
	const steps = ['Cart', 'Checkout', 'Confirmation']
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
			{steps.map((s, i) => (
				<div key={i} style={{ display: 'flex', alignItems: 'center', gap: i < steps.length - 1 ? 0 : undefined }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{
							width: 22, height: 22, borderRadius: 999, display: 'grid', placeItems: 'center',
							background: i < active ? 'var(--bf-leaf)' : i === active ? 'var(--bf-ember)' : 'var(--bf-paper)',
							color: i <= active ? '#fff' : 'var(--bf-mute)',
							font: '700 11px var(--bf-mono)',
							boxShadow: i > active ? 'inset 0 0 0 1.5px var(--bf-line-2)' : 'none',
						}}>
							{i < active ? <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><path d='M4 12l5 5L20 6' /></svg> : i + 1}
						</span>
						<span style={{ font: i === active ? '700 13px var(--bf-font)' : '500 13px var(--bf-font)', color: i <= active ? 'var(--bf-ink)' : 'var(--bf-mute)' }}>{s}</span>
					</div>
					{i < steps.length - 1 && <span style={{ width: 28, height: 1, background: 'var(--bf-line-2)', margin: '0 8px' }} />}
				</div>
			))}
		</div>
	)
}

// ─── CONFIRMATION ─────────────────────────────────────────────────────────────
function ConfirmationExperience() {
	return (
		<div style={{ minHeight: '100vh', background: 'var(--bf-cream)' }}>
			<header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 56px', borderBottom: '1px solid var(--bf-line)' }}>
				<Logo size={22} />
				<Stepper active={2} />
				<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-sm'>Back to menu</Link>
			</header>

			<div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 32px 56px' }}>
				<div style={{ textAlign: 'center' }}>
					<div style={{ display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: '50%', background: 'var(--bf-leaf)', color: '#fff', marginBottom: 16 }}>
						<svg width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round'><path d='M4 12l5 5L20 6' /></svg>
					</div>
					<div className='bf-eyebrow' style={{ color: 'var(--bf-leaf)' }}>ORDER CONFIRMED</div>
					<h1 style={{ fontWeight: 900, fontSize: 56, letterSpacing: '-0.035em', lineHeight: 0.92, margin: '8px 0 6px' }}>It's on the way.</h1>
					<p style={{ fontSize: 16, color: 'var(--bf-ink-2)', margin: 0 }}>
						We've sent the order to the kitchen. The rider will call when nearby.
					</p>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 18, marginTop: 32 }}>
					<div className='bf-card' style={{ padding: 22 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
							<div>
								<div className='bf-eyebrow'>ORDER</div>
								<div style={{ fontWeight: 800, fontSize: 26, marginTop: 4 }}>#BF-2841</div>
							</div>
							<div style={{ textAlign: 'right' }}>
								<div className='bf-eyebrow'>ETA</div>
								<div style={{ fontWeight: 800, fontSize: 26, color: 'var(--bf-ember)' }}>28–34 min</div>
							</div>
						</div>
						<hr className='bf-rule' />

						{/* Progress tracker */}
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', marginTop: 6 }}>
							<div style={{ position: 'absolute', top: 11, left: 16, right: 16, height: 3, background: 'var(--bf-line-2)', borderRadius: 999 }} />
							<div style={{ position: 'absolute', top: 11, left: 16, width: 'calc((100% - 32px) * 0.33)', height: 3, background: 'var(--bf-ember)', borderRadius: 999 }} />
							{(['Received', 'Preparing', 'With rider', 'Delivered'] as const).map((label, i) => (
								<div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', width: 80 }}>
									<span style={{ width: 24, height: 24, borderRadius: '50%', background: i < 2 ? 'var(--bf-ember)' : 'var(--bf-paper)', color: '#fff', boxShadow: i < 2 ? '0 0 0 4px var(--bf-cream)' : 'inset 0 0 0 1.5px var(--bf-line-2), 0 0 0 4px var(--bf-cream)', display: 'grid', placeItems: 'center' }}>
										{i < 2 && <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><path d='M4 12l5 5L20 6' /></svg>}
									</span>
									<span style={{ font: '700 11.5px var(--bf-font)', color: i < 2 ? 'var(--bf-ink)' : 'var(--bf-mute)', textAlign: 'center' }}>{label}</span>
								</div>
							))}
						</div>

						<hr className='bf-rule' />
						<div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--bf-cream-2)', borderRadius: 12, alignItems: 'center' }}>
							<div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bf-ink)', display: 'grid', placeItems: 'center', color: '#fff' }}>{Icons.bike}</div>
							<div style={{ flex: 1 }}>
								<div className='bf-eyebrow'>YOUR RIDER</div>
								<div style={{ font: '800 15px var(--bf-font)', marginTop: 2 }}>Awaiting assignment</div>
							</div>
							<button className='bf-btn bf-btn-outline bf-btn-sm' disabled style={{ opacity: 0.5 }}>{Icons.phone} Call</button>
						</div>
					</div>

					<div className='bf-card' style={{ padding: 22 }}>
						<div className='bf-eyebrow'>SUMMARY</div>
						<h3 style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>3 items · COD</h3>
						<div style={{ marginTop: 8 }}>
							<CartItemRow name='Buddy Pepperoni · M' qty={1} price={1570} tone='ember' compact />
							<CartItemRow name='Loaded Cheese Fries' qty={2} price={780} tone='amber' compact />
							<CartItemRow name='Cola 1.5L' qty={1} price={290} tone='ink' compact />
						</div>
						<hr className='bf-rule' />
						<CartTotals subtotal={2640} delivery={0} discount={120} />
						<hr className='bf-rule' />
						<div style={{ font: '600 12px var(--bf-font)', color: 'var(--bf-ink-2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
							{Icons.pin}<span>House 42, Street 18, DHA Phase 5, Sector A</span>
						</div>
					</div>
				</div>

				<div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center' }}>
					<button className='bf-btn bf-btn-ink bf-btn-md'>Track live</button>
					<Link href='/menu' className='bf-btn bf-btn-outline bf-btn-md'>Order again</Link>
					<button className='bf-btn bf-btn-ghost bf-btn-md'>Receipt</button>
				</div>
			</div>
		</div>
	)
}

export { Stepper, ConfirmationExperience }
