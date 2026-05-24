'use client'
import React, { useState, useMemo } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Icons } from '../ui/icon'
import { FoodImg, type Tone } from '../ui/food-img'
import { ImageUploader } from '../ui/image-uploader'
import { Skeleton } from '../ui/skeleton'
import {
	useProducts,
	useCategories,
	useSubCategories,
	createProduct,
	updateProduct,
	deleteProduct,
	createCategory,
	updateCategory,
	deleteCategory,
	createSubCategory,
	updateSubCategory,
	deleteSubCategory,
	rs,
} from '../../lib/hooks'
import type { Product, Category } from '../../lib/types'

const TONES: Tone[] = ['ember', 'amber', 'cream', 'ember', 'amber', 'cream']

// ─── Types ────────────────────────────────────────────────────────────────────
type PricingMode = 'fixed' | 'sizes'
type DiscountMode = 'none' | 'pct' | 'flat'

interface ProductSize {
	name: string
	price: number | null
}

interface ProductForm {
	name: string
	description: string
	categoryId: number | null
	category: string
	subCategoryId: number | null
	imageUrl: string | null
	isAvailable: boolean
	isHot: boolean
	pricingMode: PricingMode
	// Fixed
	price: number
	// Sizes (dynamic)
	sizes: ProductSize[]
	// Discount
	discountMode: DiscountMode
	discountPct: number | null
	discountAmount: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcEffective(price: number, mode: DiscountMode, pct: number | null, amount: number | null): number {
	if (mode === 'pct' && pct && pct > 0) return Math.max(0, Math.round(price * (1 - pct / 100)))
	if (mode === 'flat' && amount && amount > 0) return Math.max(0, Math.round(price - amount))
	return price
}

function discountModeFromProduct(p: Product): DiscountMode {
	if (p.discountPct && p.discountPct > 0) return 'pct'
	if (p.discountAmount && p.discountAmount > 0) return 'flat'
	return 'none'
}

function parseSizesJson(p: Product): ProductSize[] {
	if (p.sizesJson) {
		try {
			const parsed = JSON.parse(p.sizesJson) as ProductSize[]
			if (Array.isArray(parsed) && parsed.length > 0) return parsed
		} catch {
			// fall through to legacy
		}
	}
	// Legacy fallback
	const sizes: ProductSize[] = []
	if (p.priceSmall) sizes.push({ name: p.labelSmall ?? 'Small', price: p.priceSmall })
	if (p.priceMedium) sizes.push({ name: p.labelMedium ?? 'Medium', price: p.priceMedium })
	if (p.priceLarge) sizes.push({ name: p.labelLarge ?? 'Large', price: p.priceLarge })
	return sizes.length > 0 ? sizes : [{ name: '', price: null }, { name: '', price: null }]
}

function formFromProduct(p: Product): ProductForm {
	const dm = discountModeFromProduct(p)
	return {
		name: p.name,
		description: p.description ?? '',
		categoryId: p.categoryId ?? null,
		category: p.category,
		subCategoryId: p.subCategoryId ?? null,
		imageUrl: p.imageUrl ?? null,
		isAvailable: p.isAvailable,
		isHot: p.isHot ?? false,
		pricingMode: p.hasSizes ? 'sizes' : 'fixed',
		price: p.price,
		sizes: p.hasSizes ? parseSizesJson(p) : [{ name: '', price: null }, { name: '', price: null }],
		discountMode: dm,
		discountPct: p.discountPct ?? null,
		discountAmount: p.discountAmount ?? null,
	}
}

function mapFormToPayload(form: ProductForm) {
	const hasSizes = form.pricingMode === 'sizes'
	const validSizes = hasSizes ? form.sizes.filter(s => s.price && s.price > 0) : []
	const basePrice = hasSizes && validSizes.length > 0 ? (validSizes[0].price ?? 0) : form.price
	return {
		name: form.name.trim(),
		description: form.description.trim() || null,
		categoryId: form.categoryId,
		category: form.category,
		subCategoryId: form.subCategoryId,
		imageUrl: form.imageUrl,
		isAvailable: form.isAvailable,
		isHot: form.isHot,
		hasSizes,
		price: basePrice,
		// Legacy size fields (first 3 for backward compat)
		priceSmall: validSizes[0]?.price ?? null,
		priceMedium: validSizes[1]?.price ?? null,
		priceLarge: validSizes[2]?.price ?? null,
		labelSmall: validSizes[0]?.name?.trim() || null,
		labelMedium: validSizes[1]?.name?.trim() || null,
		labelLarge: validSizes[2]?.name?.trim() || null,
		// Full sizes list as JSON
		sizesJson: hasSizes && validSizes.length > 0 ? JSON.stringify(validSizes) : null,
		discountPct: form.discountMode === 'pct' ? form.discountPct : null,
		discountAmount: form.discountMode === 'flat' ? form.discountAmount : null,
	}
}

const EMPTY_FORM: ProductForm = {
	name: '',
	description: '',
	categoryId: null,
	category: '',
	subCategoryId: null,
	imageUrl: null,
	isAvailable: true,
	isHot: false,
	pricingMode: 'fixed',
	price: 0,
	sizes: [{ name: '', price: null }, { name: '', price: null }],
	discountMode: 'none',
	discountPct: null,
	discountAmount: null,
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ num, title }: { num: number; title: string }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
			<div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bf-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
				<span style={{ font: '700 11px var(--bf-mono)', color: '#fff' }}>{num}</span>
			</div>
			<span style={{ font: '700 12px var(--bf-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--bf-ink-2)' }}>{title}</span>
		</div>
	)
}

// ─── Pricing mode card ────────────────────────────────────────────────────────
function PriceModeCard({ active, icon, title, desc, onClick }: {
	active: boolean; icon: React.ReactNode; title: string; desc: string; onClick: () => void
}) {
	return (
		<button
			onClick={onClick}
			style={{
				flex: 1, padding: '14px 16px', borderRadius: 14,
				border: `2px solid ${active ? 'var(--bf-ink)' : 'var(--bf-line-2)'}`,
				background: active ? 'var(--bf-ink)' : 'var(--bf-paper)',
				cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
				display: 'flex', flexDirection: 'column', gap: 5,
			}}
		>
			<div style={{ color: active ? '#fff' : 'var(--bf-ember)', fontSize: 18 }}>{icon}</div>
			<div style={{ font: '700 13px var(--bf-font)', color: active ? '#fff' : 'var(--bf-ink)' }}>{title}</div>
			<div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,.6)' : 'var(--bf-mute)', lineHeight: 1.4 }}>{desc}</div>
		</button>
	)
}

