'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Icons } from '../ui/icon'
import { Skeleton } from '../ui/skeleton'
import { useDeals, useProducts, saveDeal, deleteDeal } from '../../lib/hooks'
import type { Deal, Product } from '../../lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const FLAVOR_PRESETS = ['Peri Peri', 'BBQ', 'Tikka', 'Garlic', 'Original']
const SIZE_LABELS = ['Small', 'Regular', 'Medium', 'Large', 'Family']

// ─── Types ────────────────────────────────────────────────────────────────────
interface SelectedItem {
	productId?: number
	name: string
	unitPrice: number
	qty: number
	size?: string | null
	availableFlavors?: string[]
	hasSizes?: boolean
}

// ─── Serialization (JSON format, backward-compat parse) ───────────────────────
function serializeItems(items: SelectedItem[]): string {
	return JSON.stringify(
		items.filter(i => i.name.trim()).map(i => ({
			productId: i.productId ?? null,
			name: i.name.trim(),
			qty: i.qty,
			size: i.size ?? null,
			availableFlavors: i.availableFlavors ?? [],
			unitPrice: i.unitPrice,
		}))
	)
}

function parseToSelected(raw: string | null | undefined, products: Product[]): SelectedItem[] {
	if (!raw?.trim()) return []
	if (raw.trim().startsWith('[')) {
		try {
			const parsed = JSON.parse(raw) as Array<{
				productId?: number | null; name: string; qty: number
				size?: string | null; availableFlavors?: string[]; unitPrice: number
			}>
			return parsed.map(item => ({
				productId: item.productId ?? undefined,
				name: item.name,
				qty: item.qty,
				size: item.size ?? undefined,
				availableFlavors: item.availableFlavors ?? [],
				unitPrice: item.unitPrice,
				hasSizes: products.find(p => p.id === (item.productId ?? undefined))?.hasSizes ?? false,
			}))
		} catch { /* fall through */ }
	}
	// Legacy \n format
	return raw.split('\n').filter(Boolean).map(line => {
		const m = line.match(/^(\d+)×\s*(.+)$/)
		const qty = m ? parseInt(m[1]) : 1
		const name = m ? m[2] : line
		const product = products.find(p => p.name.toLowerCase() === name.toLowerCase())
		return {
			productId: product?.id,
			name,
			unitPrice: product?.priceSmall ?? product?.price ?? 0,
			qty,
			availableFlavors: [],
			hasSizes: product?.hasSizes ?? false,
		}
	})
}

function calcOriginal(items: SelectedItem[]) {
	return items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
}

interface SavingsInfo { amount: number; pct: number }
function getSavings(orig: number, deal: number | null): SavingsInfo | null {
	if (!deal || !orig || orig <= deal) return null
	return { amount: Math.round(orig - deal), pct: Math.round(((orig - deal) / orig) * 100) }
}

function toIso(val: string): string | null {
	if (!val) return null
	return val.length === 16 ? val + ':00' : val
}

function getExpiryInfo(expiresAt?: string | null): { text: string; color: string; bg: string } | null {
	if (!expiresAt) return null
	const diff = new Date(expiresAt).getTime() - Date.now()
	if (diff < 0) return { text: 'Expired', color: '#dc2626', bg: '#fee2e2' }
	const hours = Math.floor(diff / 3_600_000)
	if (hours < 24) return { text: `Ends in ${hours}h`, color: '#92400e', bg: '#fef3c7' }
	const days = Math.floor(hours / 24)
	if (days <= 7) return { text: `Ends in ${days}d`, color: '#92400e', bg: '#fef3c7' }
	return null
}

function getStartInfo(startsAt?: string | null): string | null {
	if (!startsAt) return null
	const diff = new Date(startsAt).getTime() - Date.now()
	if (diff <= 0) return null
	const hours = Math.floor(diff / 3_600_000)
	if (hours < 24) return `Starts in ${hours}h`
	return `Starts ${new Date(startsAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}`
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange, color = 'var(--bf-ember)' }: { on: boolean; onChange: () => void; color?: string }) {
	return (
		<div
			onClick={onChange}
			style={{
				width: 44, height: 24, borderRadius: 999,
				background: on ? color : 'var(--bf-line)',
				position: 'relative', flexShrink: 0,
				transition: 'background .15s', cursor: 'pointer',
			}}
		>
			<div style={{
				width: 18, height: 18, borderRadius: '50%', background: '#fff',
				position: 'absolute', top: 3, left: on ? 23 : 3,
				transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.25)',
			}} />
		</div>
	)
}

