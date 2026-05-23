'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerShell } from '../layout/customer-shell'
import { FoodImg, type Tone } from '../ui/food-img'
import { RelatedProductsRow } from '../product/related-products-row'
import { HotBadge } from '../ui/hot-badge'
import { Icons } from '../ui/icon'
import { rs, useProducts, type Product } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSizeOptions(p: Product): { label: string; price: number }[] {
	if (!p.hasSizes) return []
	if (p.priceSmall && p.priceMedium && p.priceLarge)
		return [
			{ label: 'Small (6")', price: p.priceSmall },
			{ label: 'Medium (9")', price: p.priceMedium },
			{ label: 'Large (12")', price: p.priceLarge },
		]
	if (p.priceSmall && p.priceMedium)
		return [
			{ label: 'Half', price: p.priceSmall },
			{ label: 'Full', price: p.priceMedium },
		]
	return []
}

const TONES: Tone[] = ['ember', 'amber', 'cream']
const CIRCLE_PX = [22, 30, 40] // visual size indicator diameters

// ─── Inline size radio cards ──────────────────────────────────────────────────
function SizeSelector({
	sizes,
	selected,
	onChange,
}: {
	sizes: { label: string; price: number }[]
	selected: number
	onChange: (i: number) => void
}) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
			{sizes.map((s, i) => {
				const active = selected === i
				const isBest = sizes.length === 3 && i === 1
				const circlePx = CIRCLE_PX[Math.min(i, 2)]
				return (
					<button
						key={s.label}
						onClick={() => onChange(i)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							padding: '13px 16px',
							borderRadius: 14,
							border: `2px solid ${active ? 'var(--bf-ember)' : 'var(--bf-line-2)'}`,
							background: active ? 'var(--bf-ember-08)' : 'var(--bf-paper)',
							cursor: 'pointer',
							fontFamily: 'var(--bf-font)',
							textAlign: 'left',
							transition: 'border-color 0.14s, background 0.14s',
						}}
					>
						{/* Radio dot */}
						<div
							style={{
								width: 18,
								height: 18,
								borderRadius: '50%',
								border: `2px solid ${active ? 'var(--bf-ember)' : 'var(--bf-line-2)'}`,
								display: 'grid',
								placeItems: 'center',
								flexShrink: 0,
								transition: 'border-color 0.14s',
							}}
						>
							{active && (
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: '50%',
										background: 'var(--bf-ember)',
									}}
								/>
							)}
						</div>

						{/* Visual pizza circle */}
						<div
							style={{
								width: 44,
								display: 'flex',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<div
								style={{
									width: circlePx,
									height: circlePx,
									borderRadius: '50%',
									border: `2.5px solid ${active ? 'var(--bf-ember)' : 'var(--bf-line-2)'}`,
									transition: 'border-color 0.14s',
								}}
							/>
						</div>

						{/* Label + badge */}
						<div style={{ flex: 1 }}>
							<span style={{ fontSize: 15, fontWeight: 800, color: 'var(--bf-ink)' }}>
								{s.label}
							</span>
							{isBest && (
								<span
									className='bf-pill'
									style={{
										marginLeft: 8,
										background: 'var(--bf-amber)',
										color: 'var(--bf-ink)',
										boxShadow: 'none',
										fontSize: 9,
										padding: '2px 8px',
									}}
								>
									BEST VALUE
								</span>
							)}
						</div>

						<span
							style={{
								fontWeight: 800,
								fontSize: 15,
								fontFamily: 'var(--bf-mono)',
								color: active ? 'var(--bf-ember)' : 'var(--bf-ink)',
								transition: 'color 0.14s',
							}}
						>
							{rs(s.price)}
						</span>
					</button>
				)
			})}
		</div>
	)
}