// ─── Discount section ─────────────────────────────────────────────────────────
function DiscountSection({ form, setForm, basePrice }: {
	form: ProductForm
	setForm: React.Dispatch<React.SetStateAction<ProductForm>>
	basePrice: number
}) {
	const modes: { key: DiscountMode; label: string }[] = [
		{ key: 'none', label: 'No discount' },
		{ key: 'pct', label: '% off' },
		{ key: 'flat', label: 'Rs. off' },
	]
	const effective = calcEffective(basePrice, form.discountMode, form.discountPct, form.discountAmount)
	const hasSavings = form.discountMode !== 'none' && effective < basePrice && basePrice > 0

	return (
		<div style={{ marginTop: 16, background: 'var(--bf-cream-2)', borderRadius: 14, padding: '14px 16px' }}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
				<span className='bf-eyebrow'>DISCOUNT</span>
				<span style={{ fontSize: 10.5, color: 'var(--bf-mute)', fontWeight: 400 }}>Optional · applies to all sizes</span>
			</div>

			<div style={{ display: 'flex', gap: 6, marginBottom: form.discountMode !== 'none' ? 12 : 0 }}>
				{modes.map(m => (
					<button
						key={m.key}
						onClick={() => setForm(f => ({ ...f, discountMode: m.key, discountPct: null, discountAmount: null }))}
						style={{
							flex: 1, padding: '9px 6px', borderRadius: 10,
							border: `1.5px solid ${form.discountMode === m.key ? 'var(--bf-ink)' : 'var(--bf-line-2)'}`,
							background: form.discountMode === m.key ? 'var(--bf-ink)' : 'var(--bf-paper)',
							color: form.discountMode === m.key ? '#fff' : 'var(--bf-ink-2)',
							font: '600 11.5px var(--bf-font)', cursor: 'pointer', transition: 'all .15s',
						}}
					>
						{m.label}
					</button>
				))}
			</div>

			{form.discountMode !== 'none' && (
				<>
					<div>
						<label className='bf-label'>
							{form.discountMode === 'pct' ? 'Percentage off (%)' : 'Amount off (Rs.)'}
						</label>
						<div style={{ position: 'relative' }}>
							{form.discountMode === 'flat' && (
								<span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11.5, fontWeight: 700, color: 'var(--bf-mute)', pointerEvents: 'none' }}>Rs.</span>
							)}
							<input
								className='bf-input bf-mono'
								type='number'
								min={0}
								max={form.discountMode === 'pct' ? 100 : undefined}
								value={(form.discountMode === 'pct' ? form.discountPct : form.discountAmount) ?? ''}
								onChange={e => {
									const val = parseFloat(e.target.value) || null
									setForm(f => f.discountMode === 'pct'
										? { ...f, discountPct: val }
										: { ...f, discountAmount: val })
								}}
								placeholder={form.discountMode === 'pct' ? '20' : '100'}
								style={{
									paddingLeft: form.discountMode === 'flat' ? 36 : 14,
									fontWeight: 700, fontSize: 15,
								}}
							/>
							{form.discountMode === 'pct' && (
								<span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 800, color: 'var(--bf-ember)', pointerEvents: 'none' }}>%</span>
							)}
						</div>
					</div>

					{hasSavings ? (
						<div style={{ marginTop: 10, padding: '11px 14px', borderRadius: 10, background: '#DCFCE7', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 8 }}>
							<span style={{ fontSize: 16 }}>🎉</span>
							<div>
								<div style={{ font: '700 13px var(--bf-font)', color: '#15803d' }}>
									Starting from <span style={{ fontFamily: 'var(--bf-mono)' }}>Rs.{effective.toLocaleString('en-PK')}</span>
								</div>
								<div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
									{form.discountMode === 'pct' && form.discountPct ? `${form.discountPct}% off all sizes` : `Rs.${form.discountAmount} off every size`}
								</div>
							</div>
						</div>
					) : basePrice > 0 ? (
						<div style={{ marginTop: 10, padding: '9px 13px', borderRadius: 10, background: 'rgba(232,67,31,.08)', color: 'var(--bf-ember)', fontSize: 12, fontWeight: 600 }}>
							Enter a {form.discountMode === 'pct' ? 'percentage' : 'amount'} to preview savings
						</div>
					) : null}
				</>
			)}
		</div>
	)
}

// ─── Dynamic size row ─────────────────────────────────────────────────────────
function SizeRowItem({ idx, total, size, form, onChange, onRemove }: {
	idx: number
	total: number
	size: ProductSize
	form: ProductForm
	onChange: (s: ProductSize) => void
	onRemove: () => void
}) {
	const effective = calcEffective(size.price ?? 0, form.discountMode, form.discountPct, form.discountAmount)
	const hasDiscount = form.discountMode !== 'none' && (size.price ?? 0) > 0 && effective < (size.price ?? 0)
	const isRequired = idx < 2

	return (
		<div className='bf-admin-size-row' style={{
			borderBottom: idx < total - 1 ? '1px solid var(--bf-line)' : 'none',
		}}>
			{/* Index badge */}
			<div style={{
				width: 26, height: 26, borderRadius: 8,
				background: 'var(--bf-cream-2)',
				border: '1.5px solid var(--bf-line)',
				display: 'grid', placeItems: 'center',
				font: '700 11px var(--bf-mono)', color: 'var(--bf-mute)',
			}}>
				{idx + 1}
			</div>

			{/* Name input */}
			<div>
				{idx === 0 && (
					<label className='bf-label' style={{ marginBottom: 4 }}>
						Size name <span className='bf-req'>*</span>
					</label>
				)}
				<input
					className='bf-input'
					value={size.name}
					onChange={e => onChange({ ...size, name: e.target.value })}
					placeholder={idx === 0 ? 'e.g. Small, Half, 9 inch…' : idx === 1 ? 'e.g. Medium, Full, 12 inch…' : 'e.g. Large, Jumbo, 18 inch…'}
					style={{ fontSize: 13 }}
				/>
			</div>

			{/* Price input */}
			<div>
				{idx === 0 && (
					<label className='bf-label' style={{ marginBottom: 4 }}>
						Price {isRequired && <span className='bf-req'>*</span>}
					</label>
				)}
				<div style={{ position: 'relative' }}>
					<span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10.5, fontWeight: 700, color: 'var(--bf-mute)', pointerEvents: 'none' }}>Rs.</span>
					<input
						className='bf-input bf-mono'
						type='number'
						min={0}
						value={size.price ?? ''}
						onChange={e => onChange({ ...size, price: parseFloat(e.target.value) || null })}
						placeholder='500'
						style={{ paddingLeft: 30, fontWeight: 700 }}
					/>
				</div>
			</div>

			{/* Final price */}
			<div className='bf-admin-size-row-final'>
				{idx === 0 && <label className='bf-label' style={{ marginBottom: 4 }}>Final price</label>}
				<div style={{
					height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
					background: hasDiscount ? '#DCFCE7' : 'var(--bf-cream-2)',
					border: `1px solid ${hasDiscount ? '#86efac' : 'var(--bf-line)'}`,
					transition: 'all .2s',
				}}>
					{size.price ? (
						<div style={{ textAlign: 'center' }}>
							{hasDiscount && (
								<div className='bf-mono' style={{ fontSize: 9, color: 'var(--bf-mute)', textDecoration: 'line-through', lineHeight: 1 }}>
									{size.price.toLocaleString('en-PK')}
								</div>
							)}
							<span className='bf-mono' style={{ fontWeight: 800, fontSize: 12, color: hasDiscount ? '#15803d' : 'var(--bf-ink)' }}>
								Rs.{effective.toLocaleString('en-PK')}
							</span>
						</div>
					) : (
						<span style={{ fontSize: 11, color: 'var(--bf-mute)' }}>—</span>
					)}
				</div>
			</div>

			{/* Remove button */}
			<div className='bf-admin-size-row-remove' style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
				{total > 2 && (
					<button
						onClick={onRemove}
						style={{
							width: 26, height: 26, borderRadius: 6, border: 'none',
							background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)',
							cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 12,
							transition: 'background .15s',
						}}
						title='Remove size'
					>
						✕
					</button>
				)}
			</div>
		</div>
	)
}

