'use client'
import React from 'react'
import Link from 'next/link'

import { Logo } from '../ui/logo'
import { Icons } from '../ui/icon'
import { CartTotals } from '../ui/cart-totals'
import { FoodImg } from '../ui/food-img'
import { Stepper } from './confirmation'
import { useCartStore } from '../../lib/cart-store'
import { rs } from '../../lib/hooks'

// ─── Pay option ───────────────────────────────────────────────────────────────
function PayOpt({
	icon,
	label,
	sub,
	active,
	disabled,
}: {
	icon: React.ReactNode
	label: string
	sub: string
	active?: boolean
	disabled?: boolean
}) {
	return (
		<label
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 14,
				padding: '14px 16px',
				borderRadius: 12,
				border:
					'1.5px solid ' + (active ? 'var(--bf-ink)' : 'var(--bf-line-2)'),
				background: active ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
				opacity: disabled ? 0.55 : 1,
				cursor: disabled ? 'not-allowed' : 'pointer',
			}}
		>
			<span
				style={{
					width: 36,
					height: 36,
					borderRadius: 10,
					background: active ? 'var(--bf-ink)' : 'var(--bf-cream-2)',
					color: active ? '#fff' : 'var(--bf-ink)',
					display: 'grid',
					placeItems: 'center',
				}}
			>
				{icon}
			</span>
			<div style={{ flex: 1 }}>
				<div
					style={{
						font: '700 14.5px var(--bf-font)',
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					{label}
					{disabled && (
						<span
							className='bf-pill'
							style={{ fontSize: 9, padding: '2px 6px' }}
						>
							SOON
						</span>
					)}
				</div>
				<div style={{ fontSize: 12, color: 'var(--bf-ink-2)', marginTop: 2 }}>
					{sub}
				</div>
			</div>
			<span
				style={{
					width: 20,
					height: 20,
					borderRadius: '50%',
					boxShadow:
						'inset 0 0 0 1.5px ' +
						(active ? 'var(--bf-ink)' : 'var(--bf-line-2)'),
					background: active ? 'var(--bf-ink)' : 'transparent',
					position: 'relative',
					display: 'inline-block',
				}}
			>
				{active && (
					<span
						style={{
							position: 'absolute',
							inset: 5,
							borderRadius: '50%',
							background: '#fff',
						}}
					/>
				)}
			</span>
		</label>
	)
}

