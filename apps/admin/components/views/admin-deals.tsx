'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Icons } from '../ui/icon'
import { Skeleton } from '../ui/skeleton'
import { useDeals, useProducts, saveDeal, deleteDeal } from '../../lib/hooks'
import type { Deal, Product } from '../../lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface SelectedItem {
	productId?: number
	name: string
	unitPrice: number
	qty: number
}

function serializeItems(items: SelectedItem[]): string {
	return items.filter((i) => i.name.trim()).map((i) => `${i.qty}× ${i.name.trim()}`).join('\n')
}

function parseToSelected(raw: string | null | undefined, products: Product[]): SelectedItem[] {
	if (!raw?.trim()) return []
	return raw.split('\n').filter(Boolean).map((line) => {
		const m = line.match(/^(\d+)×\s*(.+)$/)
		const qty = m ? parseInt(m[1]) : 1
		const name = m ? m[2] : line
		const product = products.find((p) => p.name.toLowerCase() === name.toLowerCase())
		return { productId: product?.id, name, unitPrice: product?.priceSmall ?? product?.price ?? 0, qty }
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

// ─── Toggle pill ──────────────────────────────────────────────────────────────
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

// ─── Product search picker (grouped by category) ─────────────────────────────
function ProductPicker({ products, selected, onAdd }: {
	products: Product[]
	selected: SelectedItem[]
	onAdd: (item: SelectedItem) => void
}) {
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	// Group filtered products by category
	const grouped = useMemo(() => {
		const q = query.trim().toLowerCase()
		const list = q
			? products.filter((p) => p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q))
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
		onAdd({ productId: p.id, name: p.name, unitPrice: p.priceSmall ?? p.price, qty: 1 })
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
					onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
					onFocus={() => setOpen(true)}
					placeholder='Search or browse all products…'
					style={{ paddingLeft: 42 }}
				/>
			</div>
			{open && hasResults && (
				<div style={{
					position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
					background: 'var(--bf-paper)', border: '1px solid var(--bf-line)',
					borderRadius: 12, boxShadow: '0 8px 32px rgba(35,31,32,.14)',
					zIndex: 200, maxHeight: 300, overflowY: 'auto',
				}} className='bf-scroll'>
					{Object.entries(grouped).map(([cat, items]) => (
						<div key={cat}>
							{/* Category header */}
							<div style={{
								padding: '8px 14px 5px',
								fontSize: 10, fontWeight: 800, letterSpacing: '.08em',
								color: 'var(--bf-mute)', textTransform: 'uppercase',
								background: 'var(--bf-cream-2)',
								borderBottom: '1px solid var(--bf-line)',
								position: 'sticky', top: 0,
							}}>
								{cat} <span style={{ fontWeight: 400, opacity: 0.7 }}>({items.length})</span>
							</div>
							{items.map((p) => {
								const isAdded = selected.some((i) => i.productId === p.id)
								const basePrice = p.priceSmall ?? p.price
								return (
									<div
										key={p.id}
										onClick={() => !isAdded && handleSelect(p)}
										style={{
											padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
											cursor: isAdded ? 'default' : 'pointer', opacity: isAdded ? 0.4 : 1,
											borderBottom: '1px solid var(--bf-line)', transition: 'background .1s',
										}}
										onMouseEnter={(e) => { if (!isAdded) (e.currentTarget as HTMLDivElement).style.background = 'var(--bf-cream-2)' }}
										onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '' }}
									>
										<div style={{ font: '600 13px var(--bf-font)', color: 'var(--bf-ink)' }}>{p.name}</div>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											{p.isHot && <span style={{ fontSize: 10 }}>🌶</span>}
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

// ─── Selected items list ──────────────────────────────────────────────────────
function SelectedItemsList({ items, onChange }: { items: SelectedItem[]; onChange: (items: SelectedItem[]) => void }) {
	if (items.length === 0) return null
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
			{items.map((item, i) => (
				<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bf-cream-2)', borderRadius: 10, padding: '9px 12px' }}>
					<div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bf-ember)', flexShrink: 0 }} />
					<div style={{ flex: 1, font: '600 13px var(--bf-font)' }}>{item.name}</div>
					<span className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)' }}>Rs.{item.unitPrice}/ea</span>
					<div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<button
							className='bf-btn bf-btn-ghost bf-btn-icon'
							style={{ width: 22, height: 22 }}
							onClick={() => item.qty <= 1
								? onChange(items.filter((_, j) => j !== i))
								: onChange(items.map((it, j) => j === i ? { ...it, qty: it.qty - 1 } : it))
							}
						>{Icons.minus}</button>
						<span style={{ width: 22, textAlign: 'center', font: '700 13px var(--bf-font)' }}>{item.qty}</span>
						<button
							className='bf-btn bf-btn-ghost bf-btn-icon'
							style={{ width: 22, height: 22 }}
							onClick={() => onChange(items.map((it, j) => j === i ? { ...it, qty: it.qty + 1 } : it))}
						>{Icons.plus}</button>
					</div>
					<span className='bf-mono' style={{ fontSize: 12, fontWeight: 700, minWidth: 68, textAlign: 'right' }}>
						Rs.{(item.unitPrice * item.qty).toLocaleString('en-PK')}
					</span>
					<button
						className='bf-btn bf-btn-ghost bf-btn-icon'
						style={{ width: 24, height: 24, color: 'var(--bf-ember)', flexShrink: 0 }}
						onClick={() => onChange(items.filter((_, j) => j !== i))}
					>{Icons.x}</button>
				</div>
			))}
		</div>
	)
}

// ─── Deal Modal ───────────────────────────────────────────────────────────────
interface DealFormState {
	title: string; tag: string; badge: string; description: string
	originalPrice: number | null; discountPrice: number | null
	isFeatured: boolean; isActive: boolean
}

const EMPTY_FORM: DealFormState = {
	title: '', tag: '', badge: '', description: '',
	originalPrice: null, discountPrice: null,
	isFeatured: false, isActive: true,
}

function DealModal({ deal, products, onClose, onSaved }: {
	deal: Deal | null
	products: Product[]
	onClose: () => void
	onSaved: () => void
}) {
	const isNew = deal === null
	const [form, setForm] = useState<DealFormState>(() =>
		deal
			? { title: deal.title, tag: deal.tag ?? '', badge: deal.badge ?? '', description: deal.description ?? '', originalPrice: deal.originalPrice ?? null, discountPrice: deal.discountPrice ?? null, isFeatured: deal.isFeatured ?? false, isActive: deal.isActive }
			: { ...EMPTY_FORM }
	)
	const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() =>
		parseToSelected(deal?.items, products)
	)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (selectedItems.length > 0) {
			setForm((f) => ({ ...f, originalPrice: calcOriginal(selectedItems) }))
		}
	}, [selectedItems])

	const savings = getSavings(form.originalPrice ?? 0, form.discountPrice)
	const priceError =
		form.originalPrice != null && form.discountPrice != null && form.discountPrice > form.originalPrice
			? `Deal price (Rs.${form.discountPrice.toLocaleString('en-PK')}) cannot exceed original price (Rs.${form.originalPrice.toLocaleString('en-PK')})`
			: null
	const canSave = form.title.trim().length > 0 && !priceError

	async function handleSubmit() {
		if (!form.title.trim()) { setError('Deal title is required'); return }
		if (priceError) { setError(priceError); return }
		setSaving(true); setError(null)
		try {
			await saveDeal(isNew ? null : deal!.id, { ...form, items: serializeItems(selectedItems) } as Omit<Deal, 'id'>)
			onSaved()
		} catch (e: unknown) {
			const axiosErr = e as { response?: { data?: { message?: string } } }
			setError(axiosErr?.response?.data?.message ?? 'Failed to save. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div
			style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,32,.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24 }}
			onClick={onClose}
		>
			<div
				className='bf-card'
				style={{ width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 22, padding: 0 }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div style={{ padding: '22px 28px 18px', borderBottom: '1px solid var(--bf-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
					<div>
						<div className='bf-eyebrow' style={{ marginBottom: 3 }}>{isNew ? 'CREATE DEAL' : 'EDIT DEAL'}</div>
						<h2 style={{ fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-0.02em' }}>
							{isNew ? 'New deal' : form.title || 'Untitled'}
						</h2>
					</div>
					<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={onClose}>{Icons.x}</button>
				</div>

				{/* Scrollable body */}
				<div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }} className='bf-scroll'>
					{/* Title */}
					<div>
						<label className='bf-label'>Deal title <span className='bf-req'>*</span></label>
						<input className='bf-input' value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder='e.g. Feast Deal 1' autoFocus />
					</div>

					{/* Tag + Badge */}
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<div>
							<label className='bf-label'>Promo tag <span className='bf-opt'>(optional)</span></label>
							<input className='bf-input bf-mono' value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value.toUpperCase() }))} placeholder='FRIDAY' style={{ fontWeight: 700, letterSpacing: '.08em' }} />
						</div>
						<div>
							<label className='bf-label'>Badge label <span className='bf-opt'>(optional)</span></label>
							<input className='bf-input' value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder='HOT · BOGO · NEW' />
						</div>
					</div>

					{/* What's included */}
					<div>
						<label className='bf-label' style={{ marginBottom: 8, display: 'block' }}>What&apos;s included <span className='bf-opt'>(optional)</span></label>
						<ProductPicker products={products} selected={selectedItems} onAdd={(item) => {
							const exists = selectedItems.some((i) => i.productId === item.productId)
							if (!exists) setSelectedItems((prev) => [...prev, item])
						}} />
						<SelectedItemsList items={selectedItems} onChange={setSelectedItems} />
					</div>

					{/* Pricing */}
					<div style={{ background: 'var(--bf-cream-2)', borderRadius: 14, padding: '16px 18px' }}>
						<div className='bf-eyebrow' style={{ marginBottom: 12 }}>PRICING</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
							<div>
								<label className='bf-label'>Original price <span className='bf-opt'>(auto)</span></label>
								<input
									className='bf-input bf-mono'
									type='number' min={0}
									value={form.originalPrice ?? ''}
									onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value ? parseFloat(e.target.value) : null }))}
									placeholder='Auto from items'
									style={{ fontWeight: 700 }}
								/>
								{selectedItems.length > 0 && (
									<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 4 }}>
										Auto-calculated from {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
									</div>
								)}
							</div>
							<div>
								<label className='bf-label'>Deal price (Rs.) <span className='bf-req'>*</span></label>
								<input
									className='bf-input bf-mono'
									type='number' min={0}
									value={form.discountPrice ?? ''}
									onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value ? parseFloat(e.target.value) : null }))}
									placeholder='990'
									style={{ fontWeight: 700, color: 'var(--bf-ember)' }}
								/>
							</div>
						</div>
						{priceError ? (
							<div style={{ marginTop: 12, padding: '9px 13px', borderRadius: 8, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
								<span>⚠️</span> {priceError}
							</div>
						) : savings ? (
							<div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: '#DCFCE7', borderRadius: 8, padding: '9px 13px' }}>
								<span style={{ fontSize: 15 }}>🎉</span>
								<span style={{ fontSize: 12.5, fontWeight: 700, color: '#166534' }}>
									Customers save Rs.{savings.amount.toLocaleString('en-PK')} — {savings.pct}% off!
								</span>
							</div>
						) : null}
					</div>

					{/* Options */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						<div className='bf-eyebrow' style={{ marginBottom: 4 }}>OPTIONS</div>
						<label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '12px 16px', background: 'var(--bf-cream-2)', borderRadius: 12 }}>
							<Toggle on={form.isFeatured} onChange={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))} color='var(--bf-amber)' />
							<div>
								<div style={{ font: '700 13.5px var(--bf-font)' }}>⭐ Featured deal</div>
								<div style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 1 }}>Shown prominently on the home page</div>
							</div>
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '12px 16px', background: 'var(--bf-cream-2)', borderRadius: 12 }}>
							<Toggle on={form.isActive} onChange={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} />
							<div>
								<div style={{ font: '700 13.5px var(--bf-font)' }}>Active</div>
								<div style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 1 }}>Customers can see and order this deal</div>
							</div>
						</label>
					</div>

					{/* Description */}
					<div>
						<label className='bf-label'>Description <span className='bf-opt'>(optional)</span></label>
						<textarea className='bf-input' rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder='Short tagline shown on the deal card…' style={{ resize: 'vertical' }} />
					</div>

					{error && (
						<div style={{ padding: '9px 13px', borderRadius: 10, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 12.5, fontWeight: 600 }}>
							{error}
						</div>
					)}
				</div>

				{/* Footer */}
				<div style={{ padding: '16px 28px', borderTop: '1px solid var(--bf-line)', display: 'flex', gap: 10, flexShrink: 0, background: 'var(--bf-cream-2)' }}>
					<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
					<button className='bf-btn bf-btn-primary bf-btn-md' style={{ flex: 2, opacity: canSave ? 1 : 0.5 }} onClick={handleSubmit} disabled={saving || !canSave}>
						{saving ? 'Saving…' : isNew ? 'Create deal →' : 'Save changes'}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Deal Card (grid) ─────────────────────────────────────────────────────────
