'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { FoodImg, type Tone } from '../ui/food-img'
import { HotBadge } from '../ui/hot-badge'
import { Icons } from '../ui/icon'
import { useCartStore } from '../../lib/cart-store'
import { rs, type Product } from '../../lib/hooks'

// ─── Animated checkmark icon ──────────────────────────────────────────────────
function CheckIcon() {
	return (
		<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={3.5} strokeLinecap='round' strokeLinejoin='round'>
			<polyline points='20 6 9 17 4 12' className='bf-check-stroke' />
		</svg>
	)
}

// ─── Size option helper ────────────────────────────────────────────────────────
function getSizeOptions(item: Product): { label: string; price: number }[] {
	if (!item.hasSizes) return []
	if (item.priceSmall && item.priceMedium && item.priceLarge) {
		return [
			{ label: 'Small (6")', price: item.priceSmall },
			{ label: 'Medium (9")', price: item.priceMedium },
			{ label: 'Large (12")', price: item.priceLarge },
		]
	}
	if (item.priceSmall && item.priceMedium) {
		return [
			{ label: 'Half', price: item.priceSmall },
			{ label: 'Full', price: item.priceMedium },
		]
	}
	return []
}

// ─── Size picker — portalled bottom sheet ────────────────────────────────────
function SizePicker({
	sizes,
	onPick,
	onClose,
}: {
	sizes: { label: string; price: number }[]
	onPick: (size: string, price: number) => void
	onClose: () => void
}) {
	const [mounted, setMounted] = useState(false)
	const [selected, setSelected] = useState(sizes.length > 1 ? 1 : 0)
	const [confirmed, setConfirmed] = useState(false)
	useEffect(() => { setMounted(true) }, [])
	if (!mounted) return null

	function handleConfirm() {
		if (confirmed) return
		onPick(sizes[selected].label, sizes[selected].price)
		setConfirmed(true)
		setTimeout(() => onClose(), 750)
	}

	const CIRCLE_SIZES = [20, 28, 38] // visual size indicators per option

	return createPortal(
		<>
			<div className='bf-sheet-backdrop' onClick={onClose} />
			<div className='bf-sheet bf-sheet-enter'>
				<div style={{ padding: '0 0 6px' }}>
					<div className='bf-drawer-handle' />
				</div>
				<div style={{ padding: '14px 22px 36px' }}>
					<div
						className='bf-eyebrow'
						style={{ marginBottom: 16, color: 'var(--bf-ink-2)' }}
					>
						Choose size
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
						{sizes.map((s, i) => {
							const isSelected = selected === i
							const isBestVal = sizes.length === 3 && i === 1
							const circleSize = CIRCLE_SIZES[Math.min(i, 2)]
							return (
								<button
									key={s.label}
									onClick={() => setSelected(i)}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 16,
										padding: '14px 16px',
										borderRadius: 14,
										border: `2px solid ${isSelected ? 'var(--bf-ink)' : 'var(--bf-line-2)'}`,
										background: isSelected ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
										cursor: 'pointer',
										fontFamily: 'var(--bf-font)',
										transition: 'border-color 0.15s, background 0.15s',
									}}
								>
									{/* Visual size circle */}
									<div style={{ width: 40, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
										<div style={{
											width: circleSize,
											height: circleSize,
											borderRadius: '50%',
											border: `2.5px solid ${isSelected ? 'var(--bf-ink)' : 'var(--bf-line-2)'}`,
											transition: 'border-color 0.15s',
										}} />
									</div>
									<div style={{ flex: 1, textAlign: 'left' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<span style={{ fontSize: 15, fontWeight: 800, color: 'var(--bf-ink)' }}>
												{s.label}
											</span>
											{isBestVal && (
												<span className='bf-pill' style={{
													background: 'var(--bf-amber)',
													color: 'var(--bf-ink)',
													boxShadow: 'none',
													fontSize: 9,
													padding: '2px 8px',
												}}>
													BEST VALUE
												</span>
											)}
										</div>
									</div>
									<span style={{ fontWeight: 800, fontSize: 16, fontFamily: 'var(--bf-mono)', color: 'var(--bf-ember)' }}>
										{rs(s.price)}
									</span>
								</button>
							)
						})}
					</div>
					<button
						className={`bf-btn bf-btn-lg bf-added-btn${confirmed ? ' bf-btn-success' : ' bf-btn-primary'}`}
						style={{ width: '100%', marginTop: 18, justifyContent: 'space-between', transition: 'background 0.2s, box-shadow 0.2s' }}
						onClick={handleConfirm}
					>
						{confirmed ? (
							<>
								<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckIcon /> Added to cart!</span>
								<span />
							</>
						) : (
							<>
								<span>Add to cart</span>
								<span style={{ fontFamily: 'var(--bf-mono)', fontWeight: 800 }}>
									{rs(sizes[selected].price)} {Icons.arrow}
								</span>
							</>
						)}
					</button>
				</div>
			</div>
		</>,
		document.body,
	)
}

// ─── In-card qty stepper (ink bg, white controls) ────────────────────────────
function CardStepper({
	qty,
	onDecrement,
	onIncrement,
}: {
	qty: number
	onDecrement: () => void
	onIncrement: () => void
}) {
	return (
		<div
			className='bf-stepper-pop'
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				background: 'var(--bf-ink)',
				borderRadius: 999,
				gap: 0,
			}}
		>
			<button
				onClick={(e) => {
					e.stopPropagation()
					onDecrement()
				}}
				style={{
					width: 30,
					height: 30,
					border: 0,
					background: 'transparent',
					color: '#fff',
					cursor: 'pointer',
					display: 'grid',
					placeItems: 'center',
					borderRadius: '999px 0 0 999px',
					flexShrink: 0,
				}}
			>
				{/* show X when at 1 so user knows it removes */}
				{qty === 1 ? Icons.x : Icons.minus}
			</button>
			<span
				style={{
					minWidth: 22,
					textAlign: 'center',
					font: '700 13px var(--bf-font)',
					color: '#fff',
				}}
				className='bf-tabular'
			>
				{qty}
			</span>
			<button
				onClick={(e) => {
					e.stopPropagation()
					onIncrement()
				}}
				style={{
					width: 30,
					height: 30,
					border: 0,
					background: 'transparent',
					color: '#fff',
					cursor: 'pointer',
					display: 'grid',
					placeItems: 'center',
					borderRadius: '0 999px 999px 0',
					flexShrink: 0,
				}}
			>
				{Icons.plus}
			</button>
		</div>
	)
}