// ─── Live product preview ─────────────────────────────────────────────────────
function ProductPreview({ form }: { form: ProductForm }) {
	const name = form.name.trim() || 'Product name'
	const cat = form.category || 'Category'
	const hasSizes = form.pricingMode === 'sizes'
	const effective = calcEffective(form.price, form.discountMode, form.discountPct, form.discountAmount)
	const hasFixedDiscount = !hasSizes && form.discountMode !== 'none' && effective < form.price && form.price > 0
	const validSizes = form.sizes.filter(s => s.price && s.price > 0)

	return (
		<div>
			<div className='bf-eyebrow' style={{ marginBottom: 14 }}>CUSTOMER PREVIEW</div>
			<div className='bf-card' style={{ padding: 0, overflow: 'hidden' }}>
				<div style={{ height: 3, background: form.isAvailable ? 'var(--bf-leaf)' : 'var(--bf-line)' }} />
				{form.imageUrl ? (
					<img src={form.imageUrl} alt='' style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
				) : (
					<FoodImg tone='ember' style={{ width: '100%', height: 110, borderRadius: 0, border: 0 }} />
				)}
				<div style={{ padding: '12px 14px 14px' }}>
					{/* Badges */}
					<div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
						{form.isHot && <span className='bf-pill bf-pill-ember' style={{ fontSize: 9.5 }}>🌶 HOT</span>}
						{form.discountMode !== 'none' && (
							<span style={{ fontSize: 9.5, fontWeight: 700, background: '#DCFCE7', color: '#15803d', padding: '3px 8px', borderRadius: 999 }}>
								{form.discountMode === 'pct' && form.discountPct ? `${form.discountPct}% OFF` : ''}
								{form.discountMode === 'flat' && form.discountAmount ? `Rs.${form.discountAmount} OFF` : ''}
							</span>
						)}
						{!form.isAvailable && <span className='bf-pill' style={{ fontSize: 9.5, opacity: 0.6 }}>UNAVAILABLE</span>}
					</div>

					<div style={{ font: '700 13px var(--bf-font)', lineHeight: 1.3, marginBottom: 3 }}>{name}</div>
					<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginBottom: 10 }}>{cat}</div>

					{hasSizes ? (
						validSizes.length > 0 ? (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
								{validSizes.map((s, i) => {
									const eff = calcEffective(s.price ?? 0, form.discountMode, form.discountPct, form.discountAmount)
									const hasDis = form.discountMode !== 'none' && eff < (s.price ?? 0)
									return (
										<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'var(--bf-cream-2)', borderRadius: 8 }}>
											<span style={{ fontSize: 10.5, fontWeight: 600 }}>{s.name || `Size ${i + 1}`}</span>
											<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
												{hasDis && <span className='bf-mono' style={{ fontSize: 9, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>Rs.{(s.price ?? 0).toLocaleString('en-PK')}</span>}
												<span className='bf-mono' style={{ fontWeight: 800, fontSize: 11.5, color: 'var(--bf-ember)' }}>Rs.{eff.toLocaleString('en-PK')}</span>
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<div style={{ fontSize: 11, color: 'var(--bf-mute)', fontStyle: 'italic' }}>Enter size prices above</div>
						)
					) : (
						<div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
							{hasFixedDiscount && (
								<div className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)', textDecoration: 'line-through', marginBottom: 1 }}>
									Rs.{form.price.toLocaleString('en-PK')}
								</div>
							)}
							<div style={{ font: '800 17px var(--bf-mono)', color: 'var(--bf-ember)', letterSpacing: '-.02em' }}>
								{form.price > 0 ? `Rs.${effective.toLocaleString('en-PK')}` : 'Rs. —'}
							</div>
							{hasFixedDiscount && (
								<span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803d', padding: '2px 6px', borderRadius: 999, marginBottom: 2 }}>
									{form.discountMode === 'pct' && form.discountPct ? `-${form.discountPct}%` : `-Rs.${form.discountAmount}`}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Checklist */}
			<div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
				{[
					{ ok: !!form.name.trim(), label: 'Product name' },
					{ ok: !!form.category, label: 'Category' },
					{
						ok: form.pricingMode === 'fixed'
							? form.price > 0
							: form.sizes.filter(s => s.price && s.price > 0).length >= 1,
						label: 'Price set',
					},
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
						<span style={{ fontSize: 11.5, color: ok ? '#15803d' : 'var(--bf-mute)', fontWeight: ok ? 600 : 400 }}>{label}</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ mode, product, categories, onClose, onSaved, onCategoryCreate }: {
	mode: 'add' | 'edit'
	product: Product | null
	categories: Category[]
	onClose: () => void
	onSaved: () => void
	onCategoryCreate: (name: string) => Promise<Category>
}) {
	const [form, setForm] = useState<ProductForm>(() =>
		product ? formFromProduct(product) : { ...EMPTY_FORM }
	)
	const [saving, setSaving] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [catDialogOpen, setCatDialogOpen] = useState(false)
	const [newCatName, setNewCatName] = useState('')
	const [creatingCat, setCreatingCat] = useState(false)
	const [catError, setCatError] = useState<string | null>(null)
	const [subCatDialogOpen, setSubCatDialogOpen] = useState(false)
	const [newSubCatName, setNewSubCatName] = useState('')
	const [creatingSubCat, setCreatingSubCat] = useState(false)
	const [subCatError, setSubCatError] = useState<string | null>(null)

	const { data: subCategories, mutate: refreshSubCats } = useSubCategories(form.categoryId)

	function updateSize(idx: number, s: ProductSize) {
		setForm(f => ({ ...f, sizes: f.sizes.map((v, i) => i === idx ? s : v) }))
	}

	function removeSize(idx: number) {
		setForm(f => ({ ...f, sizes: f.sizes.filter((_, i) => i !== idx) }))
	}

	function addSize() {
		setForm(f => ({ ...f, sizes: [...f.sizes, { name: '', price: null }] }))
	}

	async function handleSave() {
		if (!form.name.trim()) { setSaveError('Product name is required.'); return }
		if (!form.category) { setSaveError('Please select a category.'); return }
		if (form.pricingMode === 'fixed') {
			if (!(form.price > 0)) { setSaveError('Price is required.'); return }
		} else {
			const valid = form.sizes.filter(s => s.price && s.price > 0)
			if (valid.length < 1) { setSaveError('Add at least one size with a price.'); return }
		}
		if (form.discountMode === 'pct' && form.discountPct && (form.discountPct <= 0 || form.discountPct >= 100)) {
			setSaveError('Percentage must be between 1 and 99.'); return
		}
		setSaving(true)
		setSaveError(null)
		try {
			const payload = mapFormToPayload(form)
			if (mode === 'edit' && product) {
				await updateProduct(product.id, payload as Parameters<typeof updateProduct>[1])
			} else {
				await createProduct(payload as Parameters<typeof createProduct>[0])
			}
			onSaved()
		} catch {
			setSaveError('Failed to save. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	async function handleCreateCategory() {
		const name = newCatName.trim()
		if (!name) { setCatError('Name is required.'); return }
		setCreatingCat(true)
		setCatError(null)
		try {
			const cat = await onCategoryCreate(name)
			setForm(f => ({ ...f, categoryId: cat.id, category: cat.name, subCategoryId: null }))
			setNewCatName('')
			setCatDialogOpen(false)
		} catch {
			setCatError('Failed to create category.')
		} finally {
			setCreatingCat(false)
		}
	}

	async function handleCreateSubCategory() {
		if (!form.categoryId) return
		const name = newSubCatName.trim()
		if (!name) { setSubCatError('Name is required.'); return }
		setCreatingSubCat(true)
		setSubCatError(null)
		try {
			const sub = await createSubCategory({ categoryId: form.categoryId, name })
			await refreshSubCats()
			setForm(f => ({ ...f, subCategoryId: sub.id }))
			setNewSubCatName('')
			setSubCatDialogOpen(false)
		} catch {
			setSubCatError('Failed to create sub-category.')
		} finally {
			setCreatingSubCat(false)
		}
	}

	const validSizes = form.sizes.filter(s => s.price && s.price > 0)
	const basePrice = form.pricingMode === 'sizes' ? (validSizes[0]?.price ?? 0) : form.price

	return (
		<div className='bf-admin-modal-wrap' onClick={onClose}>
			<div
				className='bf-admin-modal-inner'
				onClick={e => e.stopPropagation()}
			>
				{/* Header */}
				<div className='bf-admin-modal-header'>
					<div>
						<div className='bf-eyebrow' style={{ marginBottom: 3 }}>{mode === 'add' ? 'ADD PRODUCT' : 'EDIT PRODUCT'}</div>
						<h2 style={{ fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-.025em' }}>
							{form.name.trim() || (mode === 'add' ? 'New product' : 'Edit product')}
						</h2>
					</div>
					<button className='bf-btn bf-btn-outline bf-btn-icon' onClick={onClose}>{Icons.x}</button>
				</div>

				{/* Body: 2-column */}
				<div className='bf-admin-modal-body bf-scroll'>

					{/* Left: form */}
					<div className='bf-admin-modal-form-col bf-scroll'>

						{/* Section 1: Identity */}
						<div>
							<SectionLabel num={1} title='Product details' />
							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div>
									<label className='bf-label'>Name <span className='bf-req'>*</span></label>
									<input
										className='bf-input'
										value={form.name}
										onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
										placeholder='e.g. Buddy Pepperoni Pizza'
										autoFocus
										style={{ fontSize: 15, fontWeight: 600 }}
									/>
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
									<div>
										<label className='bf-label'>Category <span className='bf-req'>*</span></label>
										<select
											className='bf-input'
											value={form.categoryId ?? ''}
											onChange={e => {
												const cat = categories.find(c => c.id === Number(e.target.value))
												setForm(f => ({ ...f, categoryId: cat?.id ?? null, category: cat?.name ?? '', subCategoryId: null }))
											}}
										>
											<option value='' disabled>Select category</option>
											{categories.map(c => (
												<option key={c.id} value={c.id}>{c.name}</option>
											))}
										</select>
									</div>
									<button
										className='bf-btn bf-btn-outline bf-btn-sm'
										onClick={() => { setCatError(null); setCatDialogOpen(true) }}
										style={{ whiteSpace: 'nowrap', height: 44 }}
									>
										{Icons.plus} New
									</button>
								</div>

								{/* Sub-category row — only shown when a category is selected */}
								{form.categoryId != null && (
									<div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
										<div>
											<label className='bf-label'>Sub-category <span style={{ color: 'var(--bf-mute)', fontWeight: 400 }}>(optional)</span></label>
											<select
												className='bf-input'
												value={form.subCategoryId ?? ''}
												onChange={e => setForm(f => ({ ...f, subCategoryId: e.target.value ? Number(e.target.value) : null }))}
											>
												<option value=''>None</option>
												{(subCategories ?? []).map(s => (
													<option key={s.id} value={s.id}>{s.name}</option>
												))}
											</select>
										</div>
										<button
											className='bf-btn bf-btn-outline bf-btn-sm'
											onClick={() => { setSubCatError(null); setSubCatDialogOpen(true) }}
											style={{ whiteSpace: 'nowrap', height: 44 }}
										>
											{Icons.plus} New
										</button>
									</div>
								)}
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
									{([
										{ key: 'isHot' as const, icon: '🌶', label: 'Hot item', desc: 'Shows a hot badge' },
										{ key: 'isAvailable' as const, icon: '✓', label: 'Available', desc: 'Visible to customers' },
									]).map(({ key, icon, label, desc }) => (
										<button
											key={key}
											onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
											style={{
												padding: '12px 14px', borderRadius: 12, textAlign: 'left',
												border: `1.5px solid ${form[key] ? 'var(--bf-ink)' : 'var(--bf-line-2)'}`,
												background: form[key] ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
												cursor: 'pointer', transition: 'all .15s',
											}}
										>
											<div style={{ font: '700 13px var(--bf-font)', color: form[key] ? 'var(--bf-ink)' : 'var(--bf-mute)' }}>
												{icon} {label}
											</div>
											<div style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 2 }}>{desc}</div>
										</button>
									))}
								</div>
							</div>
						</div>

						<hr className='bf-rule' />

						{/* Section 2: Pricing */}
						<div>
							<SectionLabel num={2} title='Pricing' />
							<div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
								<PriceModeCard
									active={form.pricingMode === 'fixed'}
									icon={<>₹</>}
									title='Fixed price'
									desc='One price for all customers'
									onClick={() => setForm(f => ({ ...f, pricingMode: 'fixed' }))}
								/>
								<PriceModeCard
									active={form.pricingMode === 'sizes'}
									icon={<>⊕</>}
									title='Size variants'
									desc='Unlimited sizes, each with own price'
									onClick={() => setForm(f => ({ ...f, pricingMode: 'sizes' }))}
								/>
							</div>

							{form.pricingMode === 'fixed' ? (
								<div>
									<label className='bf-label'>Price (Rs.) <span className='bf-req'>*</span></label>
									<div style={{ position: 'relative' }}>
										<span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--bf-mute)', fontSize: 12, pointerEvents: 'none' }}>Rs.</span>
										<input
											className='bf-input bf-mono'
											type='number' min={0}
											value={form.price || ''}
											onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
											placeholder='499'
											style={{ paddingLeft: 38, fontWeight: 800, fontSize: 18 }}
										/>
									</div>
								</div>
							) : (
								/* Dynamic size variants */
								<div>
									<div style={{ borderRadius: 14, border: '1px solid var(--bf-line)', overflow: 'hidden' }}>
										{/* Header */}
										<div className='bf-admin-size-header'>
											<span />
											{(['SIZE NAME / LABEL', 'PRICE (Rs.)', 'FINAL PRICE', ''] as const).map((h) => (
												<span
													key={h}
													className={h === 'FINAL PRICE' ? 'bf-admin-size-row-final' : undefined}
													style={{ font: '600 9.5px var(--bf-mono)', letterSpacing: '.08em', color: 'var(--bf-mute)', textTransform: 'uppercase' }}
												>{h}</span>
											))}
										</div>

										{/* Size rows */}
										{form.sizes.map((size, idx) => (
											<SizeRowItem
												key={idx}
												idx={idx}
												total={form.sizes.length}
												size={size}
												form={form}
												onChange={s => updateSize(idx, s)}
												onRemove={() => removeSize(idx)}
											/>
										))}

										{/* Add size button */}
										<div style={{ padding: '12px 16px', borderTop: form.sizes.length > 0 ? '1px solid var(--bf-line)' : 'none' }}>
											<button
												onClick={addSize}
												style={{
													display: 'flex', alignItems: 'center', gap: 8,
													font: '600 12px var(--bf-font)', color: 'var(--bf-ink-2)',
													background: 'none', border: '1.5px dashed var(--bf-line-2)',
													borderRadius: 10, cursor: 'pointer', padding: '9px 14px',
													width: '100%', transition: 'all .15s',
												}}
												onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bf-ink)')}
												onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bf-line-2)')}
											>
												{Icons.plus}
												<span>Add size</span>
												<span style={{ fontSize: 11, color: 'var(--bf-mute)' }}>e.g. 14 inch, XL, Family…</span>
											</button>
										</div>
									</div>

									{/* Effective prices summary */}
									{validSizes.length > 0 && form.discountMode !== 'none' && (
										<div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--bf-cream-2)', border: '1px solid var(--bf-line)' }}>
											<div className='bf-eyebrow' style={{ marginBottom: 8, fontSize: 9.5 }}>PRICES WITH DISCOUNT</div>
											<div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
												{validSizes.map(s => (
													<div key={s.name} style={{ textAlign: 'center' }}>
														<div style={{ fontSize: 10, color: 'var(--bf-mute)', marginBottom: 2 }}>{s.name || '—'}</div>
														<div className='bf-mono' style={{ fontWeight: 800, fontSize: 12, color: 'var(--bf-ember)' }}>
															Rs.{calcEffective(s.price ?? 0, form.discountMode, form.discountPct, form.discountAmount).toLocaleString('en-PK')}
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}

							<DiscountSection form={form} setForm={setForm} basePrice={basePrice} />
						</div>

						<hr className='bf-rule' />

						{/* Section 3: Image */}
						<div>
							<SectionLabel num={3} title='Product image' />
							<ImageUploader
								value={form.imageUrl ?? ''}
								onChange={url => setForm(f => ({ ...f, imageUrl: url || null }))}
								folder='buddy-feast/products'
							/>
						</div>

						<hr className='bf-rule' />

						{/* Section 4: Description */}
						<div>
							<SectionLabel num={4} title='Description' />
							<textarea
								className='bf-input'
								rows={3}
								maxLength={255}
								value={form.description}
								onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
								placeholder='Short, appetizing description shown on the menu…'
								style={{ resize: 'vertical', lineHeight: 1.5 }}
							/>
							<div style={{
								textAlign: 'right', fontSize: 11, marginTop: 4, fontFamily: 'var(--bf-mono)',
								color: form.description.length > 210 ? (form.description.length >= 255 ? 'var(--bf-ember)' : '#B45309') : 'var(--bf-mute)',
							}}>
								{form.description.length} / 255
							</div>
						</div>

						{saveError && (
							<div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
								<span>⚠</span> {saveError}
							</div>
						)}
					</div>

					{/* Right: preview (hidden on mobile) */}
					<div className='bf-admin-modal-preview-col bf-scroll'>
						<ProductPreview form={form} />
					</div>
				</div>

				{/* Footer */}
				<div className='bf-admin-modal-footer'>
					<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
					<button className='bf-btn bf-btn-primary bf-btn-md' style={{ flex: 2 }} disabled={saving} onClick={handleSave}>
						{saving ? 'Saving…' : mode === 'add' ? 'Add product →' : 'Save changes →'}
					</button>
				</div>
			</div>

			{/* Category sub-modal */}
			{catDialogOpen && (
				<div
					style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,32,.5)', display: 'grid', placeItems: 'center', zIndex: 70 }}
					onClick={() => !creatingCat && setCatDialogOpen(false)}
				>
					<div className='bf-card' style={{ padding: 28, maxWidth: 380, width: '100%', borderRadius: 18 }} onClick={e => e.stopPropagation()}>
						<h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Add new category</h3>
						<p style={{ fontSize: 13, color: 'var(--bf-mute)', marginBottom: 18 }}>The new category will be auto-selected for this product.</p>
						<div style={{ marginBottom: 14 }}>
							<label className='bf-label'>Category name <span className='bf-req'>*</span></label>
							<input
								className='bf-input'
								value={newCatName}
								onChange={e => setNewCatName(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
								placeholder='e.g. Pizza, Drinks, Pasta…'
								autoFocus
							/>
						</div>
						{catError && (
							<div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>
								{catError}
							</div>
						)}
						<div style={{ display: 'flex', gap: 8 }}>
							<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} disabled={creatingCat} onClick={() => setCatDialogOpen(false)}>Cancel</button>
							<button className='bf-btn bf-btn-primary bf-btn-md' style={{ flex: 1 }} disabled={creatingCat} onClick={handleCreateCategory}>
								{creatingCat ? 'Creating…' : 'Create'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Sub-category sub-modal */}
			{subCatDialogOpen && (
				<div
					style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,32,.5)', display: 'grid', placeItems: 'center', zIndex: 70 }}
					onClick={() => !creatingSubCat && setSubCatDialogOpen(false)}
				>
					<div className='bf-card' style={{ padding: 28, maxWidth: 380, width: '100%', borderRadius: 18 }} onClick={e => e.stopPropagation()}>
						<h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Add sub-category</h3>
						<p style={{ fontSize: 13, color: 'var(--bf-mute)', marginBottom: 18 }}>Groups items within <strong>{form.category}</strong>. The new sub-category will be auto-selected.</p>
						<div style={{ marginBottom: 14 }}>
							<label className='bf-label'>Sub-category name <span className='bf-req'>*</span></label>
							<input
								className='bf-input'
								value={newSubCatName}
								onChange={e => setNewSubCatName(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && handleCreateSubCategory()}
								placeholder='e.g. Regular, Special, Extreme…'
								autoFocus
							/>
						</div>
						{subCatError && (
							<div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(232,67,31,.1)', color: 'var(--bf-ember)', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>
								{subCatError}
							</div>
						)}
						<div style={{ display: 'flex', gap: 8 }}>
							<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} disabled={creatingSubCat} onClick={() => setSubCatDialogOpen(false)}>Cancel</button>
							<button className='bf-btn bf-btn-primary bf-btn-md' style={{ flex: 1 }} disabled={creatingSubCat} onClick={handleCreateSubCategory}>
								{creatingSubCat ? 'Creating…' : 'Create'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// ─── Shared confirm dialog ────────────────────────────────────────────────────
function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onCancel, busy }: {
	title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean
	onConfirm: () => void; onCancel: () => void; busy: boolean
}) {
	return (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,32,.55)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 80 }}
			onClick={() => !busy && onCancel()}>
			<div className='bf-card' style={{ padding: 28, maxWidth: 360, width: '100%', borderRadius: 18 }} onClick={e => e.stopPropagation()}>
				<div style={{ width: 40, height: 40, borderRadius: 10, background: danger ? 'rgba(232,67,31,.1)' : 'var(--bf-cream-2)', display: 'grid', placeItems: 'center', marginBottom: 14, color: danger ? 'var(--bf-ember)' : 'var(--bf-ink)', fontSize: 18 }}>
					{danger ? Icons.trash : '⚠'}
				</div>
				<h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{title}</h3>
				<div style={{ fontSize: 13, color: 'var(--bf-mute)', marginBottom: 22, lineHeight: 1.5 }}>{body}</div>
				<div style={{ display: 'flex', gap: 8 }}>
					<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} disabled={busy} onClick={onCancel}>Cancel</button>
					<button className='bf-btn bf-btn-primary bf-btn-md' style={{ flex: 1, background: danger ? 'var(--bf-ember)' : undefined }} disabled={busy} onClick={onConfirm}>
						{busy ? 'Working…' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Sub-category manager ─────────────────────────────────────────────────────
function SubCategoryManager({ categoryId, categoryName }: { categoryId: number; categoryName: string }) {
	const { data: subCats, mutate: refresh } = useSubCategories(categoryId)
	const [addOpen, setAddOpen] = useState(false)
	const [newName, setNewName] = useState('')
	const [adding, setAdding] = useState(false)
	const [editId, setEditId] = useState<number | null>(null)
	const [editName, setEditName] = useState('')
	const [saving, setSaving] = useState(false)
	const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; productCount: number } | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleAdd() {
		const name = newName.trim()
		if (!name) return
		setAdding(true)
		setError(null)
		try {
			const order = (subCats?.length ?? 0) + 1
			await createSubCategory({ categoryId, name, displayOrder: order })
			await refresh()
			setNewName('')
			setAddOpen(false)
		} catch { setError('Failed to add.') } finally { setAdding(false) }
	}

	async function handleRename(id: number) {
		const name = editName.trim()
		if (!name) return
		setSaving(true)
		setError(null)
		try {
			await updateSubCategory(id, { name })
			await refresh()
			setEditId(null)
		} catch { setError('Failed to save.') } finally { setSaving(false) }
	}

	async function handleReorder(id: number, direction: 'up' | 'down') {
		const list = subCats ?? []
		const idx = list.findIndex(s => s.id === id)
		if (idx < 0) return
		const swapIdx = direction === 'up' ? idx - 1 : idx + 1
		if (swapIdx < 0 || swapIdx >= list.length) return
		const [a, b] = [list[idx], list[swapIdx]]
		await Promise.all([
			updateSubCategory(a.id, { displayOrder: swapIdx + 1 }),
			updateSubCategory(b.id, { displayOrder: idx + 1 }),
		])
		await refresh()
	}

	async function handleDelete() {
		if (!deleteTarget) return
		setDeleting(true)
		try {
			await deleteSubCategory(deleteTarget.id)
			await refresh()
			setDeleteTarget(null)
		} catch { setError('Failed to delete.') } finally { setDeleting(false) }
	}

	const list = subCats ?? []

	return (
		<div style={{ marginTop: 10, borderTop: '1px solid var(--bf-line)', paddingTop: 10 }}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 8px' }}>
				<span className='bf-eyebrow' style={{ fontSize: 9.5 }}>SUB-CATEGORIES</span>
				<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 22, height: 22, fontSize: 14 }}
					onClick={() => { setAddOpen(o => !o); setNewName(''); setError(null) }} title='Add sub-category'>
					{Icons.plus}
				</button>
			</div>

			{addOpen && (
				<div style={{ padding: '0 10px 10px', display: 'flex', gap: 6 }}>
					<input className='bf-input' value={newName} onChange={e => setNewName(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder='e.g. Regular, Special…'
						autoFocus style={{ fontSize: 12, height: 34, flex: 1 }} />
					<button className='bf-btn bf-btn-primary bf-btn-sm' style={{ height: 34 }} disabled={adding} onClick={handleAdd}>
						{adding ? '…' : 'Add'}
					</button>
				</div>
			)}

			{error && <p style={{ fontSize: 11, color: 'var(--bf-ember)', padding: '0 10px 6px', fontWeight: 600 }}>{error}</p>}

			{list.length === 0 ? (
				<p style={{ fontSize: 11, color: 'var(--bf-mute)', padding: '0 10px 4px' }}>No sub-categories for {categoryName}</p>
			) : list.map((sub, idx) => (
				<div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 4px 3px 10px', borderRadius: 8 }}>
					{editId === sub.id ? (
						<>
							<input className='bf-input' value={editName} onChange={e => setEditName(e.target.value)}
								onKeyDown={e => { if (e.key === 'Enter') handleRename(sub.id); if (e.key === 'Escape') setEditId(null) }}
								autoFocus style={{ fontSize: 12, height: 30, flex: 1 }} />
							<button className='bf-btn bf-btn-primary bf-btn-sm' style={{ height: 28, padding: '0 8px', fontSize: 11 }} disabled={saving} onClick={() => handleRename(sub.id)}>
								{saving ? '…' : 'Save'}
							</button>
							<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 24, height: 24 }} onClick={() => setEditId(null)}>✕</button>
						</>
					) : (
						<>
							{/* Reorder arrows */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 16, height: 14, fontSize: 8, opacity: idx === 0 ? 0.2 : 1 }}
									disabled={idx === 0} onClick={() => handleReorder(sub.id, 'up')}>▲</button>
								<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 16, height: 14, fontSize: 8, opacity: idx === list.length - 1 ? 0.2 : 1 }}
									disabled={idx === list.length - 1} onClick={() => handleReorder(sub.id, 'down')}>▼</button>
							</div>
							<span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--bf-ink-2)' }}>{sub.name}</span>
							{(sub.productCount ?? 0) > 0 && (
								<span className='bf-mono' style={{ fontSize: 9.5, color: 'var(--bf-mute)' }}>{sub.productCount}</span>
							)}
							<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 22, height: 22, fontSize: 11 }}
								onClick={() => { setEditId(sub.id); setEditName(sub.name) }} title='Rename'>
								{Icons.edit}
							</button>
							<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 22, height: 22, fontSize: 11, color: 'var(--bf-ember)' }}
								onClick={() => setDeleteTarget({ id: sub.id, name: sub.name, productCount: sub.productCount ?? 0 })} title='Delete'>
								{Icons.trash}
							</button>
						</>
					)}
				</div>
			))}

			{deleteTarget && (
				<ConfirmDialog
					title={`Delete "${deleteTarget.name}"?`}
					body={deleteTarget.productCount > 0
						? <><strong style={{ color: 'var(--bf-ember)' }}>{deleteTarget.productCount} product(s)</strong> are assigned to this sub-category. They will be unassigned (not deleted) and will appear ungrouped.</>
						: 'This sub-category will be permanently removed.'}
					confirmLabel='Delete'
					danger
					busy={deleting}
					onConfirm={handleDelete}
					onCancel={() => setDeleteTarget(null)}
				/>
			)}
		</div>
	)
}

// ─── Category sidebar manager ─────────────────────────────────────────────────
function CategorySidebar({ categories, activeCat, onSelect, onCreated, products, isLoading }: {
	categories: Category[]
	activeCat: string | null
	onSelect: (name: string) => void
	onCreated: (cat: Category) => void
	products: import('../../lib/types').Product[] | undefined
	isLoading: boolean
}) {
	const [addOpen, setAddOpen] = useState(false)
	const [newName, setNewName] = useState('')
	const [adding, setAdding] = useState(false)
	const [addError, setAddError] = useState<string | null>(null)

	const [editId, setEditId] = useState<number | null>(null)
	const [editName, setEditName] = useState('')
	const [editSaving, setEditSaving] = useState(false)

	const [toggleBusy, setToggleBusy] = useState<number | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; productCount: number } | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [deleteError, setDeleteError] = useState<string | null>(null)

	const allCats = useMemo(() =>
		[...categories].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999) || a.name.localeCompare(b.name)),
		[categories])

	async function handleAdd() {
		const name = newName.trim()
		if (!name) { setAddError('Name is required.'); return }
		setAdding(true); setAddError(null)
		try {
			const cat = await createCategory({ name })
			onCreated(cat)
			setNewName(''); setAddOpen(false)
		} catch { setAddError('Failed to create.') } finally { setAdding(false) }
	}

	async function handleRename(id: number) {
		const name = editName.trim()
		if (!name) return
		setEditSaving(true)
		try {
			await updateCategory(id, { name })
			setEditId(null)
		} catch { /* ignore */ } finally { setEditSaving(false) }
	}

	async function handleToggleActive(cat: Category) {
		setToggleBusy(cat.id)
		try { await updateCategory(cat.id, { isActive: !cat.isActive }) }
		catch { /* ignore */ } finally { setToggleBusy(null) }
	}

	async function handleDelete() {
		if (!deleteTarget) return
		setDeleting(true); setDeleteError(null)
		try {
			await deleteCategory(deleteTarget.id)
			setDeleteTarget(null)
			// If deleting the active category, clear selection
			if (activeCat === deleteTarget.name) onSelect(allCats.find(c => c.name !== deleteTarget!.name)?.name ?? '')
		} catch (e: unknown) {
			const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
			setDeleteError(msg ?? 'Failed to delete.')
		} finally { setDeleting(false) }
	}

	return (
		<div className='bf-card bf-admin-cat-sidebar' style={{ padding: 12, height: 'fit-content' }}>
			<div className='bf-eyebrow' style={{ padding: '6px 10px 10px' }}>CATEGORIES</div>

			{isLoading ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
					{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={34} r={8} />)}
				</div>
			) : allCats.length === 0 ? (
				<p style={{ fontSize: 12, color: 'var(--bf-mute)', padding: '4px 10px' }}>No categories yet</p>
			) : allCats.map(cat => {
				const count = (products ?? []).filter(p => p.category === cat.name).length
				const isActive = activeCat === cat.name
				const isEditing = editId === cat.id
				return (
					<div key={cat.id}>
						{isEditing ? (
							<div style={{ display: 'flex', gap: 4, padding: '4px 6px', alignItems: 'center' }}>
								<input className='bf-input' value={editName} autoFocus
									onChange={e => setEditName(e.target.value)}
									onKeyDown={e => { if (e.key === 'Enter') handleRename(cat.id); if (e.key === 'Escape') setEditId(null) }}
									style={{ fontSize: 12, height: 32, flex: 1 }} />
								<button className='bf-btn bf-btn-primary bf-btn-sm' style={{ height: 30, padding: '0 8px', fontSize: 11 }}
									disabled={editSaving} onClick={() => handleRename(cat.id)}>
									{editSaving ? '…' : 'Save'}
								</button>
								<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 26, height: 26 }} onClick={() => setEditId(null)}>✕</button>
							</div>
						) : (
							<div style={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: 8, background: isActive ? 'var(--bf-cream-2)' : 'transparent' }}>
								<button onClick={() => onSelect(cat.name)} style={{
									flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
									padding: '9px 6px 9px 10px', border: 0, background: 'transparent',
									borderRadius: 8, cursor: 'pointer', font: '600 13px var(--bf-font)',
									textAlign: 'left', color: cat.isActive ? 'var(--bf-ink)' : 'var(--bf-mute)',
								}}>
									<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
										{!cat.isActive && <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--bf-line)', color: 'var(--bf-mute)', borderRadius: 4, padding: '1px 4px' }}>OFF</span>}
										{cat.name}
									</span>
									<span className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)' }}>{count}</span>
								</button>
								{/* Category actions — visible on hover via CSS or always shown */}
								<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }}
									title='Rename' onClick={() => { setEditId(cat.id); setEditName(cat.name) }}>
									{Icons.edit}
								</button>
								<button className='bf-btn bf-btn-ghost bf-btn-icon'
									style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0, color: cat.isActive ? 'var(--bf-leaf)' : 'var(--bf-mute)', opacity: toggleBusy === cat.id ? 0.5 : 1 }}
									title={cat.isActive ? 'Deactivate' : 'Activate'}
									disabled={toggleBusy === cat.id}
									onClick={() => handleToggleActive(cat)}>
									{cat.isActive ? '●' : '○'}
								</button>
								<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0, color: 'var(--bf-ember)' }}
									title='Delete' onClick={() => { setDeleteError(null); setDeleteTarget({ id: cat.id, name: cat.name, productCount: count }) }}>
									{Icons.trash}
								</button>
							</div>
						)}
					</div>
				)
			})}

			{/* Add category */}
			<div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--bf-line)' }}>
				{addOpen ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<input className='bf-input' value={newName} autoFocus
							onChange={e => setNewName(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && handleAdd()}
							placeholder='Category name…' style={{ fontSize: 12, height: 34 }} />
						{addError && <p style={{ fontSize: 11, color: 'var(--bf-ember)', fontWeight: 600, margin: 0 }}>{addError}</p>}
						<div style={{ display: 'flex', gap: 6 }}>
							<button className='bf-btn bf-btn-outline bf-btn-sm' style={{ flex: 1 }} onClick={() => { setAddOpen(false); setAddError(null) }}>Cancel</button>
							<button className='bf-btn bf-btn-primary bf-btn-sm' style={{ flex: 1 }} disabled={adding} onClick={handleAdd}>
								{adding ? 'Adding…' : 'Add'}
							</button>
						</div>
					</div>
				) : (
					<button className='bf-btn bf-btn-outline bf-btn-sm' style={{ width: '100%' }} onClick={() => { setAddOpen(true); setAddError(null) }}>
						{Icons.plus} Add category
					</button>
				)}
			</div>

			{/* Sub-category manager for active category */}
			{(() => {
				const activeCatObj = allCats.find(c => c.name === activeCat)
				return activeCatObj ? <SubCategoryManager categoryId={activeCatObj.id} categoryName={activeCatObj.name} /> : null
			})()}

			{/* Category delete confirm */}
			{deleteTarget && (
				<ConfirmDialog
					title={`Delete "${deleteTarget.name}"?`}
					body={deleteTarget.productCount > 0
						? <><strong style={{ color: 'var(--bf-ember)' }}>{deleteTarget.productCount} product(s)</strong> are in this category. Remove or reassign them before deleting.{deleteError && <><br /><span style={{ color: 'var(--bf-ember)' }}>{deleteError}</span></>}</>
						: <>{`The category will be permanently removed.`}{deleteError && <><br /><span style={{ color: 'var(--bf-ember)' }}>{deleteError}</span></>}</>}
					confirmLabel='Delete'
					danger
					busy={deleting}
					onConfirm={handleDelete}
					onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
				/>
			)}
		</div>
	)
}