// ─── Large quantity stepper (ink) ─────────────────────────────────────────────
function QtyControl({
	qty,
	onChange,
}: {
	qty: number
	onChange: (n: number) => void
}) {
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				background: 'var(--bf-ink)',
				borderRadius: 999,
				boxShadow: '0 3px 10px rgba(35,31,32,0.18)',
			}}
		>
			<button
				onClick={() => onChange(Math.max(1, qty - 1))}
				style={{
					width: 44,
					height: 44,
					border: 0,
					background: 'transparent',
					color: '#fff',
					cursor: 'pointer',
					display: 'grid',
					placeItems: 'center',
					borderRadius: '999px 0 0 999px',
				}}
			>
				{Icons.minus}
			</button>
			<span
				style={{
					minWidth: 40,
					textAlign: 'center',
					font: '800 18px var(--bf-font)',
					color: '#fff',
				}}
				className='bf-tabular'
			>
				{qty}
			</span>
			<button
				onClick={() => onChange(qty + 1)}
				style={{
					width: 44,
					height: 44,
					border: 0,
					background: 'transparent',
					color: '#fff',
					cursor: 'pointer',
					display: 'grid',
					placeItems: 'center',
					borderRadius: '0 999px 999px 0',
				}}
			>
				{Icons.plus}
			</button>
		</div>
	)
}

// ─── Trust strip ──────────────────────────────────────────────────────────────
function TrustStrip() {
	return (
		<div className='bf-pd-trust-strip'>
			<div className='bf-pd-trust-item'>
				{Icons.clock}
				<span>25–35 min</span>
			</div>
			<div className='bf-pd-trust-item'>
				{Icons.truck}
				<span>Free above Rs 500</span>
			</div>
			<div className='bf-pd-trust-item'>
				{Icons.check}
				<span>Fresh made</span>
			</div>
		</div>
	)
}