// ─── Section header (numbered) ────────────────────────────────────────────────
function SectionHeader({ n, title }: { n: string; title: string }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'baseline',
				gap: 10,
				marginBottom: 14,
			}}
		>
			<span
				className='bf-mono'
				style={{
					fontSize: 11,
					color: 'var(--bf-mute)',
					letterSpacing: '.08em',
				}}
			>
				{n}
			</span>
			<h3
				style={{
					fontWeight: 700,
					fontSize: 20,
					margin: 0,
					letterSpacing: '-0.018em',
				}}
			>
				{title}
			</h3>
		</div>
	)
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────
function CheckoutExperience() {
	const items = useCartStore((s) => s.items)
	const removeItem = useCartStore((s) => s.removeItem)
	const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

	return (
		<div style={{ minHeight: '100vh', background: 'var(--bf-cream)' }}>
			<header
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '18px 56px',
					borderBottom: '1px solid var(--bf-line)',
				}}
			>
				<Logo size={22} />
				<Stepper active={1} />
				<div
					style={{
						display: 'flex',
						gap: 6,
						alignItems: 'center',
						font: '500 13px var(--bf-font)',
						color: 'var(--bf-ink-2)',
					}}
				>
					{Icons.clock} ETA 28–34 min
				</div>
			</header>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: '1fr 420px',
					gap: 0,
					padding: '32px 56px 56px',
					maxWidth: 1280,
					margin: '0 auto',
				}}
			>
				<div
					style={{
						paddingRight: 40,
						display: 'flex',
						flexDirection: 'column',
						gap: 22,
					}}
				>
					<h1
						style={{
							fontWeight: 800,
							fontSize: 40,
							margin: 0,
							letterSpacing: '-0.028em',
						}}
					>
						Checkout
					</h1>

					{/* Delivery */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='01' title='Delivery address' />
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: 14,
							}}
						>
							<div>
								<label className='bf-label'>Full name</label>
								<input className='bf-input' />
							</div>
							<div>
								<label className='bf-label'>Phone</label>
								<input className='bf-input' />
							</div>
							<div style={{ gridColumn: 'span 2' }}>
								<label className='bf-label'>House / flat #</label>
								<input
									className='bf-input'
									defaultValue='House 42, Street 18'
								/>
							</div>
							<div style={{ gridColumn: 'span 2' }}>
								<label className='bf-label'>Area</label>
								<input
									className='bf-input'
									defaultValue='DHA Phase 5, Sector A'
								/>
							</div>
							<div style={{ gridColumn: 'span 2' }}>
								<label className='bf-label'>Landmark (optional)</label>
								<input className='bf-input' placeholder='Near Khaadi' />
							</div>
						</div>
						<div
							style={{
								marginTop: 12,
								padding: 12,
								borderRadius: 10,
								background: 'var(--bf-cream-2)',
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								font: '500 13px var(--bf-font)',
							}}
						>
							{Icons.pin}
							<span>
								<strong>Inside delivery zone.</strong> Free delivery, ETA 28–34
								min.
							</span>
						</div>
					</section>

					{/* Order updates */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='02' title='Order updates' />
						<div style={{ display: 'flex', gap: 10 }}>
							{['SMS', 'WhatsApp', 'Call only'].map((l, i) => (
								<button
									key={l}
									style={{
										flex: 1,
										padding: '12px 8px',
										borderRadius: 12,
										border:
											'1.5px solid ' +
											(i === 0 ? 'var(--bf-ink)' : 'var(--bf-line-2)'),
										background:
											i === 0 ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
										cursor: 'pointer',
										font: '700 14px var(--bf-font)',
										color: 'var(--bf-ink)',
									}}
								>
									{l}
								</button>
							))}
						</div>
					</section>

					{/* Payment */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='03' title='Payment' />
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<PayOpt
								icon={Icons.cash}
								label='Cash on delivery'
								sub='Pay the rider in cash. Exact change appreciated.'
								active
							/>
							<PayOpt
								icon={Icons.card}
								label='Card'
								sub={"Coming soon · We're integrating a payment processor."}
								disabled
							/>
							<PayOpt
								icon={Icons.phone}
								label='EasyPaisa / JazzCash'
								sub='Coming soon'
								disabled
							/>
						</div>
					</section>

					{/* Delivery time */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='04' title='Delivery time' />
						<div style={{ display: 'flex', gap: 10 }}>
							{['ASAP', 'Schedule'].map((l, i) => (
								<button
									key={l}
									style={{
										flex: 1,
										padding: '12px 8px',
										borderRadius: 12,
										border:
											'1.5px solid ' +
											(i === 0 ? 'var(--bf-ink)' : 'var(--bf-line-2)'),
										background:
											i === 0 ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
										cursor: 'pointer',
										font: '700 14px var(--bf-font)',
										color: 'var(--bf-ink)',
									}}
								>
									{l}
									<br />
									<span
										className='bf-mono'
										style={{ fontSize: 10.5, color: 'var(--bf-mute)' }}
									>
										{i === 0 ? '28–34 min' : 'Pick a time'}
									</span>
								</button>
							))}
						</div>
					</section>
				</div>

				{/* Order summary */}
				<aside>
					<div
						className='bf-card'
						style={{ padding: 22, position: 'sticky', top: 20 }}
					>
						<h3 style={{ fontWeight: 700, fontSize: 18, margin: '0 0 14px' }}>
							Order summary
						</h3>
						{items.length === 0 ? (
							<p style={{ fontSize: 13, color: 'var(--bf-ink-2)' }}>
								Your cart is empty.
							</p>
						) : (
							items.map((it) => (
								<div
									key={it.productId}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 10,
										padding: '8px 0',
										borderBottom: '1px solid var(--bf-line)',
									}}
								>
									<FoodImg
										tone='ember'
										style={{ width: 36, height: 36, flexShrink: 0 }}
									/>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												font: '700 13px var(--bf-font)',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{it.productName}
										</div>
										<div
											className='bf-mono'
											style={{ fontSize: 11, color: 'var(--bf-mute)' }}
										>
											QTY {it.quantity}
										</div>
									</div>
									<span style={{ fontWeight: 800, fontSize: 14 }}>
										{rs(it.price * it.quantity)}
									</span>
									<button
										className='bf-btn bf-btn-ghost bf-btn-icon'
										onClick={() => removeItem(it.productId)}
										style={{ width: 24, height: 24, color: 'var(--bf-ember)' }}
									>
										{Icons.x}
									</button>
								</div>
							))
						)}
						<hr className='bf-rule' />
						<CartTotals subtotal={subtotal} />
						<Link
							href='/confirmation'
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{
								width: '100%',
								marginTop: 18,
								justifyContent: 'space-between',
							}}
						>
							<span>Place order</span>
							<span>
								{rs(subtotal)} {Icons.arrow}
							</span>
						</Link>
						<div
							style={{
								marginTop: 12,
								font: '500 11.5px var(--bf-font)',
								color: 'var(--bf-mute)',
								textAlign: 'center',
								lineHeight: 1.5,
							}}
						>
							By placing this order you agree to our terms.
							<br />
							Cash payable to rider on arrival.
						</div>
					</div>
				</aside>
			</div>
		</div>
	)
}

export { CheckoutExperience }