// ─── Sort options ─────────────────────────────────────────────────────────────
type SortKey = 'newest' | 'oldest' | 'az' | 'za' | 'price_asc' | 'price_desc' | 'available'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
	{ key: 'newest', label: 'Newest first' },
	{ key: 'oldest', label: 'Oldest first' },
	{ key: 'az', label: 'Name A → Z' },
	{ key: 'za', label: 'Name Z → A' },
	{ key: 'price_asc', label: 'Price: low → high' },
	{ key: 'price_desc', label: 'Price: high → low' },
	{ key: 'available', label: 'Available first' },
]

function sortProducts(list: Product[], key: SortKey): Product[] {
	return [...list].sort((a, b) => {
		switch (key) {
			case 'newest': return b.id - a.id
			case 'oldest': return a.id - b.id
			case 'az': return a.name.localeCompare(b.name)
			case 'za': return b.name.localeCompare(a.name)
			case 'price_asc': return a.price - b.price
			case 'price_desc': return b.price - a.price
			case 'available': return (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0)
			default: return 0
		}
	})
}

// ─── Menu Catalog ─────────────────────────────────────────────────────────────
export function AdminMenu() {
	const { data: products, isLoading, error, mutate } = useProducts()
	const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
	const [selectedCat, setSelectedCat] = useState<string | null>(null)
	const [modal, setModal] = useState<'add' | Product | null>(null)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [sortKey, setSortKey] = useState<SortKey>('newest')

	// All categories (including inactive) for the sidebar manager; active-only for product filtering
	const allCategories = useMemo(() =>
		(categoriesData ?? []).slice().sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999) || a.name.localeCompare(b.name)),
		[categoriesData])

	const activeCategories = useMemo(() => allCategories.filter(c => c.isActive), [allCategories])

	const activeCat = selectedCat ?? activeCategories[0]?.name ?? null

	const filteredProducts = useMemo(() => {
		const byCat = (products ?? []).filter(p => p.category === activeCat)
		const q = searchQuery.trim().toLowerCase()
		const searched = q
			? byCat.filter(p =>
				p.name.toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q) ||
				(p.description ?? '').toLowerCase().includes(q) ||
				(p.subCategoryName ?? '').toLowerCase().includes(q)
			)
			: byCat
		return sortProducts(searched, sortKey)
	}, [products, activeCat, searchQuery, sortKey])

	async function handleCategoryCreate(name: string) {
		const cat = await createCategory({ name })
		setSelectedCat(cat.name)
		return cat
	}

	async function handleDelete(id: number) {
		setDeleting(true)
		try {
			await deleteProduct(id)
			await mutate()
			setDeleteId(null)
		} finally {
			setDeleting(false)
		}
	}

	const itemCount = products?.length ?? 0

	return (
		<AdminShell active='menu'>
			<AdminTopbar
				title='Menu catalog'
				sub={
					isLoading || categoriesLoading
						? 'Loading…'
						: `${itemCount} ITEMS · ${allCategories.length} CATEGORIES`
				}
			/>

			<div className='bf-admin-menu-layout'>
				{/* Mobile: category select dropdown */}
				<div className='bf-admin-cat-select-wrap'>
					<label className='bf-label'>Category</label>
					<select
						className='bf-input'
						value={activeCat ?? ''}
						onChange={e => { setSelectedCat(e.target.value || null); setSearchQuery('') }}
					>
						{activeCategories.map(cat => (
							<option key={cat.name} value={cat.name}>{cat.name}</option>
						))}
					</select>
				</div>

				{/* Category sidebar (desktop/tablet) */}
				<CategorySidebar
					categories={allCategories}
					activeCat={activeCat}
					onSelect={name => { setSelectedCat(name); setSearchQuery('') }}
					onCreated={cat => { setSelectedCat(cat.name); setSearchQuery('') }}
					products={products}
					isLoading={isLoading || categoriesLoading}
				/>

				{/* Items table */}
				<div className='bf-card' style={{ padding: 0, overflow: 'hidden' }}>
					<div style={{ padding: '14px 22px', borderBottom: '1px solid var(--bf-line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
						{/* Row 1: title + add */}
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
							<h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
								{activeCat ?? 'All items'} ·{' '}
								<span className='bf-mono' style={{ fontWeight: 400, fontSize: 14 }}>
									{filteredProducts.length}{searchQuery.trim() ? ` of ${(products ?? []).filter(p => p.category === activeCat).length}` : ''} items
								</span>
							</h2>
							<button className='bf-btn bf-btn-primary bf-btn-sm' onClick={() => setModal('add')}>
								{Icons.plus} Add item
							</button>
						</div>

						{/* Row 2: search + sort */}
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
							{/* Search */}
							<div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
								<span style={{
									position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
									color: 'var(--bf-mute)', fontSize: 14, pointerEvents: 'none', lineHeight: 1,
								}}>
									<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
										<circle cx='11' cy='11' r='8' /><path d='M21 21l-4.35-4.35' />
									</svg>
								</span>
								<input
									className='bf-input'
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									placeholder='Search items…'
									style={{ paddingLeft: 34, paddingRight: searchQuery ? 32 : 12, fontSize: 13, height: 38 }}
								/>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery('')}
										style={{
											position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
											width: 20, height: 20, borderRadius: '50%', border: 'none',
											background: 'var(--bf-line-2)', color: 'var(--bf-mute)',
											cursor: 'pointer', fontSize: 11, display: 'grid', placeItems: 'center',
											lineHeight: 1,
										}}
										title='Clear search'
									>✕</button>
								)}
							</div>

							{/* Sort */}
							<div style={{ position: 'relative', flexShrink: 0 }}>
								<span style={{
									position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
									color: 'var(--bf-mute)', fontSize: 12, pointerEvents: 'none', lineHeight: 1,
								}}>
									<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
										<path d='M3 6h18M7 12h10M11 18h2' />
									</svg>
								</span>
								<select
									className='bf-input'
									value={sortKey}
									onChange={e => setSortKey(e.target.value as SortKey)}
									style={{ paddingLeft: 28, paddingRight: 28, fontSize: 12, height: 38, minWidth: 148, cursor: 'pointer' }}
								>
									{SORT_OPTIONS.map(o => (
										<option key={o.key} value={o.key}>{o.label}</option>
									))}
								</select>
							</div>
						</div>

						{/* No search results hint */}
						{searchQuery.trim() && filteredProducts.length === 0 && !isLoading && (
							<div style={{ fontSize: 12, color: 'var(--bf-mute)', fontStyle: 'italic' }}>
								No items match &ldquo;{searchQuery.trim()}&rdquo;
							</div>
						)}
					</div>

					{/* Scrollable table */}
					<div className='bf-admin-menu-table-scroll'>
						<div className='bf-admin-menu-table-min'>
							{/* Table header */}
							<div style={{
								display: 'grid', gridTemplateColumns: '44px 64px 1.4fr 1fr 160px 110px 80px',
								gap: 12, font: '600 10px var(--bf-mono)', color: 'var(--bf-mute)',
								letterSpacing: '.08em', textTransform: 'uppercase',
								padding: '10px 22px', borderBottom: '1px solid var(--bf-line)',
								background: 'var(--bf-cream-2)',
							}}>
								<span /><span>IMAGE</span><span>NAME</span><span>CATEGORY</span>
								<span>PRICE</span><span>STATUS</span>
								<span style={{ textAlign: 'right' }}>ACTIONS</span>
							</div>

							{isLoading ? (
								<div style={{ display: 'flex', flexDirection: 'column' }}>
									{Array.from({ length: 4 }).map((_, i) => (
										<div key={i} style={{
											display: 'grid', gridTemplateColumns: '44px 64px 1.4fr 1fr 160px 110px 80px',
											gap: 12, padding: '14px 22px', borderBottom: '1px solid var(--bf-line)', alignItems: 'center',
										}}>
											<Skeleton h={16} w={16} r={4} />
											<Skeleton h={44} w={44} r={8} />
											<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
												<Skeleton h={13} w='80%' />
												<Skeleton h={10} w='40%' />
											</div>
											<Skeleton h={13} w='70%' />
											<Skeleton h={14} w={90} />
											<Skeleton h={20} w={60} r={999} />
											<div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
												<Skeleton h={28} w={28} r={999} />
												<Skeleton h={28} w={28} r={999} />
											</div>
										</div>
									))}
								</div>
							) : error ? (
								<div style={{ padding: 32, textAlign: 'center' }}>
									<p style={{ color: 'var(--bf-mute)', fontSize: 13, marginBottom: 12 }}>Could not load products</p>
									<button className='bf-btn bf-btn-outline bf-btn-sm' onClick={() => mutate()}>Retry</button>
								</div>
							) : filteredProducts.length === 0 ? (
								<div style={{ padding: '48px 32px', textAlign: 'center' }}>
									<p style={{ color: 'var(--bf-mute)', fontSize: 13, marginBottom: 14 }}>No items in this category</p>
									<button className='bf-btn bf-btn-primary bf-btn-sm' onClick={() => setModal('add')}>
										{Icons.plus} Add first item
									</button>
								</div>
							) : (
								filteredProducts.map((it, i) => {
									const hasDis = (it.discountPct && it.discountPct > 0) || (it.discountAmount && it.discountAmount > 0)
									const dm = discountModeFromProduct(it)

									let displayBase = it.price
									let sizeLabel = ''
									if (it.hasSizes) {
										try {
											const sizes = it.sizesJson ? (JSON.parse(it.sizesJson) as ProductSize[]).filter(s => s.price && s.price > 0) : []
											if (sizes.length > 0) {
												displayBase = sizes[0].price ?? it.price
												sizeLabel = 'From '
											} else {
												displayBase = it.priceSmall ?? it.price
												sizeLabel = 'From '
											}
										} catch {
											displayBase = it.priceSmall ?? it.price
											sizeLabel = 'From '
										}
									}
									const eff = calcEffective(displayBase, dm, it.discountPct ?? null, it.discountAmount ?? null)

									return (
										<div
											key={it.id}
											style={{
												display: 'grid', gridTemplateColumns: '44px 64px 1.4fr 1fr 160px 110px 80px',
												gap: 12, padding: '12px 22px',
												borderBottom: i < filteredProducts.length - 1 ? '1px solid var(--bf-line)' : 'none',
												alignItems: 'center',
											}}
										>
											<input type='checkbox' style={{ width: 15, height: 15, accentColor: 'var(--bf-ink)', cursor: 'pointer' }} />
											{it.imageUrl ? (
												<img src={it.imageUrl} alt='' style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
											) : (
												<FoodImg tone={TONES[i % TONES.length]} style={{ width: 44, height: 44 }} />
											)}
											<div>
												<div style={{ font: '700 14px var(--bf-font)' }}>{it.name}</div>
												<div className='bf-mono' style={{ fontSize: 10, color: 'var(--bf-mute)', marginTop: 2, display: 'flex', gap: 6 }}>
													<span>ID-{it.id}</span>
													{it.isHot && <span style={{ color: 'var(--bf-ember)' }}>🌶 HOT</span>}
													{hasDis && <span style={{ color: '#15803d' }}>● DISC</span>}
													{it.hasSizes && <span style={{ color: 'var(--bf-ink-2)' }}>SIZES</span>}
												</div>
											</div>
											<div>
												<div style={{ fontSize: 13, color: 'var(--bf-ink-2)' }}>{it.category}</div>
												{it.subCategoryName && (
													<div style={{ fontSize: 10, color: 'var(--bf-mute)', marginTop: 2, fontWeight: 600 }}>{it.subCategoryName}</div>
												)}
											</div>
											<div>
												<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
													{hasDis && (
														<span className='bf-mono' style={{ fontSize: 10, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
															Rs.{displayBase.toLocaleString('en-PK')}
														</span>
													)}
													<span className='bf-tabular' style={{ fontWeight: 800, fontSize: 14 }}>
														{sizeLabel && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--bf-mute)' }}>{sizeLabel}</span>}
														{rs(eff)}
													</span>
												</div>
												{hasDis && (
													<span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', background: '#DCFCE7', padding: '1px 5px', borderRadius: 4 }}>
														{it.discountPct ? `${it.discountPct}% off` : `Rs.${it.discountAmount} off`}
													</span>
												)}
											</div>
											<span>
												{it.isAvailable ? (
													<span className='bf-pill' style={{ background: '#DCFCE7', color: '#166534', boxShadow: 'none' }}>
														<span className='bf-dot bf-dot-ready' /> LIVE
													</span>
												) : (
													<span className='bf-pill' style={{ background: '#F1ECE3', color: 'var(--bf-mute)', boxShadow: 'none' }}>OFF</span>
												)}
											</span>
											<div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
												<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 28, height: 28 }} onClick={() => setModal(it)}>{Icons.edit}</button>
												<button className='bf-btn bf-btn-ghost bf-btn-icon' style={{ width: 28, height: 28, color: 'var(--bf-ember)' }} onClick={() => setDeleteId(it.id)}>{Icons.trash}</button>
											</div>
										</div>
									)
								})
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Product Modal */}
			{modal !== null && (
				<ProductModal
					mode={modal === 'add' ? 'add' : 'edit'}
					product={modal === 'add' ? null : modal}
					categories={activeCategories}
					onClose={() => setModal(null)}
					onSaved={async () => { await mutate(); setModal(null) }}
					onCategoryCreate={handleCategoryCreate}
				/>
			)}

			{/* Delete confirmation */}
			{deleteId !== null && (
				<div
					style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,32,.55)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 60 }}
					onClick={() => !deleting && setDeleteId(null)}
				>
					<div className='bf-card' style={{ padding: 28, maxWidth: 360, width: '100%', borderRadius: 18 }} onClick={e => e.stopPropagation()}>
						<div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,67,31,.1)', display: 'grid', placeItems: 'center', marginBottom: 14, color: 'var(--bf-ember)', fontSize: 20 }}>
							{Icons.trash}
						</div>
						<h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Delete product?</h3>
						<p style={{ fontSize: 13, color: 'var(--bf-mute)', marginBottom: 22 }}>
							This will permanently remove this product from the menu. This cannot be undone.
						</p>
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
