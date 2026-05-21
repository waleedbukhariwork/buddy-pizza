'use client'
import React, { useState, useRef, useEffect } from 'react'
import { FoodImg, type Tone } from '../ui/food-img'
import { HotBadge } from '../ui/hot-badge'
import { Icons } from '../ui/icon'
import { useCartStore } from '../../lib/cart-store'
import { rs, type Product } from '../../lib/hooks'

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

// ─── Size picker popup ────────────────────────────────────────────────────────
function SizePicker({
	item,
	sizes,
	onPick,
	onClose,
}: {
	item: Product
	sizes: { label: string; price: number }[]
	onPick: (size: string, price: number) => void
	onClose: () => void
}) {
	const ref = useRef<HTMLDivElement>(null)
	useEffect(() => {
		function handle(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose()
		}
		document.addEventListener('mousedown', handle)
		return () => document.removeEventListener('mousedown', handle)
	}, [onClose])

	return (
		<div
			ref={ref}
			style={{
				position: 'absolute',
				bottom: 'calc(100% + 8px)',
				left: 0,
				right: 0,
				background: 'var(--bf-paper)',
				borderRadius: 14,
				boxShadow: '0 8px 32px rgba(35,31,32,.18)',
				border: '1px solid var(--bf-line)',
				padding: 12,
				zIndex: 30,
			}}
		>
			<div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-mute)', letterSpacing: '.07em', marginBottom: 8, fontFamily: 'var(--bf-mono)', textTransform: 'uppercase' }}>
				Pick a size
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
				{sizes.map((s) => (
					<button
						key={s.label}
						onClick={() => onPick(s.label, s.price)}
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '9px 12px',
							borderRadius: 10,
							border: '1.5px solid var(--bf-line-2)',
							background: 'var(--bf-cream)',
							cursor: 'pointer',
							fontFamily: 'var(--bf-font)',
						}}
					>
						<span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--bf-ink)' }}>{s.label}</span>
						<span style={{ fontSize: 14, fontWeight: 800, color: 'var(--bf-ember)' }}>{rs(s.price)}</span>
					</button>
				))}
			</div>
		</div>
	)
}

// ─── Food card (grid + list) ──────────────────────────────────────────────────
function FoodCard({ item, variant = 'grid', tone = 'cream' }: { item: Product; variant?: 'grid' | 'list'; tone?: Tone }) {
	const addItem = useCartStore((s) => s.addItem)
	const [showPicker, setShowPicker] = useState(false)
	const sizes = getSizeOptions(item)
	const hasSizes = sizes.length > 0

	function directAdd() {
		addItem({ productId: item.id, productName: item.name, price: item.price, quantity: 1 })
	}

	function pickSize(size: string, price: number) {
		addItem({ productId: item.id, productName: item.name, price: item.price, quantity: 1, size, sizePrice: price })
		setShowPicker(false)
	}

	function handleAdd(e: React.MouseEvent) {
		e.stopPropagation()
		if (hasSizes) {
			setShowPicker((v) => !v)
		} else {
			directAdd()
		}
	}

	if (variant === 'list') {
		return (
			<div style={{ position: 'relative', display: 'flex', gap: 14, padding: 14, background: 'var(--bf-paper)', borderRadius: 'var(--bf-radius)', border: '1px solid var(--bf-line)', alignItems: 'center' }}>
				<FoodImg tone={tone} caption={item.name.toLowerCase()} style={{ width: 90, height: 90, flexShrink: 0 }} />
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<div style={{ fontWeight: 800, fontSize: 16 }}>{item.name}</div>
						{item.isHot && <HotBadge />}
					</div>
					<div style={{ color: 'var(--bf-ink-2)', fontSize: 12.5, marginTop: 3, lineHeight: 1.4 }}>{item.description}</div>
					<div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
						{hasSizes
							? <><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bf-mute)' }}>From </span>{rs(sizes[0].price)}</>
							: rs(item.price)
						}
					</div>
				</div>
				<div style={{ position: 'relative', flexShrink: 0 }}>
					<button className='bf-btn bf-btn-primary bf-btn-sm' onClick={handleAdd}>
						{hasSizes ? 'Choose size' : <>Add {Icons.plus}</>}
					</button>
					{showPicker && hasSizes && (
						<SizePicker item={item} sizes={sizes} onPick={pickSize} onClose={() => setShowPicker(false)} />
					)}
				</div>
			</div>
		)
	}

	return (
		<div className='bf-card bf-lift' style={{ padding: 12, cursor: 'pointer', position: 'relative' }}>
			<FoodImg tone={tone} caption={item.name.toLowerCase()} style={{ height: 140 }} />
			<div style={{ padding: '12px 4px 4px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
					<div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>{item.name}</div>
					{item.isHot && <HotBadge />}
				</div>
				<div style={{ color: 'var(--bf-ink-2)', fontSize: 12, marginTop: 3, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
					{item.description}
				</div>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, position: 'relative' }}>
					<div style={{ fontWeight: 800, fontSize: 16 }}>
						{hasSizes
							? <><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bf-mute)' }}>From </span>{rs(sizes[0].price)}</>
							: rs(item.price)
						}
					</div>
					<div style={{ position: 'relative' }}>
						<button
							className='bf-btn bf-btn-ink'
							onClick={handleAdd}
							style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}
						>
							{Icons.plus}
						</button>
						{showPicker && hasSizes && (
							<SizePicker item={item} sizes={sizes} onPick={pickSize} onClose={() => setShowPicker(false)} />
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export { FoodCard }