// ─── Food card (grid + list) ──────────────────────────────────────────────────
function FoodCard({
	item,
	variant = 'grid',
	tone = 'cream',
}: {
	item: Product
	variant?: 'grid' | 'list' | 'compact'
	tone?: Tone
}) {
	const addItem = useCartStore((s) => s.addItem)
	const removeItem = useCartStore((s) => s.removeItem)
	const updateQuantity = useCartStore((s) => s.updateQuantity)

	// qty of this exact item (no size, no deal) currently in cart
	const cartQty = useCartStore((s) => {
		const found = s.items.find(
			(i) => i.productId === item.id && !i.dealId && !i.size,
		)
		return found?.quantity ?? 0
	})

	const router = useRouter()
	const [showPicker, setShowPicker] = useState(false)
	const [added, setAdded] = useState(false)
	const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const sizes = getSizeOptions(item)
	const hasSizes = sizes.length > 0

	useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current) }, [])

	function flashAdded() {
		setAdded(true)
		if (addedTimer.current) clearTimeout(addedTimer.current)
		addedTimer.current = setTimeout(() => setAdded(false), 1800)
	}

	function directAdd() {
		addItem({
			productId: item.id,
			productName: item.name,
			price: item.price,
			quantity: 1,
		})
		flashAdded()
	}

	function pickSize(size: string, price: number) {
		addItem({
			productId: item.id,
			productName: item.name,
			price: item.price,
			quantity: 1,
			size,
			sizePrice: price,
		})
		flashAdded()
		// onClose is called by SizePicker after its own 750ms confirmation delay
	}

	function handleAdd(e: React.MouseEvent) {
		e.stopPropagation()
		if (hasSizes) {
			setShowPicker(true)
		} else {
			directAdd()
		}
	}

	function handleDecrement() {
		if (cartQty <= 1) {
			removeItem(item.id)
		} else {
			updateQuantity(item.id, cartQty - 1)
		}
	}

	function handleIncrement() {
		updateQuantity(item.id, cartQty + 1)
	}

	// ── Compact variant (related products — uniform height) ─────────────────────
	if (variant === 'compact') {
		return (
			<div
				className='bf-card bf-lift bf-food-card-compact'
				onClick={() => router.push(`/menu/${item.id}`)}
			>
				<div className='bf-food-card-compact-media'>
					<FoodImg tone={tone} caption={item.name.toLowerCase()} style={{ height: '100%', borderRadius: 10 }} />
					{item.isHot && (
						<div className='bf-food-card-compact-hot'>
							<HotBadge />
						</div>
					)}
				</div>
				<div className='bf-food-card-compact-body'>
					<div className='bf-food-card-compact-title'>{item.name}</div>
					<div className='bf-food-card-compact-footer' onClick={(e) => e.stopPropagation()}>
						<div className='bf-food-card-compact-price'>
							{hasSizes ? (
								<>
									<span className='bf-food-card-compact-from'>From</span>
									{rs(sizes[0].price)}
								</>
							) : (
								rs(item.price)
							)}
						</div>
						{added ? (
							<button type='button' className='bf-btn bf-btn-success bf-added-btn' disabled style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}>
								<CheckIcon />
							</button>
						) : !hasSizes && cartQty > 0 ? (
							<CardStepper key={`stepper-${item.id}`} qty={cartQty} onDecrement={handleDecrement} onIncrement={handleIncrement} />
						) : (
							<button type='button' className='bf-btn bf-btn-ink' onClick={handleAdd} style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}>
								{Icons.plus}
							</button>
						)}
					</div>
				</div>
				{showPicker && hasSizes && (
					<SizePicker sizes={sizes} onPick={pickSize} onClose={() => setShowPicker(false)} />
				)}
			</div>
		)
	}

	// ── List variant ──────────────────────────────────────────────────────────
	if (variant === 'list') {
		return (
			<div
				onClick={() => router.push(`/menu/${item.id}`)}
				style={{
					position: 'relative',
					display: 'flex',
					gap: 14,
					padding: 14,
					background: 'var(--bf-paper)',
					borderRadius: 'var(--bf-radius)',
					border: '1px solid var(--bf-line)',
					alignItems: 'center',
					cursor: 'pointer',
					transition: 'box-shadow 0.15s, transform 0.15s',
				}}
				onMouseEnter={(e) => {
					;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--bf-shadow-md)'
					;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
				}}
				onMouseLeave={(e) => {
					;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
					;(e.currentTarget as HTMLDivElement).style.transform = ''
				}}
			>
				<FoodImg
					tone={tone}
					caption={item.name.toLowerCase()}
					style={{ width: 90, height: 90, flexShrink: 0 }}
				/>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<div style={{ fontWeight: 800, fontSize: 16 }}>{item.name}</div>
						{item.isHot && <HotBadge />}
					</div>
					<div
						style={{
							color: 'var(--bf-ink-2)',
							fontSize: 12.5,
							marginTop: 3,
							lineHeight: 1.4,
						}}
					>
						{item.description}
					</div>
					<div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
						{hasSizes ? (
							<>
								<span
									style={{ fontSize: 11, fontWeight: 600, color: 'var(--bf-mute)' }}
								>
									From{' '}
								</span>
								{rs(sizes[0].price)}
							</>
						) : (
							rs(item.price)
						)}
					</div>
				</div>
				<div
					style={{ position: 'relative', flexShrink: 0 }}
					onClick={(e) => e.stopPropagation()}
				>
					{added ? (
						<button className='bf-btn bf-btn-success bf-btn-sm bf-added-btn' disabled style={{ gap: 6 }}>
							<CheckIcon /> Added!
						</button>
					) : !hasSizes && cartQty > 0 ? (
						<CardStepper
							qty={cartQty}
							onDecrement={handleDecrement}
							onIncrement={handleIncrement}
						/>
					) : (
						<button
							className='bf-btn bf-btn-primary bf-btn-sm'
							onClick={handleAdd}
						>
							{hasSizes ? 'Choose size' : <>Add {Icons.plus}</>}
						</button>
					)}
					{showPicker && hasSizes && (
						<SizePicker
							sizes={sizes}
							onPick={pickSize}
							onClose={() => setShowPicker(false)}
						/>
					)}
				</div>
			</div>
		)
	}

	// ── Grid variant ──────────────────────────────────────────────────────────
	return (
		<div
			className='bf-card bf-lift'
			style={{ padding: 12, cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }}
			onClick={() => router.push(`/menu/${item.id}`)}
		>
			<FoodImg
				tone={tone}
				caption={item.name.toLowerCase()}
				style={{ height: 130, flexShrink: 0 }}
			/>

			{/* Body — grows to fill card height so CTA always sits at the bottom */}
			<div style={{ flex: 1, padding: '10px 4px 4px', display: 'flex', flexDirection: 'column' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
					<div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>
						{item.name}
					</div>
					{item.isHot && <HotBadge />}
				</div>
				<div
					style={{
						color: 'var(--bf-ink-2)',
						fontSize: 12,
						marginTop: 3,
						lineHeight: 1.35,
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}
				>
					{item.description}
				</div>

				{/* Spacer */}
				<div style={{ flex: 1 }} />

				{/* Price + CTA — always at bottom */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
					<div style={{ fontWeight: 800, fontSize: 16 }}>
						{hasSizes ? (
							<>
								<span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bf-mute)' }}>From </span>
								{rs(sizes[0].price)}
							</>
						) : (
							rs(item.price)
						)}
					</div>

					<div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
						{added ? (
							<button className='bf-btn bf-btn-success bf-added-btn' disabled style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}>
								<CheckIcon />
							</button>
						) : !hasSizes && cartQty > 0 ? (
							<CardStepper
								key={`stepper-${item.id}`}
								qty={cartQty}
								onDecrement={handleDecrement}
								onIncrement={handleIncrement}
							/>
						) : (
							<button
								className='bf-btn bf-btn-ink'
								onClick={handleAdd}
								style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}
							>
								{Icons.plus}
							</button>
						)}

						{showPicker && hasSizes && (
							<SizePicker
								sizes={sizes}
								onPick={pickSize}
								onClose={() => setShowPicker(false)}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export { FoodCard }