function DealCard({ deal, onEdit, onToggle, onDelete, toggling }: {
	deal: Deal; onEdit: () => void; onToggle: () => void; onDelete: () => void; toggling?: boolean
}) {
	const itemLines = deal.items?.split('\n').filter(Boolean) ?? []
	const sav = getSavings(deal.originalPrice ?? 0, deal.discountPrice ?? null)

	return (
		<div className='bf-card bf-lift' style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
			{/* Status bar */}
			<div style={{ height: 4, background: deal.isActive ? (deal.isFeatured ? 'var(--bf-amber)' : 'var(--bf-ember)') : 'var(--bf-line)', flexShrink: 0, transition: 'background .2s' }} />

			<div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
				{/* Top row: badges + active toggle */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
					{deal.isFeatured && (
						<span className='bf-pill' style={{ background: '#FEF9C3', color: '#713f12', boxShadow: 'none', fontSize: 10 }}>⭐ Featured</span>
					)}
					{deal.tag && <span className='bf-pill bf-pill-ink' style={{ fontSize: 10 }}>{deal.tag}</span>}
					{deal.badge && <span className='bf-pill bf-pill-ember' style={{ fontSize: 10 }}>{deal.badge}</span>}

					{/* Active / Pause toggle — right side */}
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
							<div style={{
								width: 15, height: 15, borderRadius: '50%', background: '#fff',
								position: 'absolute', top: 3, left: deal.isActive ? 20 : 3,
								transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)',
							}} />
						</div>
					</div>
				</div>

				{/* Title */}
				<h3 style={{ fontWeight: 800, fontSize: 16, margin: '0 0 5px', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{deal.title}</h3>

				{deal.description && (
					<p style={{ fontSize: 12, color: 'var(--bf-ink-2)', margin: '0 0 8px', lineHeight: 1.4 }}>{deal.description}</p>
				)}

				{/* Items */}
				{itemLines.length > 0 && (
					<ul style={{ margin: '0 0 auto', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
						{itemLines.slice(0, 4).map((line, i) => (
							<li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
								<span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--bf-ember)', flexShrink: 0 }} />
								<span style={{ color: 'var(--bf-ink-2)' }}>{line}</span>
							</li>
						))}
						{itemLines.length > 4 && (
							<li style={{ fontSize: 11, color: 'var(--bf-mute)', paddingLeft: 10 }}>+{itemLines.length - 4} more</li>
						)}
					</ul>
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
			<div style={{ padding: '10px 16px 12px', display: 'flex', gap: 7, borderTop: '1px solid var(--bf-line)', flexShrink: 0, background: 'var(--bf-cream-2)' }}>
				<button className='bf-btn bf-btn-outline bf-btn-sm' style={{ flex: 1, fontWeight: 700 }} onClick={onEdit}>
					{Icons.edit} Edit
				</button>
				<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ color: 'var(--bf-ember)', width: 34, height: 34 }} onClick={onDelete}>
					{Icons.trash}
				</button>
			</div>
		</div>
	)
}

// ─── AdminDeals ────────────────────────────────────────────────────────────────
export function AdminDeals() {
	const { data: deals, isLoading, error, mutate } = useDeals()
	const { data: products = [] } = useProducts()
	const [modal, setModal] = useState<Deal | 'new' | null>(null)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [toggling, setToggling] = useState<number | null>(null)

	const all = deals ?? []
	const activeCount = all.filter((d) => d.isActive).length
	const featuredCount = all.filter((d) => d.isFeatured).length

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

	return (
		<AdminShell active='deals'>
			<AdminTopbar
				title='Deals'
				sub={isLoading ? 'Loading…' : `${activeCount} active · ${featuredCount} featured · ${all.length} total`}
				cta='New deal'
				onCta={() => setModal('new')}
			/>

			<div style={{ padding: '28px 28px 48px' }}>
				{/* Stats strip */}
				{!isLoading && !error && all.length > 0 && (
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
						{[
							{ label: 'Total deals', value: all.length, accent: 'var(--bf-ink)' },
							{ label: 'Active now', value: activeCount, accent: 'var(--bf-ember)' },
							{ label: 'Featured', value: featuredCount, accent: '#B45309' },
						].map((s) => (
							<div key={s.label} className='bf-card' style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
								<div style={{ fontWeight: 800, fontSize: 36, color: s.accent, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
								<div style={{ fontSize: 12.5, color: 'var(--bf-ink-2)', fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
							</div>
						))}
					</div>
				)}

				{/* Deals grid */}
				{isLoading ? (
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className='bf-card' style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
								<div style={{ display: 'flex', gap: 6 }}><Skeleton h={18} w={60} r={999} /><Skeleton h={18} w={80} r={999} /></div>
								<Skeleton h={20} w='70%' />
								<Skeleton h={12} w='90%' />
								<Skeleton h={12} w='65%' />
								<Skeleton h={12} w='75%' />
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
					<div style={{ textAlign: 'center', padding: '100px 0' }}>
						<div style={{ fontSize: 44, marginBottom: 16, opacity: 0.18 }}>{Icons.pct}</div>
						<h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>No deals yet</h2>
						<p style={{ color: 'var(--bf-mute)', fontSize: 14, marginBottom: 22 }}>Create your first deal to attract customers</p>
						<button className='bf-btn bf-btn-primary bf-btn-md' onClick={() => setModal('new')}>{Icons.plus} Create first deal</button>
					</div>
				) : (
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
						{all.map((deal) => (
							<DealCard
								key={deal.id}
								deal={deal}
								onEdit={() => setModal(deal)}
								onToggle={() => !toggling && handleToggle(deal)}
								onDelete={() => setDeleteId(deal.id)}
								toggling={toggling === deal.id}
							/>
						))}
						{/* Add new tile */}
						<div
							className='bf-card'
							style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 200, border: '2px dashed var(--bf-line)', background: 'transparent', boxShadow: 'none', transition: 'border-color .15s, background .15s' }}
							onClick={() => setModal('new')}
							onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bf-ember)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(232,67,31,.03)' }}
							onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bf-line)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
						>
							<div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bf-cream-2)', display: 'grid', placeItems: 'center', color: 'var(--bf-ember)' }}>{Icons.plus}</div>
							<span style={{ fontWeight: 700, fontSize: 14, color: 'var(--bf-ink-2)' }}>New deal</span>
						</div>
					</div>
				)}
			</div>

			{/* Modal */}
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
					<div className='bf-card' style={{ padding: 28, maxWidth: 360, width: '100%', borderRadius: 18 }} onClick={(e) => e.stopPropagation()}>
						<h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Delete deal?</h3>
						<p style={{ fontSize: 13, color: 'var(--bf-mute)', marginBottom: 20 }}>This will permanently remove this deal. Cannot be undone.</p>
						<div style={{ display: 'flex', gap: 8 }}>
							<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} disabled={deleting} onClick={() => setDeleteId(null)}>Cancel</button>
							<button className='bf-btn bf-btn-primary bf-btn-md' style={{ flex: 1 }} disabled={deleting} onClick={() => handleDelete(deleteId)}>
								{deleting ? 'Deleting…' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</AdminShell>
	)
}