// ─── Product search picker ────────────────────────────────────────────────────
function ProductPicker({ products, selected, onAdd }: {
	products: Product[]
	selected: SelectedItem[]
	onAdd: (item: SelectedItem) => void
}) {
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	const grouped = useMemo(() => {
		const q = query.trim().toLowerCase()
		const list = q
			? products.filter(p => p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q))
			: products
		const map: Record<string, Product[]> = {}
		for (const p of list) {
			const cat = p.category || 'Other'
			if (!map[cat]) map[cat] = []
			map[cat].push(p)
		}
		return map
	}, [products, query])

	const hasResults = Object.keys(grouped).length > 0

	useEffect(() => {
		function onDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', onDown)
		return () => document.removeEventListener('mousedown', onDown)
	}, [])

	function handleSelect(p: Product) {
		onAdd({
			productId: p.id,
			name: p.name,
			unitPrice: p.priceSmall ?? p.price,
			qty: 1,
			availableFlavors: [],
			hasSizes: p.hasSizes ?? false,
		})
		setQuery('')
		setOpen(false)
	}

	return (
		<div ref={ref} style={{ position: 'relative' }}>
			<div style={{ position: 'relative' }}>
				<span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--bf-mute)', pointerEvents: 'none', display: 'flex' }}>
					{Icons.search}
				</span>
				<input
					className='bf-input'
					value={query}
					onChange={e => { setQuery(e.target.value); setOpen(true) }}
					onFocus={() => setOpen(true)}
					placeholder='Search products to add…'
					style={{ paddingLeft: 42 }}
				/>
			</div>
			{open && hasResults && (
				<div style={{
					position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
					background: 'var(--bf-paper)', border: '1px solid var(--bf-line)',
					borderRadius: 14, boxShadow: '0 12px 40px rgba(35,31,32,.18)',
					zIndex: 200, maxHeight: 280, overflowY: 'auto',
				}} className='bf-scroll'>
					{Object.entries(grouped).map(([cat, items]) => (
						<div key={cat}>
							<div style={{
								padding: '8px 14px 5px',
								fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em',
								color: 'var(--bf-mute)', textTransform: 'uppercase',
								background: 'var(--bf-cream-2)',
								borderBottom: '1px solid var(--bf-line)',
								position: 'sticky', top: 0,
							}}>
								{cat} <span style={{ fontWeight: 400, opacity: 0.7 }}>({items.length})</span>
							</div>
							{items.map(p => {
								const isAdded = selected.some(i => i.productId === p.id)
								const basePrice = p.priceSmall ?? p.price
								return (
									<div
										key={p.id}
										onClick={() => !isAdded && handleSelect(p)}
										style={{
											padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
											cursor: isAdded ? 'default' : 'pointer',
											opacity: isAdded ? 0.45 : 1,
											borderBottom: '1px solid var(--bf-line)',
											transition: 'background .1s',
										}}
										onMouseEnter={e => { if (!isAdded) (e.currentTarget as HTMLDivElement).style.background = 'var(--bf-cream-2)' }}
										onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
									>
										<div style={{ font: '600 13px var(--bf-font)', color: 'var(--bf-ink)' }}>{p.name}</div>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											{p.hasSizes && <span style={{ fontSize: 10, color: 'var(--bf-mute)', fontWeight: 600 }}>sizes</span>}
											<span className='bf-mono' style={{ fontSize: 12, fontWeight: 700, color: 'var(--bf-ember)' }}>
												{p.hasSizes ? `From Rs.${basePrice}` : `Rs.${basePrice}`}
											</span>
											{isAdded
												? <span style={{ fontSize: 10, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>Added</span>
												: <span style={{ fontSize: 10, color: 'var(--bf-ember)', background: 'rgba(232,67,31,.1)', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>+ Add</span>
											}
										</div>
									</div>
								)
							})}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

// ─── Item config panel (size + flavors) ───────────────────────────────────────
function ItemConfigPanel({ item, onUpdate }: {
	item: SelectedItem
	onUpdate: (updates: Partial<SelectedItem>) => void
}) {
	const [flavorInput, setFlavorInput] = useState('')

	function addCustomFlavor() {
		const val = flavorInput.trim()
		if (!val) return
		const current = item.availableFlavors ?? []
		if (!current.includes(val)) onUpdate({ availableFlavors: [...current, val] })
		setFlavorInput('')
	}

	return (
		<div style={{ padding: '14px 14px', borderTop: '1px solid var(--bf-line)', background: 'var(--bf-cream-2)', display: 'flex', flexDirection: 'column', gap: 14 }}>

			{/* Size selector (only if product hasSizes) */}
			{item.hasSizes && (
				<div>
					<div style={{ fontSize: 10, fontWeight: 800, color: 'var(--bf-mute)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
						Size for this deal
					</div>
					<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
						{SIZE_LABELS.map(sz => (
							<button
								key={sz}
								className={`bf-btn bf-btn-sm ${item.size === sz ? 'bf-btn-primary' : 'bf-btn-outline'}`}
								style={{ padding: '5px 12px', fontSize: 12 }}
								onClick={() => onUpdate({ size: item.size === sz ? null : sz })}
							>{sz}</button>
						))}
					</div>
				</div>
			)}

			{/* Flavor availability */}
			<div>
				<div style={{ fontSize: 10, fontWeight: 800, color: 'var(--bf-mute)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>
					Available flavors
				</div>
				<div style={{ fontSize: 11, color: 'var(--bf-mute)', marginBottom: 8 }}>
					Customers pick one when ordering this deal
				</div>
				<div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
					{FLAVOR_PRESETS.map(f => {
						const isOn = item.availableFlavors?.includes(f) ?? false
						return (
							<button
								key={f}
								className={`bf-btn bf-btn-sm ${isOn ? 'bf-btn-primary' : 'bf-btn-outline'}`}
								style={{ padding: '5px 10px', fontSize: 11.5 }}
								onClick={() => {
									const current = item.availableFlavors ?? []
									onUpdate({ availableFlavors: isOn ? current.filter(x => x !== f) : [...current, f] })
								}}
							>{f}</button>
						)
					})}
				</div>
				<div style={{ display: 'flex', gap: 6 }}>
					<input
						className='bf-input'
						style={{ flex: 1, height: 34, fontSize: 12 }}
						value={flavorInput}
						onChange={e => setFlavorInput(e.target.value)}
						placeholder='Custom flavor…'
						onKeyDown={e => { if (e.key === 'Enter') addCustomFlavor() }}
					/>
					<button className='bf-btn bf-btn-outline bf-btn-sm' style={{ height: 34 }} onClick={addCustomFlavor}>Add</button>
				</div>
				{(item.availableFlavors ?? []).filter(f => !FLAVOR_PRESETS.includes(f)).length > 0 && (
					<div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
						{(item.availableFlavors ?? []).filter(f => !FLAVOR_PRESETS.includes(f)).map(f => (
							<span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(232,67,31,.1)', borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--bf-ember)' }}>
								{f}
								<button
									style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', lineHeight: 1, display: 'flex', fontSize: 14 }}
									onClick={() => onUpdate({ availableFlavors: (item.availableFlavors ?? []).filter(x => x !== f) })}
								>×</button>
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Selected items list ──────────────────────────────────────────────────────
function SelectedItemsList({ items, onChange }: { items: SelectedItem[]; onChange: (items: SelectedItem[]) => void }) {
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
	if (items.length === 0) return null
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
			{items.map((item, i) => {
				const isExpanded = expandedIndex === i
				const hasFlavors = (item.availableFlavors?.length ?? 0) > 0
				return (
					<div key={i} style={{
						background: 'var(--bf-paper)',
						border: `1px solid ${isExpanded ? 'var(--bf-ember)' : 'var(--bf-line)'}`,
						borderRadius: 12, overflow: 'hidden', transition: 'border-color .15s',
					}}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
							<div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bf-ember)', flexShrink: 0 }} />
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{ font: '600 13px var(--bf-font)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
								{(item.size || hasFlavors) && (
									<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 2 }}>
										{[item.size, hasFlavors ? item.availableFlavors!.join(', ') : null].filter(Boolean).join(' · ')}
									</div>
								)}
							</div>
							<span className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)', flexShrink: 0 }}>
								Rs.{item.unitPrice.toLocaleString('en-PK')}/ea
							</span>
							<div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bf-cream-2)', borderRadius: 8, padding: '2px 4px', flexShrink: 0 }}>
								<button
									className='bf-btn bf-btn-ghost bf-btn-icon'
									style={{ width: 22, height: 22 }}
									onClick={() => item.qty <= 1
										? onChange(items.filter((_, j) => j !== i))
										: onChange(items.map((it, j) => j === i ? { ...it, qty: it.qty - 1 } : it))
									}
								>{Icons.minus}</button>
								<span style={{ width: 24, textAlign: 'center', font: '700 13px var(--bf-font)' }}>{item.qty}</span>
								<button
									className='bf-btn bf-btn-ghost bf-btn-icon'
									style={{ width: 22, height: 22 }}
									onClick={() => onChange(items.map((it, j) => j === i ? { ...it, qty: it.qty + 1 } : it))}
								>{Icons.plus}</button>
							</div>
							<span className='bf-mono' style={{ fontSize: 12, fontWeight: 700, minWidth: 72, textAlign: 'right', flexShrink: 0 }}>
								Rs.{(item.unitPrice * item.qty).toLocaleString('en-PK')}
							</span>
							{/* Configure toggle */}
							<button
								className='bf-btn bf-btn-ghost bf-btn-icon'
								style={{ width: 28, height: 28, color: isExpanded ? 'var(--bf-ember)' : 'var(--bf-mute)', flexShrink: 0 }}
								onClick={() => setExpandedIndex(isExpanded ? null : i)}
								title='Configure size & flavors'
							>
								<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
									<path d='M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/>
								</svg>
							</button>
							<button
								className='bf-btn bf-btn-ghost bf-btn-icon'
								style={{ width: 26, height: 26, color: 'var(--bf-ember)', flexShrink: 0 }}
								onClick={() => { onChange(items.filter((_, j) => j !== i)); if (expandedIndex === i) setExpandedIndex(null) }}
							>{Icons.x}</button>
						</div>

						{isExpanded && (
							<ItemConfigPanel
								item={item}
								onUpdate={updates => onChange(items.map((it, j) => j === i ? { ...it, ...updates } : it))}
							/>
						)}
					</div>
				)
			})}
		</div>
	)
}

// ─── Deal preview card ────────────────────────────────────────────────────────
function DealPreview({ form, items }: { form: DealFormState; items: SelectedItem[] }) {
	const itemLines = items.map(i => {
		const parts = [`${i.qty}× ${i.name}`]
		if (i.size) parts.push(i.size)
		if (i.availableFlavors?.length) parts.push(i.availableFlavors.join(', '))
		return parts.join(' · ')
	})
	const sav = getSavings(form.originalPrice ?? 0, form.discountPrice)
	const isEmpty = !form.title.trim()
	const expiryInfo = getExpiryInfo(form.expiresAt)
	const startInfo = getStartInfo(form.startsAt)

	return (
		<div>
			<div className='bf-eyebrow' style={{ marginBottom: 14 }}>CUSTOMER PREVIEW</div>
			<div className='bf-card' style={{ padding: 0, overflow: 'hidden', opacity: isEmpty ? 0.4 : 1, transition: 'opacity .2s' }}>
				{/* Status bar */}
				<div style={{ height: 4, background: form.isActive ? (form.isFeatured ? 'var(--bf-amber)' : 'var(--bf-ember)') : 'var(--bf-line)', transition: 'background .2s' }} />

				{/* Deal image preview */}
				{form.imageUrl && (
					<div style={{ height: 90, overflow: 'hidden', background: 'var(--bf-cream-2)' }}>
						<img src={form.imageUrl} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
					</div>
				)}

				<div style={{ padding: '14px 14px 16px' }}>
					{/* Badges */}
					<div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
						{form.isFeatured && <span className='bf-pill' style={{ background: '#FEF9C3', color: '#713f12', boxShadow: 'none', fontSize: 9.5 }}>⭐ Featured</span>}
						{form.tag && <span className='bf-pill bf-pill-ink' style={{ fontSize: 9.5 }}>{form.tag}</span>}
						{form.badge && <span className='bf-pill bf-pill-ember' style={{ fontSize: 9.5 }}>{form.badge}</span>}
						{expiryInfo && <span style={{ fontSize: 9.5, fontWeight: 600, color: expiryInfo.color, background: expiryInfo.bg, padding: '2px 7px', borderRadius: 999 }}>⏱ {expiryInfo.text}</span>}
						{startInfo && !expiryInfo && <span style={{ fontSize: 9.5, fontWeight: 600, color: '#4338ca', background: 'rgba(79,70,229,.1)', padding: '2px 7px', borderRadius: 999 }}>📅 {startInfo}</span>}
						<div style={{ marginLeft: 'auto' }}>
							<span style={{ fontSize: 10, fontWeight: 600, color: form.isActive ? '#166534' : 'var(--bf-mute)' }}>
								{form.isActive ? 'Active' : 'Paused'}
							</span>
						</div>
					</div>

					{/* Title */}
					<h3 style={{ fontWeight: 800, fontSize: 15, margin: '0 0 4px', letterSpacing: '-.01em', lineHeight: 1.25 }}>
						{form.title || 'Deal title'}
					</h3>
					{form.description && (
						<p style={{ fontSize: 11, color: 'var(--bf-ink-2)', margin: '0 0 8px', lineHeight: 1.4 }}>{form.description}</p>
					)}

					{/* Items */}
					{itemLines.length > 0 && (
						<ul style={{ margin: '0 0 10px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
							{itemLines.slice(0, 4).map((line, i) => (
								<li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
									<span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--bf-ember)', flexShrink: 0 }} />
									<span style={{ color: 'var(--bf-ink-2)' }}>{line}</span>
								</li>
							))}
							{itemLines.length > 4 && <li style={{ fontSize: 10.5, color: 'var(--bf-mute)', paddingLeft: 10 }}>+{itemLines.length - 4} more</li>}
						</ul>
					)}

					{/* Quota preview */}
					{form.maxOrders && (
						<div style={{ marginBottom: 10 }}>
							<div style={{ height: 4, background: 'var(--bf-line)', borderRadius: 999 }}>
								<div style={{ height: '100%', width: '0%', background: 'var(--bf-leaf)', borderRadius: 999 }} />
							</div>
							<div style={{ fontSize: 10, color: 'var(--bf-mute)', marginTop: 3 }}>{form.maxOrders} orders max</div>
						</div>
					)}

					{/* Price */}
					<div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
						<div>
							{form.originalPrice != null && (
								<div className='bf-mono' style={{ fontSize: 10, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
									Rs.{form.originalPrice.toLocaleString('en-PK')}
								</div>
							)}
							<div style={{ fontWeight: 800, fontSize: 18, color: 'var(--bf-ember)', letterSpacing: '-0.02em' }}>
								{form.discountPrice != null ? `Rs.${form.discountPrice.toLocaleString('en-PK')}` : 'Rs. —'}
							</div>
						</div>
						{sav && (
							<span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 7px', borderRadius: 999, marginBottom: 2 }}>
								-{sav.pct}%
							</span>
						)}
					</div>

					{/* Terms preview */}
					{form.termsText && (
						<div style={{ marginTop: 8, fontSize: 10, color: 'var(--bf-mute)', borderTop: '1px solid var(--bf-line)', paddingTop: 8, fontStyle: 'italic' }}>
							{form.termsText}
						</div>
					)}
				</div>
			</div>

			{/* Savings highlight */}
			{sav && (
				<div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: '#DCFCE7', border: '1px solid #86efac' }}>
					<div style={{ font: '700 12px var(--bf-font)', color: '#15803d', marginBottom: 3 }}>🎉 Great savings!</div>
					<div style={{ fontSize: 11, color: '#166534' }}>
						Customers save <strong>Rs.{sav.amount.toLocaleString('en-PK')}</strong> — <strong>{sav.pct}% off</strong>
					</div>
				</div>
			)}

			{/* Quick checklist */}
			<div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
				{[
					{ ok: !!form.title.trim(), label: 'Deal title' },
					{ ok: items.length > 0, label: 'Items added' },
					{ ok: !!form.discountPrice && form.discountPrice > 0, label: 'Deal price set' },
					{ ok: !form.originalPrice || !form.discountPrice || form.discountPrice <= form.originalPrice, label: 'Price is valid' },
					{ ok: !form.startsAt || !form.expiresAt || new Date(form.expiresAt) > new Date(form.startsAt), label: 'Schedule is valid' },
				].map(({ ok, label }) => (
					<div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
						<div style={{
							width: 16, height: 16, borderRadius: '50%',
							background: ok ? '#DCFCE7' : 'var(--bf-cream-2)',
							border: `1.5px solid ${ok ? '#86efac' : 'var(--bf-line-2)'}`,
							display: 'grid', placeItems: 'center', flexShrink: 0,
						}}>
							{ok && <svg width={9} height={9} viewBox='0 0 24 24' fill='none' stroke='#15803d' strokeWidth={3}><path d='M4 12l5 5L20 6' /></svg>}
						</div>
						<span style={{ fontSize: 11, color: ok ? '#15803d' : 'var(--bf-mute)', fontWeight: ok ? 600 : 400 }}>{label}</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Deal Modal ───────────────────────────────────────────────────────────────
interface DealFormState {
	title: string; tag: string; badge: string; description: string
	originalPrice: number | null; discountPrice: number | null
	isFeatured: boolean; isActive: boolean
	imageUrl: string; termsText: string
	maxOrders: number | null; displayOrder: number | null
	startsAt: string; expiresAt: string
}

const EMPTY_FORM: DealFormState = {
	title: '', tag: '', badge: '', description: '',
	originalPrice: null, discountPrice: null,
	isFeatured: false, isActive: true,
	imageUrl: '', termsText: '',
	maxOrders: null, displayOrder: null,
	startsAt: '', expiresAt: '',
}

function dealToForm(deal: Deal): DealFormState {
	return {
		title: deal.title,
		tag: deal.tag ?? '',
		badge: deal.badge ?? '',
		description: deal.description ?? '',
		originalPrice: deal.originalPrice ?? null,
		discountPrice: deal.discountPrice ?? null,
		isFeatured: deal.isFeatured ?? false,
		isActive: deal.isActive,
		imageUrl: deal.imageUrl ?? '',
		termsText: deal.termsText ?? '',
		maxOrders: deal.maxOrders ?? null,
		displayOrder: deal.displayOrder ?? null,
		startsAt: deal.startsAt ? deal.startsAt.substring(0, 16) : '',
		expiresAt: deal.expiresAt ? deal.expiresAt.substring(0, 16) : '',
	}
}

function SectionHeader({ label, color = 'var(--bf-ember)' }: { label: string; color?: string }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
			<div style={{ width: 3, height: 18, borderRadius: 99, background: color, flexShrink: 0 }} />
			<span className='bf-eyebrow'>{label}</span>
		</div>
	)
}

function DealModal({ deal, products, onClose, onSaved }: {
	deal: Deal | null
	products: Product[]
	onClose: () => void
	onSaved: () => void
}) {
	const isNew = deal === null || deal.id === 0
	const [form, setForm] = useState<DealFormState>(() =>
		deal ? dealToForm(deal) : { ...EMPTY_FORM }
	)
	const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() =>
		parseToSelected(deal?.items, products)
	)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (selectedItems.length > 0) {
			setForm(f => ({ ...f, originalPrice: calcOriginal(selectedItems) }))
		}
	}, [selectedItems])

	const savings = getSavings(form.originalPrice ?? 0, form.discountPrice)
	const priceError =
		form.originalPrice != null && form.discountPrice != null && form.discountPrice > form.originalPrice
			? `Deal price (Rs.${form.discountPrice.toLocaleString('en-PK')}) cannot exceed original price (Rs.${form.originalPrice.toLocaleString('en-PK')})`
			: null
	const scheduleError =
		form.startsAt && form.expiresAt && new Date(form.expiresAt) <= new Date(form.startsAt)
			? 'Expiry date must be after start date'
			: null
	const canSave = form.title.trim().length > 0 && !priceError && !scheduleError

	async function handleSubmit() {
		if (!form.title.trim()) { setError('Deal title is required'); return }
		if (priceError) { setError(priceError); return }
		if (scheduleError) { setError(scheduleError); return }
		setSaving(true); setError(null)
		try {
			await saveDeal(isNew ? null : deal!.id, {
				...form,
				items: serializeItems(selectedItems),
				startsAt: toIso(form.startsAt),
				expiresAt: toIso(form.expiresAt),
				imageUrl: form.imageUrl || null,
				termsText: form.termsText || null,
			} as Omit<Deal, 'id'>)
			onSaved()
		} catch (e: unknown) {
			const axiosErr = e as { response?: { data?: { message?: string } } }
			setError(axiosErr?.response?.data?.message ?? 'Failed to save. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className='bf-admin-modal-wrap' onClick={onClose}>
			<div className='bf-admin-modal-inner' onClick={e => e.stopPropagation()}>

				{/* Header */}
				<div className='bf-admin-modal-header'>
					<div>
						<div className='bf-eyebrow' style={{ marginBottom: 3 }}>{isNew ? (deal?.id === 0 ? 'CLONE DEAL' : 'CREATE DEAL') : 'EDIT DEAL'}</div>
						<h2 style={{ fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-0.025em' }}>
							{form.title.trim() || (isNew ? 'New deal' : 'Edit deal')}
						</h2>
					</div>
					<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={onClose}>{Icons.x}</button>
				</div>

				{/* Body: 2-column */}
				<div className='bf-admin-modal-body bf-scroll'>

					{/* Left: form */}
					<div className='bf-admin-modal-form-col bf-scroll'>

						{/* ── IDENTITY ── */}
						<div>
							<SectionHeader label='DEAL IDENTITY' color='var(--bf-amber)' />
							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div>
									<label className='bf-label'>Deal title <span className='bf-req'>*</span></label>
									<input
										className='bf-input'
										value={form.title}
										onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
										placeholder='e.g. Feast Deal 1 · Family Bundle'
										autoFocus
										style={{ fontSize: 15, fontWeight: 600 }}
									/>
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									<div>
										<label className='bf-label'>Promo tag <span className='bf-opt'>(optional)</span></label>
										<input
											className='bf-input bf-mono'
											value={form.tag}
											onChange={e => setForm(f => ({ ...f, tag: e.target.value.toUpperCase() }))}
											placeholder='FRIDAY · COMBO'
											style={{ fontWeight: 700, letterSpacing: '.08em' }}
										/>
									</div>
									<div>
										<label className='bf-label'>Badge label <span className='bf-opt'>(optional)</span></label>
										<input
											className='bf-input'
											value={form.badge}
											onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
											placeholder='HOT · BOGO · NEW'
										/>
									</div>
								</div>
								<div>
									<label className='bf-label'>Description <span className='bf-opt'>(optional)</span></label>
									<textarea
										className='bf-input'
										rows={2}
										value={form.description}
										onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
										placeholder='Short tagline shown on the deal card…'
										style={{ resize: 'vertical', lineHeight: 1.5 }}
									/>
								</div>
							</div>
						</div>

						<hr className='bf-rule' />

						{/* ── DEAL IMAGE ── */}
						<div>
							<SectionHeader label='DEAL IMAGE' color='var(--bf-amber)' />
							<div>
								<label className='bf-label'>Image URL <span className='bf-opt'>(optional)</span></label>
								<input
									className='bf-input'
									value={form.imageUrl}
									onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
									placeholder='https://your-cdn.com/deal-image.jpg'
								/>
								<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 4 }}>Paste a direct image link — shown on the deal card</div>
							</div>
							{form.imageUrl && (
								<div style={{ marginTop: 10, borderRadius: 12, overflow: 'hidden', height: 100, background: 'var(--bf-cream-2)' }}>
									<img src={form.imageUrl} alt='Deal preview' style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
								</div>
							)}
						</div>

						<hr className='bf-rule' />

						{/* ── WHAT'S INCLUDED ── */}
						<div>
							<SectionHeader label="WHAT'S INCLUDED" color='var(--bf-ink)' />
							<ProductPicker
								products={products}
								selected={selectedItems}
								onAdd={item => {
									const exists = selectedItems.some(i => i.productId === item.productId)
									if (!exists) setSelectedItems(prev => [...prev, item])
								}}
							/>
							<SelectedItemsList items={selectedItems} onChange={setSelectedItems} />
							{selectedItems.length === 0 && (
								<p style={{ fontSize: 12, color: 'var(--bf-mute)', marginTop: 10, fontStyle: 'italic' }}>
									Add products — then click the pencil icon to set size and available flavors
								</p>
							)}
						</div>

						<hr className='bf-rule' />

						{/* ── PRICING ── */}
						<div>
							<SectionHeader label='PRICING' color='var(--bf-ember)' />
							<div style={{ background: 'var(--bf-cream-2)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
									<div>
										<label className='bf-label'>Original price <span className='bf-opt'>(auto)</span></label>
										<div style={{ position: 'relative' }}>
											<span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: 'var(--bf-mute)', pointerEvents: 'none' }}>Rs.</span>
											<input
												className='bf-input bf-mono'
												type='number' min={0}
												value={form.originalPrice ?? ''}
												onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value ? parseFloat(e.target.value) : null }))}
												placeholder='Auto from items'
												style={{ paddingLeft: 32, fontWeight: 700 }}
											/>
										</div>
										{selectedItems.length > 0 && (
											<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 4 }}>
												Auto from {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
											</div>
										)}
									</div>
									<div>
										<label className='bf-label'>Deal price (Rs.) <span className='bf-req'>*</span></label>
										<div style={{ position: 'relative' }}>
											<span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: 'var(--bf-mute)', pointerEvents: 'none' }}>Rs.</span>
											<input
												className='bf-input bf-mono'
												type='number' min={0}
												value={form.discountPrice ?? ''}
												onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value ? parseFloat(e.target.value) : null }))}
												placeholder='990'
												style={{ paddingLeft: 32, fontWeight: 800, color: 'var(--bf-ember)', fontSize: 16 }}
											/>
										</div>
									</div>
								</div>

								{priceError ? (
									<div style={{ padding: '10px 13px', borderRadius: 10, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
										<span>⚠</span> {priceError}
									</div>
								) : savings ? (
									<div style={{ padding: '12px 16px', borderRadius: 12, background: '#DCFCE7', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 12 }}>
										<span style={{ fontSize: 22 }}>🎉</span>
										<div>
											<div style={{ font: '700 14px var(--bf-font)', color: '#15803d' }}>
												Customers save Rs.{savings.amount.toLocaleString('en-PK')} — {savings.pct}% off!
											</div>
											<div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
												Original Rs.{(form.originalPrice ?? 0).toLocaleString('en-PK')} → Deal Rs.{(form.discountPrice ?? 0).toLocaleString('en-PK')}
											</div>
										</div>
									</div>
								) : null}
							</div>
						</div>

						<hr className='bf-rule' />

						{/* ── AVAILABILITY ── */}
						<div>
							<SectionHeader label='AVAILABILITY' color='#6366f1' />
							<div style={{ background: 'var(--bf-cream-2)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
									<div>
										<label className='bf-label'>Start date & time <span className='bf-opt'>(optional)</span></label>
										<input
											className='bf-input'
											type='datetime-local'
											value={form.startsAt}
											onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
										/>
										<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 4 }}>Blank = visible immediately</div>
									</div>
									<div>
										<label className='bf-label'>Expiry date & time <span className='bf-opt'>(optional)</span></label>
										<input
											className='bf-input'
											type='datetime-local'
											value={form.expiresAt}
											onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
										/>
										<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 4 }}>Blank = no expiry</div>
									</div>
								</div>
								{scheduleError && (
									<div style={{ padding: '10px 13px', borderRadius: 10, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 12.5, fontWeight: 600 }}>
										⚠ {scheduleError}
									</div>
								)}
								{(form.startsAt || form.expiresAt) && !scheduleError && (
									<div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', fontSize: 12, color: '#4338ca', fontWeight: 600 }}>
										{form.startsAt && !form.expiresAt && `Starts ${new Date(form.startsAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
										{!form.startsAt && form.expiresAt && `Expires ${new Date(form.expiresAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
										{form.startsAt && form.expiresAt && `Active ${new Date(form.startsAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} → ${new Date(form.expiresAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
									</div>
								)}
							</div>
						</div>

						<hr className='bf-rule' />

						{/* ── OPTIONS ── */}
						<div>
							<SectionHeader label='OPTIONS' color='var(--bf-leaf)' />
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								<label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 16px', background: 'var(--bf-cream-2)', borderRadius: 14, border: `1.5px solid ${form.isFeatured ? 'var(--bf-amber)' : 'var(--bf-line)'}`, transition: 'border-color .15s' }}>
									<Toggle on={form.isFeatured} onChange={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))} color='var(--bf-amber)' />
									<div>
										<div style={{ font: '700 13.5px var(--bf-font)' }}>⭐ Featured deal</div>
										<div style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 1 }}>Shown prominently on the home page</div>
									</div>
								</label>
								<label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 16px', background: 'var(--bf-cream-2)', borderRadius: 14, border: `1.5px solid ${form.isActive ? 'var(--bf-leaf)' : 'var(--bf-line)'}`, transition: 'border-color .15s' }}>
									<Toggle on={form.isActive} onChange={() => setForm(f => ({ ...f, isActive: !f.isActive }))} color='var(--bf-leaf)' />
									<div>
										<div style={{ font: '700 13.5px var(--bf-font)' }}>Active</div>
										<div style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 1 }}>Customers can see and order this deal</div>
									</div>
								</label>
							</div>
						</div>

						<hr className='bf-rule' />

						{/* ── LIMITS & TERMS ── */}
						<div>
							<SectionHeader label='LIMITS & TERMS' color='var(--bf-leaf)' />
							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									<div>
										<label className='bf-label'>Max orders <span className='bf-opt'>(quota)</span></label>
										<input
											className='bf-input bf-mono'
											type='number' min={1}
											value={form.maxOrders ?? ''}
											onChange={e => setForm(f => ({ ...f, maxOrders: e.target.value ? parseInt(e.target.value) : null }))}
											placeholder='Unlimited'
										/>
										<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 4 }}>Creates urgency bar for customers</div>
									</div>
									<div>
										<label className='bf-label'>Display order <span className='bf-opt'>(priority)</span></label>
										<input
											className='bf-input bf-mono'
											type='number' min={0}
											value={form.displayOrder ?? ''}
											onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value ? parseInt(e.target.value) : null }))}
											placeholder='0 = default'
										/>
										<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 4 }}>Lower number = appears first</div>
									</div>
								</div>
								<div>
									<label className='bf-label'>Terms & conditions <span className='bf-opt'>(optional)</span></label>
									<textarea
										className='bf-input'
										rows={2}
										value={form.termsText}
										onChange={e => setForm(f => ({ ...f, termsText: e.target.value }))}
										placeholder='e.g. Dine-in only · Not combinable with other offers · Delivery minimum Rs.500'
										style={{ resize: 'vertical', lineHeight: 1.5, fontSize: 12 }}
									/>
								</div>
							</div>
						</div>

						{error && (
							<div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
								<span>⚠</span> {error}
							</div>
						)}
					</div>

					{/* Right: live preview */}
					<div className='bf-admin-modal-preview-col bf-scroll'>
						<DealPreview form={form} items={selectedItems} />
					</div>
				</div>

				{/* Footer */}
				<div className='bf-admin-modal-footer'>
					<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
					<button
						className='bf-btn bf-btn-primary bf-btn-md'
						style={{ flex: 2, opacity: canSave ? 1 : 0.5 }}
						onClick={handleSubmit}
						disabled={saving || !canSave}
					>
						{saving ? 'Saving…' : isNew ? 'Create deal →' : 'Save changes →'}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Deal Card (grid) ─────────────────────────────────────────────────────────
function DealCard({ deal, onEdit, onToggle, onDelete, onClone, toggling }: {
	deal: Deal; onEdit: () => void; onToggle: () => void; onDelete: () => void; onClone: () => void; toggling?: boolean
}) {
	// Parse structured items (JSON or legacy)
	const itemLines = (() => {
		const raw = deal.items
		if (!raw?.trim()) return []
		if (raw.trim().startsWith('[')) {
			try {
				const parsed = JSON.parse(raw) as Array<{ name: string; qty: number; size?: string | null; availableFlavors?: string[] }>
				return parsed.map(i => {
					const parts = [`${i.qty}× ${i.name}`]
					if (i.size) parts.push(i.size)
					if (i.availableFlavors?.length) parts.push(i.availableFlavors.join(', '))
					return parts.join(' · ')
				})
			} catch { /* fall through */ }
		}
		return raw.split('\n').filter(Boolean)
	})()

	const sav = getSavings(deal.originalPrice ?? 0, deal.discountPrice ?? null)
	const expiryInfo = getExpiryInfo(deal.expiresAt)
	const startInfo = getStartInfo(deal.startsAt)
	const quotaPct = deal.maxOrders ? Math.min(100, Math.round(((deal.ordersCount ?? 0) / deal.maxOrders) * 100)) : null

	return (
		<div className='bf-card bf-lift' style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
			{/* Status bar */}
			<div style={{ height: 4, background: deal.isActive ? (deal.isFeatured ? 'var(--bf-amber)' : 'var(--bf-ember)') : 'var(--bf-line)', flexShrink: 0, transition: 'background .2s' }} />

			{/* Deal image */}
			{deal.imageUrl && (
				<div style={{ height: 110, overflow: 'hidden', flexShrink: 0 }}>
					<img src={deal.imageUrl} alt={deal.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
				</div>
			)}

			<div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
				{/* Top row: badges + status toggle */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
					{deal.isFeatured && <span className='bf-pill' style={{ background: '#FEF9C3', color: '#713f12', boxShadow: 'none', fontSize: 10 }}>⭐ Featured</span>}
					{deal.tag && <span className='bf-pill bf-pill-ink' style={{ fontSize: 10 }}>{deal.tag}</span>}
					{deal.badge && <span className='bf-pill bf-pill-ember' style={{ fontSize: 10 }}>{deal.badge}</span>}
					<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
						<span style={{ fontSize: 10.5, fontWeight: 600, color: deal.isActive ? '#166534' : 'var(--bf-mute)' }}>
							{toggling ? '…' : deal.isActive ? 'Active' : 'Paused'}
						</span>
						<div
							onClick={onToggle}
							title={deal.isActive ? 'Click to pause' : 'Click to activate'}
							style={{
								width: 38, height: 21, borderRadius: 999,
								background: deal.isActive ? 'var(--bf-ember)' : 'var(--bf-line)',
								position: 'relative', cursor: toggling ? 'default' : 'pointer',
								transition: 'background .2s', flexShrink: 0,
								opacity: toggling ? 0.6 : 1,
							}}
						>
							<div style={{ width: 15, height: 15, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: deal.isActive ? 20 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
						</div>
					</div>
				</div>

				{/* Expiry / schedule badges */}
				{(expiryInfo || startInfo) && (
					<div style={{ marginBottom: 8 }}>
						{expiryInfo && (
							<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: expiryInfo.bg, color: expiryInfo.color, fontSize: 10.5, fontWeight: 600 }}>
								⏱ {expiryInfo.text}
							</span>
						)}
						{startInfo && !expiryInfo && (
							<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(99,102,241,.1)', color: '#4338ca', fontSize: 10.5, fontWeight: 600 }}>
								📅 {startInfo}
							</span>
						)}
					</div>
				)}

				<h3 style={{ fontWeight: 800, fontSize: 16, margin: '0 0 5px', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{deal.title}</h3>
				{deal.description && <p style={{ fontSize: 12, color: 'var(--bf-ink-2)', margin: '0 0 8px', lineHeight: 1.4 }}>{deal.description}</p>}

				{itemLines.length > 0 && (
					<ul style={{ margin: '0 0 auto', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
						{itemLines.slice(0, 4).map((line, i) => (
							<li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
								<span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--bf-ember)', flexShrink: 0 }} />
								<span style={{ color: 'var(--bf-ink-2)' }}>{line}</span>
							</li>
						))}
						{itemLines.length > 4 && <li style={{ fontSize: 11, color: 'var(--bf-mute)', paddingLeft: 10 }}>+{itemLines.length - 4} more</li>}
					</ul>
				)}

				{/* Quota bar */}
				{deal.maxOrders && quotaPct !== null && (
					<div style={{ marginTop: 10 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
							<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--bf-mute)' }}>Quota</span>
							<span className='bf-mono' style={{ fontSize: 10, color: 'var(--bf-mute)' }}>{deal.ordersCount ?? 0}/{deal.maxOrders}</span>
						</div>
						<div style={{ height: 4, background: 'var(--bf-line)', borderRadius: 999, overflow: 'hidden' }}>
							<div style={{ height: '100%', width: `${quotaPct}%`, background: quotaPct > 80 ? 'var(--bf-ember)' : 'var(--bf-leaf)', transition: 'width .3s' }} />
						</div>
					</div>
				)}

				{/* Price */}
				<div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 12 }}>
					<div>
						{deal.originalPrice != null && (
							<div className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
								Rs.{deal.originalPrice.toLocaleString('en-PK')}
							</div>
						)}
						<div style={{ fontWeight: 800, fontSize: 20, color: 'var(--bf-ember)', letterSpacing: '-0.02em' }}>
							Rs.{(deal.discountPrice ?? 0).toLocaleString('en-PK')}
						</div>
					</div>
					{sav && (
						<span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 7px', borderRadius: 999, marginBottom: 2 }}>
							-{sav.pct}%
						</span>
					)}
				</div>
			</div>

			{/* Actions */}
			<div style={{ padding: '10px 16px 12px', display: 'flex', gap: 7, borderTop: '1px solid var(--bf-line)', flexShrink: 0, background: 'var(--bf-cream-2)', alignItems: 'center' }}>
				<button className='bf-btn bf-btn-outline bf-btn-sm' style={{ flex: 1, fontWeight: 700 }} onClick={onEdit}>
					{Icons.edit} Edit
				</button>
				<button
					className='bf-btn bf-btn-ghost bf-btn-icon'
					style={{ width: 34, height: 34 }}
					onClick={onClone}
					title='Clone deal'
				>
					<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
						<rect x='9' y='9' width='13' height='13' rx='2' ry='2'/><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/>
					</svg>
				</button>
				<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ color: 'var(--bf-ember)', width: 34, height: 34 }} onClick={onDelete}>
					{Icons.trash}
				</button>
			</div>
		</div>
	)
}

// ─── AdminDeals ───────────────────────────────────────────────────────────────
export function AdminDeals() {
	const { data: deals, isLoading, error, mutate } = useDeals()
	const { data: products = [] } = useProducts()
	const [modal, setModal] = useState<Deal | 'new' | null>(null)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [toggling, setToggling] = useState<number | null>(null)

	const all = deals ?? []
	const activeCount = all.filter(d => d.isActive).length
	const featuredCount = all.filter(d => d.isFeatured).length

	async function handleToggle(deal: Deal) {
		setToggling(deal.id)
		try {
			await saveDeal(deal.id, { ...deal, isActive: !deal.isActive } as Omit<Deal, 'id'>)
			await mutate()
		} finally {
			setToggling(null)
		}
	}

	async function handleDelete(id: number) {
		setDeleting(true)
		try {
			await deleteDeal(id)
			await mutate()
			setDeleteId(null)
		} finally {
			setDeleting(false)
		}
	}

	function handleClone(deal: Deal) {
		setModal({ ...deal, id: 0, title: `Copy of ${deal.title}`, isActive: false, ordersCount: 0 } as Deal)
	}

	return (
		<AdminShell active='deals'>
			<AdminTopbar
				title='Deals'
				sub={isLoading ? 'Loading…' : `${activeCount} active · ${featuredCount} featured · ${all.length} total`}
				cta='New deal'
				onCta={() => setModal('new')}
			/>

			<div className='bf-admin-page' style={{ paddingBottom: 48 }}>
				{/* Stats strip */}
				{!isLoading && !error && all.length > 0 && (
					<div className='bf-admin-stats-strip'>
						{[
							{ label: 'Total deals', value: all.length, accent: 'var(--bf-ink)' },
							{ label: 'Active now', value: activeCount, accent: 'var(--bf-ember)' },
							{ label: 'Featured', value: featuredCount, accent: '#B45309' },
						].map(s => (
							<div key={s.label} className='bf-card' style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
								<div style={{ fontWeight: 800, fontSize: 40, color: s.accent, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
								<div style={{ fontSize: 12.5, color: 'var(--bf-ink-2)', fontWeight: 600, lineHeight: 1.35 }}>{s.label}</div>
							</div>
						))}
					</div>
				)}

				{/* Grid */}
				{isLoading ? (
					<div className='bf-admin-deals-grid'>
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className='bf-card' style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
								<div style={{ display: 'flex', gap: 6 }}><Skeleton h={18} w={60} r={999} /><Skeleton h={18} w={80} r={999} /></div>
								<Skeleton h={20} w='70%' />
								<Skeleton h={12} w='90%' />
								<Skeleton h={12} w='65%' />
								<Skeleton h={26} w={90} />
							</div>
						))}
					</div>
				) : error ? (
					<div style={{ textAlign: 'center', padding: '80px 0' }}>
						<p style={{ color: 'var(--bf-mute)', marginBottom: 14, fontSize: 14 }}>Could not load deals</p>
						<button className='bf-btn bf-btn-outline bf-btn-sm' onClick={() => mutate()}>Retry</button>
					</div>
				) : all.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '80px 0' }}>
						<div style={{ fontSize: 44, marginBottom: 16, opacity: 0.18 }}>{Icons.pct}</div>
						<h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>No deals yet</h2>
						<p style={{ color: 'var(--bf-mute)', fontSize: 14, marginBottom: 22 }}>Create your first deal to attract customers</p>
						<button className='bf-btn bf-btn-primary bf-btn-md' onClick={() => setModal('new')}>{Icons.plus} Create first deal</button>
					</div>
				) : (
					<div className='bf-admin-deals-grid'>
						{all.map(deal => (
							<DealCard
								key={deal.id}
								deal={deal}
								onEdit={() => setModal(deal)}
								onToggle={() => !toggling && handleToggle(deal)}
								onDelete={() => setDeleteId(deal.id)}
								onClone={() => handleClone(deal)}
								toggling={toggling === deal.id}
							/>
						))}
						{/* Add new tile */}
						<div
							className='bf-card'
							style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 200, border: '2px dashed var(--bf-line)', background: 'transparent', boxShadow: 'none', transition: 'border-color .15s, background .15s' }}
							onClick={() => setModal('new')}
							onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bf-ember)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(232,67,31,.03)' }}
							onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bf-line)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
						>
							<div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bf-cream-2)', display: 'grid', placeItems: 'center', color: 'var(--bf-ember)' }}>{Icons.plus}</div>
							<span style={{ fontWeight: 700, fontSize: 14, color: 'var(--bf-ink-2)' }}>New deal</span>
						</div>
					</div>
				)}
			</div>

			{/* Deal modal */}
			{modal !== null && (
				<DealModal
					deal={modal === 'new' ? null : modal}
					products={products}
					onClose={() => setModal(null)}
					onSaved={async () => { await mutate(); setModal(null) }}
				/>
			)}

			{/* Delete confirm */}
			{deleteId !== null && (
				<div
					style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,32,.55)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 60 }}
					onClick={() => !deleting && setDeleteId(null)}
				>
					<div className='bf-card' style={{ padding: 28, maxWidth: 360, width: '100%', borderRadius: 18 }} onClick={e => e.stopPropagation()}>
						<div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,67,31,.1)', display: 'grid', placeItems: 'center', marginBottom: 14, color: 'var(--bf-ember)', fontSize: 20 }}>
							{Icons.trash}
						</div>
						<h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Delete deal?</h3>
						<p style={{ fontSize: 13, color: 'var(--bf-mute)', marginBottom: 22 }}>This will permanently remove this deal. Cannot be undone.</p>
						<div style={{ display: 'flex', gap: 8 }}>
							<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} disabled={deleting} onClick={() => setDeleteId(null)}>Cancel</button>
							<button
								className='bf-btn bf-btn-primary bf-btn-md'
								style={{ flex: 1, background: 'var(--bf-ember)' }}
								disabled={deleting}
								onClick={() => handleDelete(deleteId)}
							>
								{deleting ? 'Deleting…' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</AdminShell>
	)
}
