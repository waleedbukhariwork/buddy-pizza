'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Icons } from '../ui/icon'
import { FoodImg, type Tone } from '../ui/food-img'
import { QtyStepper } from '../ui/qty-stepper'
import { CartTotals } from '../ui/cart-totals'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'
import { useProducts, rs } from '../../lib/hooks'

// ─── Cart item row (used on confirmation page too) ────────────────────────────
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
		<div style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'center' }}>
			<FoodImg tone={tone} style={{ width: compact ? 36 : 44, height: compact ? 36 : 44, flexShrink: 0 }} />
			<div style={{ flex: 1, minWidth: 0 }}>
				<div style={{ font: '700 13.5px var(--bf-font)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
					{name}
				</div>
				<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)' }}>
					QTY {qty} · {rs(Math.round(price / qty))}
				</div>
			</div>
			<div style={{ fontWeight: 800, fontSize: 14 }} className='bf-tabular'>{rs(price)}</div>
		</div>
	)
}

// ─── Upsell row ───────────────────────────────────────────────────────────────
function UpsellRow() {
	const { data: products } = useProducts()
	const cartItems = useCartStore((s) => s.items)
	const addItem = useCartStore((s) => s.addItem)
	const token = useAuthStore((s) => s.token)
	const cartIds = new Set(cartItems.map((i) => i.productId))

	const suggestions = products
		?.filter((p) => p.isAvailable && !p.hasSizes && !cartIds.has(p.id))
		.slice(0, 3) ?? []

	if (suggestions.length === 0) return null

	return (
		<div style={{ marginTop: 16 }}>
			<div className='bf-eyebrow' style={{ marginBottom: 10, fontSize: 10 }}>
				Don't forget
			</div>
			<div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
				{suggestions.map((p) => (
					<div
						key={p.id}
						style={{
							flexShrink: 0,
							width: 130,
							background: 'var(--bf-cream)',
							border: '1px solid var(--bf-line)',
							borderRadius: 12,
							padding: 10,
							display: 'flex',
							flexDirection: 'column',
							gap: 6,
						}}
					>
						<FoodImg tone='ember' style={{ height: 52, borderRadius: 8 }} />
						<div style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontFamily: 'var(--bf-mono)', fontSize: 12, fontWeight: 700, color: 'var(--bf-ember)' }}>
								{rs(p.price)}
							</span>
							<button
								onClick={() => token && addItem({ productId: p.id, productName: p.name, price: p.price, quantity: 1 })}
								className='bf-upsell-add'
								style={{
									width: 24,
									height: 24,
									borderRadius: '50%',
									border: 0,
									background: 'var(--bf-ink)',
									color: '#fff',
									cursor: 'pointer',
									display: 'grid',
									placeItems: 'center',
								}}
							>
								{Icons.plus}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Empty cart state ─────────────────────────────────────────────────────────
function EmptyCart({ onClose }: { onClose: () => void }) {
	return (
		<div style={{ textAlign: 'center', padding: '52px 24px' }}>
			{/* Animated pizza box */}
			<div
				className='bf-float'
				style={{
					fontSize: 56,
					lineHeight: 1,
					marginBottom: 20,
					display: 'block',
				}}
			>
				🍕
			</div>
			<div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>
				Your order is empty
			</div>
			<div style={{ color: 'var(--bf-ink-2)', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
				Let's fix that
			</div>
			<Link
				href='/menu'
				onClick={onClose}
				className='bf-btn bf-btn-primary bf-btn-md'
				style={{ marginTop: 20, display: 'inline-flex' }}
			>
				Browse menu {Icons.arrow}
			</Link>
		</div>
	)
}

// ─── Cart Drawer (slide-over) ─────────────────────────────────────────────────
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
	const items = useCartStore((s) => s.items)
	const updateQuantity = useCartStore((s) => s.updateQuantity)
	const removeItem = useCartStore((s) => s.removeItem)
	const subtotal = items.reduce((s, i) => s + (i.sizePrice ?? i.price) * i.quantity, 0)

	const [promoOpen, setPromoOpen] = useState(false)
	const [promoCode, setPromoCode] = useState('')

	if (!open) return null
	return (
		<div className='bf-cart-drawer-root' onClick={onClose} role='presentation'>
			<div className='bf-cart-drawer-spacer' aria-hidden='true' />
			<aside
				className='bf-cart-drawer-panel bf-sheet-enter'
				onClick={(e) => e.stopPropagation()}
				role='dialog'
				aria-label='Your cart'
			>
				{/* ── Header ── */}
				<div style={{ padding: '8px 28px 0' }}>
					<div className='bf-drawer-handle' />
				</div>
				<div style={{
					padding: '14px 28px 18px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					borderBottom: '1px solid var(--bf-line)',
				}}>
					<div>
						<div className='bf-eyebrow'>YOUR CART</div>
						<h2 style={{ fontWeight: 800, fontSize: 24, margin: '4px 0 0' }}>
							{items.reduce((s, i) => s + i.quantity, 0)} items
						</h2>
					</div>
					<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={onClose}>
						{Icons.x}
					</button>
				</div>

				{/* ── Body ── */}
				<div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }} className='bf-scroll'>
					{items.length === 0 ? (
						<EmptyCart onClose={onClose} />
					) : (
						<>
							{items.map((it, i) => {
								const unitPrice = it.sizePrice ?? it.price
								const isDeal = it.dealId != null
								const dealLines = isDeal ? (it.customizations ?? '').split('\n').filter(Boolean) : []
								return (
									<div
										key={isDeal ? `deal-${it.dealId}` : `${it.productId}-${it.size ?? 'base'}`}
										className='bf-item-enter'
										style={{
											display: 'flex',
											gap: 12,
											padding: '14px 0',
											borderBottom: i < items.length - 1 ? '1px solid var(--bf-line)' : 'none',
											animationDelay: `${i * 40}ms`,
										}}
									>
										<FoodImg tone={isDeal ? 'amber' : 'ember'} style={{ width: 72, height: 72, flexShrink: 0 }} />
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
												{isDeal && (
													<span className='bf-pill' style={{ background: 'var(--bf-amber)', color: '#7a3e00', fontSize: 9.5, padding: '2px 7px', boxShadow: 'none' }}>
														DEAL
													</span>
												)}
												<div style={{ font: '800 14px var(--bf-font)' }}>{it.productName}</div>
											</div>
											{it.size && (
												<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-ember)', marginTop: 2 }}>{it.size}</div>
											)}
											{dealLines.length > 0 && (
												<ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none' }}>
													{dealLines.map((line, li) => (
														<li key={li} style={{ fontSize: 11, color: 'var(--bf-ink-2)', lineHeight: 1.6 }}>· {line}</li>
													))}
												</ul>
											)}
											<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 4 }}>
												{rs(unitPrice)} each
											</div>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
												<QtyStepper
													value={it.quantity}
													onChange={(v) => updateQuantity(it.productId, v, it.size, it.dealId)}
													sm
												/>
												<span style={{ fontWeight: 800, fontSize: 15 }} className='bf-tabular'>
													{rs(unitPrice * it.quantity)}
												</span>
											</div>
										</div>
										<button
											className='bf-btn bf-btn-ghost bf-btn-icon'
											onClick={() => removeItem(it.productId, it.size, it.dealId)}
											style={{ width: 28, height: 28, color: 'var(--bf-mute)', flexShrink: 0 }}
										>
											{Icons.x}
										</button>
									</div>
								)
							})}

							{/* Upsell suggestions */}
							<UpsellRow />

							{/* Promo code — collapsed by default */}
							<div style={{ marginTop: 18 }}>
								{!promoOpen ? (
									<button
										onClick={() => setPromoOpen(true)}
										style={{
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											font: '600 12.5px var(--bf-font)',
											color: 'var(--bf-ink-2)',
											padding: 0,
											textDecoration: 'underline',
											textUnderlineOffset: 2,
										}}
									>
										Have a promo code?
									</button>
								) : (
									<div style={{ display: 'flex', gap: 8 }}>
										<input
											className='bf-input'
											placeholder='Enter promo code'
											value={promoCode}
											onChange={(e) => setPromoCode(e.target.value)}
											style={{ flex: 1 }}
											autoFocus
										/>
										<button className='bf-btn bf-btn-outline bf-btn-md'>Apply</button>
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* ── Footer (only when cart has items) ── */}
				{items.length > 0 && (
					<div style={{ padding: '20px 28px', borderTop: '1px solid var(--bf-line)', background: 'var(--bf-cream-2)' }}>
						<CartTotals subtotal={subtotal} />
						<Link
							href='/checkout'
							onClick={onClose}
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{ width: '100%', marginTop: 14, justifyContent: 'space-between' }}
						>
							<span>Go to checkout</span>
							<span>{rs(subtotal)} {Icons.arrow}</span>
						</Link>
					</div>
				)}
			</aside>
		</div>
	)
}

export { CartDrawer, CartItemRow }