// ─── Skeleton loading state ───────────────────────────────────────────────────
function Skel({ h, w, style }: { h: number; w?: number | string; style?: React.CSSProperties }) {
	return (
		<div
			className='bf-skeleton'
			style={{ height: h, width: w, borderRadius: 12, ...style }}
		/>
	)
}

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
function ProductDetailPage({ productId }: { productId: number }) {
	const router = useRouter()
	const { data: products, isLoading } = useProducts()
	const addItem = useCartStore((s) => s.addItem)
	const token = useAuthStore((s) => s.token)

	const product = products?.find((p) => p.id === productId)
	const sizes = product ? getSizeOptions(product) : []
	const hasSizes = sizes.length > 0

	const [selectedSize, setSelectedSize] = useState(0)
	const [qty, setQty] = useState(1)
	const [showNote, setShowNote] = useState(false)
	const [note, setNote] = useState('')
	const [addState, setAddState] = useState<'idle' | 'added'>('idle')

	// Default to "Medium" (best value) when sizes load
	useEffect(() => {
		if (sizes.length > 1) setSelectedSize(1)
	}, [sizes.length])

	const activeSize = hasSizes ? sizes[selectedSize] : null
	const unitPrice = activeSize ? activeSize.price : (product?.price ?? 0)
	const lineTotal = unitPrice * qty

	// Same-category related items, max 8
	const related = useMemo(() => {
		if (!products || !product) return []
		return products
			.filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isAvailable)
			.slice(0, 8)
	}, [products, product])

	function handleAdd() {
		if (!product || !product.isAvailable) return
		if (!token) {
			router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		addItem({
			productId: product.id,
			productName: product.name,
			price: product.price,
			quantity: qty,
			size: activeSize?.label,
			sizePrice: activeSize?.price,
			customizations: note.trim() || undefined,
		})
		setAddState('added')
		setTimeout(() => setAddState('idle'), 2200)
	}

	// ── Loading ──
	if (isLoading) {
		return (
			<CustomerShell>
				<div className='bf-pd-wrap'>
					<Skel h={18} w={80} style={{ marginBottom: 24 }} />
					<div className='bf-pd-layout'>
						<Skel h={420} style={{ borderRadius: 22 }} />
						<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
							<Skel h={12} w={100} />
							<Skel h={52} w='80%' />
							<Skel h={34} w={120} />
							<Skel h={18} />
							<Skel h={60} />
							{[1, 2, 3].map((i) => (
								<Skel key={i} h={66} />
							))}
							<Skel h={54} style={{ marginTop: 4 }} />
						</div>
					</div>
				</div>
			</CustomerShell>
		)
	}

	// ── 404 ──
	if (!product) {
		return (
			<CustomerShell>
				<div style={{ padding: '80px 20px', textAlign: 'center' }}>
					<div style={{ fontSize: 52, marginBottom: 16 }}>🍕</div>
					<div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>
						Item not found
					</div>
					<div style={{ color: 'var(--bf-ink-2)', fontSize: 14, marginTop: 8 }}>
						This item may have been removed or is temporarily unavailable.
					</div>
					<button
						onClick={() => router.back()}
						className='bf-btn bf-btn-outline bf-btn-md'
						style={{ marginTop: 20 }}
					>
						← Back to menu
					</button>
				</div>
			</CustomerShell>
		)
	}

	const tone: Tone = TONES[productId % TONES.length]
	const isAdded = addState === 'added'

	return (
		<CustomerShell>
			<main>
				<div className='bf-pd-wrap'>
					{/* ── Back nav ── */}
					<button
						onClick={() => router.back()}
						className='bf-btn bf-btn-ghost bf-btn-sm'
						style={{ gap: 5, paddingLeft: 2, marginBottom: 20, color: 'var(--bf-ink-2)' }}
					>
						<svg
							width={16}
							height={16}
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth={2}
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M19 12H5M12 5l-7 7 7 7' />
						</svg>
						Back
					</button>

					{/* ── 2-col layout ── */}
					<div className='bf-pd-layout'>
						{/* LEFT: sticky image panel */}
						<div className='bf-pd-image-col bf-fade-up'>
							{product.imageUrl ? (
								<img src={product.imageUrl} alt={product.name} className='bf-pd-hero-img' style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22 }} />
							) : (
								<FoodImg
									tone={tone}
									caption={product.name.toLowerCase()}
									className='bf-pd-hero-img'
								/>
							)}
							<TrustStrip />
						</div>

						{/* RIGHT: detail panel */}
						<div className='bf-pd-detail-col bf-fade-up-1'>
							{/* Category + badges */}
							<div
								style={{
									display: 'flex',
									gap: 8,
									alignItems: 'center',
									marginBottom: 10,
									flexWrap: 'wrap',
								}}
							>
								{product.category && (
									<span className='bf-eyebrow' style={{ color: 'var(--bf-mute)' }}>
										{product.category}
									</span>
								)}
								{product.isHot && <HotBadge />}
								{!product.isAvailable && (
									<span
										className='bf-pill'
										style={{
											background: 'var(--bf-error)',
											color: '#fff',
											boxShadow: 'none',
											fontSize: 9,
										}}
									>
										UNAVAILABLE
									</span>
								)}
							</div>

							{/* Name */}
							<h1
								style={{
									fontWeight: 900,
									fontSize: 36,
									letterSpacing: '-0.03em',
									lineHeight: 1.04,
									marginBottom: 12,
								}}
							>
								{product.name}
							</h1>

							{/* Dynamic price */}
							<div
								style={{
									display: 'flex',
									alignItems: 'baseline',
									gap: 10,
									marginBottom: 14,
								}}
							>
								<span
									style={{
										fontWeight: 800,
										fontSize: 30,
										color: 'var(--bf-ember)',
										fontFamily: 'var(--bf-mono)',
										letterSpacing: '-0.02em',
										transition: 'color 0.2s',
									}}
								>
									{rs(lineTotal)}
								</span>
								{qty > 1 && (
									<span
										style={{
											fontSize: 12.5,
											color: 'var(--bf-mute)',
											fontFamily: 'var(--bf-mono)',
										}}
									>
										{rs(unitPrice)} each
									</span>
								)}
							</div>

							{/* Description */}
							{product.description && (
								<p
									style={{
										fontSize: 14.5,
										lineHeight: 1.65,
										color: 'var(--bf-ink-2)',
										marginBottom: 20,
										maxWidth: 400,
									}}
								>
									{product.description}
								</p>
							)}

							<hr className='bf-rule' style={{ marginBottom: 20 }} />

							{/* Size selection */}
							{hasSizes && (
								<div style={{ marginBottom: 22 }}>
									<div
										style={{
											fontWeight: 700,
											fontSize: 11.5,
											letterSpacing: '0.08em',
											color: 'var(--bf-ink-2)',
											marginBottom: 12,
											textTransform: 'uppercase',
											fontFamily: 'var(--bf-mono)',
										}}
									>
										Choose size
									</div>
									<SizeSelector
										sizes={sizes}
										selected={selectedSize}
										onChange={setSelectedSize}
									/>
								</div>
							)}

							{/* Quantity */}
							<div style={{ marginBottom: 22 }}>
								<div
									style={{
										fontWeight: 700,
										fontSize: 11.5,
										letterSpacing: '0.08em',
										color: 'var(--bf-ink-2)',
										marginBottom: 12,
										textTransform: 'uppercase',
										fontFamily: 'var(--bf-mono)',
									}}
								>
									Quantity
								</div>
								<QtyControl qty={qty} onChange={setQty} />
							</div>

							{/* Special instructions */}
							<div style={{ marginBottom: 24 }}>
								<button
									onClick={() => setShowNote((v) => !v)}
									className='bf-btn bf-btn-ghost bf-btn-sm'
									style={{
										padding: '4px 0',
										color: 'var(--bf-ink-2)',
										fontWeight: 600,
										gap: 6,
										fontSize: 13,
									}}
								>
									{showNote ? (
										<svg
											width={14}
											height={14}
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth={2}
											strokeLinecap='round'
											strokeLinejoin='round'
										>
											<path d='M6 9l6 6 6-6' />
										</svg>
									) : (
										Icons.plus
									)}
									{showNote ? 'Hide special request' : 'Add special request'}
								</button>
								{showNote && (
									<textarea
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder='e.g. extra spicy, no onions, well-done crust…'
										rows={3}
										className='bf-input'
										style={{
											marginTop: 10,
											resize: 'none',
											fontSize: 13.5,
											lineHeight: 1.55,
										}}
									/>
								)}
							</div>

							{/* Desktop CTA — hidden on mobile */}
							<button
								className='bf-btn bf-btn-primary bf-btn-lg bf-pd-cta-desktop'
								style={{
									width: '100%',
									justifyContent: 'space-between',
									padding: '16px 22px',
									fontSize: 15,
									...(isAdded
										? {
												background: 'var(--bf-leaf)',
												boxShadow:
													'0 2px 0 #1e6535, 0 6px 14px rgba(47,143,78,0.32)',
											}
										: {}),
								}}
								onClick={handleAdd}
								disabled={!product.isAvailable}
							>
								<span>
									{isAdded ? 'Added to cart ✓' : product.isAvailable ? 'Add to cart' : 'Unavailable'}
								</span>
								{!isAdded && product.isAvailable && (
									<span style={{ fontFamily: 'var(--bf-mono)', fontWeight: 800 }}>
										{rs(lineTotal)} {Icons.arrow}
									</span>
								)}
							</button>
						</div>
					</div>

					{related.length > 0 && (
						<div className='bf-fade-up-2'>
							<RelatedProductsRow title={product.category} products={related} />
						</div>
					)}
				</div>

				{/* ── Mobile sticky bottom CTA ── */}
				<div className='bf-pd-mobile-bar'>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: 10,
						}}
					>
						<span
							style={{
								fontWeight: 700,
								fontSize: 13,
								color: 'var(--bf-ink-2)',
							}}
						>
							{qty} × {rs(unitPrice)}
						</span>
						<span
							style={{
								fontWeight: 800,
								fontSize: 18,
								fontFamily: 'var(--bf-mono)',
								color: 'var(--bf-ember)',
							}}
						>
							{rs(lineTotal)}
						</span>
					</div>
					<button
						className='bf-btn bf-btn-primary bf-btn-lg'
						style={{
							width: '100%',
							justifyContent: 'center',
							...(isAdded
								? {
										background: 'var(--bf-leaf)',
										boxShadow: '0 2px 0 #1e6535, 0 6px 14px rgba(47,143,78,0.32)',
									}
								: {}),
						}}
						onClick={handleAdd}
						disabled={!product.isAvailable}
					>
						{isAdded ? 'Added to cart ✓' : product.isAvailable ? 'Add to cart' : 'Unavailable'}
					</button>
				</div>
			</main>
		</CustomerShell>
	)
}

export { ProductDetailPage }
