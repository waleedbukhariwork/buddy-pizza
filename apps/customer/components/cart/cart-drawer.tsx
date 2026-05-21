'use client'
import React from 'react'
import Link from 'next/link'
import { Icons } from '../ui/icon'
import { FoodImg, type Tone } from '../ui/food-img'
import { QtyStepper } from '../ui/qty-stepper'
import { CartTotals } from '../ui/cart-totals'
import { useCartStore } from '../../lib/cart-store'
import { rs } from '../../lib/hooks'

// ─── Cart item row ────────────────────────────────────────────────────────────
function CartItemRow({
	name,
	qty,
	price,
	tone = 'cream',
	compact,
}: {
	name: string
	qty: number
	price: number
	tone?: Tone
	compact?: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 10,
				padding: '8px 0',
				alignItems: 'center',
			}}
		>
			<FoodImg
				tone={tone}
				style={{
					width: compact ? 36 : 44,
					height: compact ? 36 : 44,
					flexShrink: 0,
				}}
			/>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						font: '700 13.5px var(--bf-font)',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{name}
				</div>
				<div
					className='bf-mono'
					style={{ fontSize: 11, color: 'var(--bf-mute)' }}
				>
					QTY {qty} · {rs(Math.round(price / qty))}
				</div>
			</div>
			<div style={{ fontWeight: 800, fontSize: 14 }} className='bf-tabular'>
				{rs(price)}
			</div>
		</div>
	)
}

// ─── Cart Drawer (slide-over) ─────────────────────────────────────────────────
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
	const items = useCartStore((s) => s.items)
	const updateQuantity = useCartStore((s) => s.updateQuantity)
	const removeItem = useCartStore((s) => s.removeItem)
	const subtotal = items.reduce((s, i) => s + (i.sizePrice ?? i.price) * i.quantity, 0)

	if (!open) return null
	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				background: 'rgba(35,31,32,.45)',
				zIndex: 50,
				display: 'flex',
			}}
			onClick={onClose}
		>
			<div style={{ flex: 1 }} />
			<aside
				style={{
					width: 460,
					background: 'var(--bf-paper)',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: 'var(--bf-shadow-lg)',
					maxWidth: '100vw',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					style={{
						padding: '24px 28px 18px',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						borderBottom: '1px solid var(--bf-line)',
					}}
				>
					<div>
						<div className='bf-eyebrow'>YOUR CART</div>
						<h2 style={{ fontWeight: 800, fontSize: 24, margin: '4px 0 0' }}>
							{items.reduce((s, i) => s + i.quantity, 0)} items
						</h2>
					</div>
					<button
						className='bf-btn bf-btn-outline bf-btn-icon'
						onClick={onClose}
					>
						{Icons.x}
					</button>
				</div>

				<div
					style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}
					className='bf-scroll'
				>
					{items.length === 0 ? (
						<p
							style={{
								color: 'var(--bf-ink-2)',
								fontSize: 14,
								textAlign: 'center',
								padding: '40px 0',
							}}
						>
							Your cart is empty.
						</p>
					) : (
						items.map((it, i) => {
							const linePrice = it.sizePrice ?? it.price
							return (
							<div
								key={`${it.productId}-${it.size ?? 'base'}`}
								style={{
									display: 'flex',
									gap: 12,
									padding: '14px 0',
									borderBottom:
										i < items.length - 1 ? '1px solid var(--bf-line)' : 'none',
								}}
							>
								<FoodImg
									tone='ember'
									style={{ width: 72, height: 72, flexShrink: 0 }}
								/>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ font: '800 14px var(--bf-font)' }}>
										{it.productName}
									</div>
									<div
										className='bf-mono'
										style={{
											fontSize: 11,
											color: 'var(--bf-mute)',
											marginTop: 2,
										}}
									>
										{it.size && <span style={{ color: 'var(--bf-ember)', marginRight: 6 }}>{it.size}</span>}
										{rs(linePrice)} each
									</div>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginTop: 8,
										}}
									>
										<QtyStepper
											value={it.quantity}
											onChange={(v) => updateQuantity(it.productId, v, it.size)}
											sm
										/>
										<span
											style={{ fontWeight: 800, fontSize: 15 }}
											className='bf-tabular'
										>
											{rs(linePrice * it.quantity)}
										</span>
									</div>
								</div>
								<button
									className='bf-btn bf-btn-ghost bf-btn-icon'
									onClick={() => removeItem(it.productId, it.size)}
									style={{ width: 28, height: 28, color: 'var(--bf-ember)' }}
								>
									{Icons.x}
								</button>
							</div>
							)
						})
					)}

					{/* Promo code */}
					<div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
						<input
							className='bf-input'
							placeholder='Promo code'
							style={{ flex: 1 }}
						/>
						<button className='bf-btn bf-btn-outline bf-btn-md'>Apply</button>
					</div>
				</div>

				<div
					style={{
						padding: '20px 28px',
						borderTop: '1px solid var(--bf-line)',
						background: 'var(--bf-cream-2)',
					}}
				>
					<CartTotals subtotal={subtotal} />
					<Link
						href='/checkout'
						onClick={onClose}
						className='bf-btn bf-btn-primary bf-btn-lg'
						style={{
							width: '100%',
							marginTop: 14,
							justifyContent: 'space-between',
						}}
					>
						<span>Go to checkout</span>
						<span>{rs(subtotal)} {Icons.arrow}</span>
					</Link>
				</div>
			</aside>
		</div>
	)
}

export { CartDrawer, CartItemRow }
