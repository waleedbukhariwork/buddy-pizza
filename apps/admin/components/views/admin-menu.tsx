'use client'
import React, { useState, useMemo } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Icons } from '../ui/icon'
import { FoodImg, type Tone } from '../ui/food-img'
import { Skeleton } from '../ui/skeleton'
import {
	useProducts,
	useCategories,
	createProduct,
	updateProduct,
	deleteProduct,
	createCategory,
	rs,
} from '../../lib/hooks'
import type { Product } from '../../lib/types'

const TONES: Tone[] = ['ember', 'amber', 'cream', 'ember', 'amber', 'cream']

type ProductForm = Omit<Product, 'id'>

type PanelState =
	| { mode: 'closed' }
	| { mode: 'add' }
	| { mode: 'edit'; product: Product }

const EMPTY_FORM: ProductForm = {
	name: '',
	description: '',
	price: 0,
	categoryId: null,
	category: '',
	imageUrl: null,
	isAvailable: true,
	isHot: false,
	hasSizes: false,
	priceSmall: null,
	priceMedium: null,
	priceLarge: null,
}

// ─── MENU CATALOG ─────────────────────────────────────────────────────────────
export function AdminMenu() {
	const { data: products, isLoading, error, mutate } = useProducts()
	const {
		data: categoriesData,
		isLoading: categoriesLoading,
		mutate: refreshCategories,
	} = useCategories()
	const [selectedCat, setSelectedCat] = useState<string | null>(null)
	const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })
	const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
	const [saving, setSaving] = useState(false)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
	const [newCategoryName, setNewCategoryName] = useState('')
	const [creatingCategory, setCreatingCategory] = useState(false)
	const [categoryError, setCategoryError] = useState<string | null>(null)

	const categories = useMemo(() => {
		return (categoriesData ?? [])
			.filter((category) => category.isActive)
			.slice()
			.sort(
				(a, b) =>
					(a.displayOrder ?? 999) - (b.displayOrder ?? 999) ||
					a.name.localeCompare(b.name),
			)
	}, [categoriesData])

	const activeCat = selectedCat ?? categories[0]?.name ?? null

	const filteredProducts = useMemo(
		() => (products ?? []).filter((p) => p.category === activeCat),
		[products, activeCat],
	)

	function openAdd() {
		const activeCategory = categories.find((category) => category.name === activeCat)
		setForm({
			...EMPTY_FORM,
			categoryId: activeCategory?.id ?? null,
			category: activeCategory?.name ?? '',
		})
		setSaveError(null)
		setPanel({ mode: 'add' })
	}

	function openEdit(p: Product) {
		setForm({
			name: p.name,
			description: p.description ?? '',
			price: p.price,
			categoryId:
				p.categoryId ??
				categories.find((category) => category.name === p.category)?.id ??
				null,
			category: p.category,
			imageUrl: p.imageUrl ?? null,
			isAvailable: p.isAvailable,
			isHot: p.isHot ?? false,
			hasSizes: p.hasSizes ?? false,
			priceSmall: p.priceSmall ?? null,
			priceMedium: p.priceMedium ?? null,
			priceLarge: p.priceLarge ?? null,
		})
		setSaveError(null)
		setPanel({ mode: 'edit', product: p })
	}

	function closePanel() {
		setPanel({ mode: 'closed' })
		setSaveError(null)
	}

	async function handleSave() {
		const needsSizes = form.hasSizes
		const hasBasePrice = form.price > 0
		const hasSizePrices = (form.priceSmall ?? 0) > 0 && (form.priceMedium ?? 0) > 0
		if (!form.name.trim() || !form.category.trim()) {
			setSaveError('Name and category are required.')
			return
		}
		if (needsSizes && !hasSizePrices) {
			setSaveError('Enter at least the two size prices (Small/Half and Medium/Full).')
			return
		}
		if (!needsSizes && !hasBasePrice) {
			setSaveError('Price is required.')
			return
		}
		setSaving(true)
		setSaveError(null)
		try {
			// Auto-set base price to smallest size price for sized items
			const payload = needsSizes && hasSizePrices
				? { ...form, price: form.priceSmall ?? form.price }
				: form
			if (panel.mode === 'edit') {
				await updateProduct(panel.product.id, payload)
			} else {
				await createProduct(payload)
			}
			closePanel()
		} catch {
			setSaveError('Failed to save. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete(id: number) {
		setDeleting(true)
		try {
			await deleteProduct(id)
			setDeleteId(null)
		} catch {
			// ignore
		} finally {
			setDeleting(false)
		}
	}

	async function handleCreateCategory() {
		const name = newCategoryName.trim()
		if (!name) {
			setCategoryError('Category name is required.')
			return
		}
		setCreatingCategory(true)
		setCategoryError(null)
		try {
			const category = await createCategory({ name })
			await refreshCategories()
			setSelectedCat(category.name)
			setForm((f) => ({
				...f,
				categoryId: category.id,
				category: category.name,
			}))
			setNewCategoryName('')
			setCategoryDialogOpen(false)
		} catch {
			setCategoryError('Failed to create category. Please try again.')
		} finally {
			setCreatingCategory(false)
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
						: `${itemCount} ITEMS · ${categories.length} CATEGORIES`
				}
			/>
			<div
				style={{
					padding: 28,
					display: 'grid',
					gridTemplateColumns: panel.mode !== 'closed' ? '200px 1fr 320px' : '200px 1fr',
					gap: 20,
					transition: 'grid-template-columns .2s',
				}}
			>
				{/* Category sidebar */}
				<div className='bf-card' style={{ padding: 12, height: 'fit-content' }}>
					<div className='bf-eyebrow' style={{ padding: '6px 10px' }}>
						CATEGORIES
					</div>
					{isLoading || categoriesLoading ? (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 6,
								padding: '6px 0',
							}}
						>
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} h={34} r={8} />
							))}
						</div>
					) : categories.length === 0 ? (
						<p
							style={{
								fontSize: 12,
								color: 'var(--bf-mute)',
								padding: '8px 10px',
							}}
						>
							No categories yet
						</p>
					) : (
						categories.map((category) => {
							const c = category.name
							const count = (products ?? []).filter(
								(p) => p.category === c,
							).length
							return (
								<button
									key={c}
									onClick={() => setSelectedCat(c)}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										width: '100%',
										padding: '9px 10px',
										border: 0,
										background:
											activeCat === c
												? 'var(--bf-cream-2)'
												: 'transparent',
										borderRadius: 8,
										cursor: 'pointer',
										font: '600 13px var(--bf-font)',
										textAlign: 'left',
										color: 'var(--bf-ink)',
									}}
								>
									<span>{c}</span>
									<span
										className='bf-mono'
										style={{ fontSize: 11, color: 'var(--bf-mute)' }}
									>
										{count}
									</span>
								</button>
							)
						})
					)}
				</div>

				{/* Items table */}
				<div className='bf-card' style={{ padding: 0, overflow: 'hidden' }}>
					<div
						style={{
							padding: '16px 22px',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							borderBottom: '1px solid var(--bf-line)',
						}}
					>
						<h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
							{activeCat ?? 'All items'} ·{' '}
							<span
								className='bf-mono'
								style={{ fontWeight: 400, fontSize: 14 }}
							>
								{filteredProducts.length} items
							</span>
						</h2>
						<div style={{ display: 'flex', gap: 6 }}>
							<button
								className='bf-btn bf-btn-primary bf-btn-sm'
								onClick={openAdd}
							>
								{Icons.plus} Add item
							</button>
						</div>
					</div>

					{/* Table header */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '40px 64px 1.4fr 1fr 110px 110px 80px',
							gap: 12,
							font: '600 10.5px var(--bf-mono)',
							color: 'var(--bf-mute)',
							letterSpacing: '.08em',
							textTransform: 'uppercase',
							padding: '10px 22px',
							borderBottom: '1px solid var(--bf-line)',
							background: 'var(--bf-cream-2)',
						}}
					>
						<span />
						<span>IMAGE</span>
						<span>NAME</span>
						<span>CATEGORY</span>
						<span>PRICE</span>
						<span>STATUS</span>
						<span style={{ textAlign: 'right' }}>ACTIONS</span>
					</div>

					{isLoading ? (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 0,
							}}
						>
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									style={{
										display: 'grid',
										gridTemplateColumns:
											'40px 64px 1.4fr 1fr 110px 110px 80px',
										gap: 12,
										padding: '14px 22px',
										borderBottom: '1px solid var(--bf-line)',
										alignItems: 'center',
									}}
								>
									<Skeleton h={16} w={16} r={4} />
									<Skeleton h={44} w={44} r={8} />
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: 5,
										}}
									>
										<Skeleton h={13} w='80%' />
										<Skeleton h={10} w='40%' />
									</div>
									<Skeleton h={13} w='70%' />
									<Skeleton h={14} w={70} />
									<Skeleton h={20} w={60} r={999} />
									<div
										style={{
											display: 'flex',
											gap: 4,
											justifyContent: 'flex-end',
										}}
									>
										<Skeleton h={28} w={28} r={999} />
										<Skeleton h={28} w={28} r={999} />
									</div>
								</div>
							))}
						</div>
					) : error ? (
						<div
							style={{
								padding: '32px',
								textAlign: 'center',
							}}
						>
							<p
								style={{
									color: 'var(--bf-mute)',
									fontSize: 13,
									marginBottom: 12,
								}}
							>
								Could not load products
							</p>
							<button
								className='bf-btn bf-btn-outline bf-btn-sm'
								onClick={() => mutate()}
							>
								Retry
							</button>
						</div>
					) : filteredProducts.length === 0 ? (
						<div
							style={{
								padding: '48px',
								textAlign: 'center',
							}}
						>
							<p
								style={{ color: 'var(--bf-mute)', fontSize: 13, marginBottom: 14 }}
							>
								No items in this category
							</p>
							<button
								className='bf-btn bf-btn-primary bf-btn-sm'
								onClick={openAdd}
							>
								{Icons.plus} Add first item
							</button>
						</div>
					) : (
						filteredProducts.map((it, i) => (
							<div
								key={it.id}
								style={{
									display: 'grid',
									gridTemplateColumns:
										'40px 64px 1.4fr 1fr 110px 110px 80px',
									gap: 12,
									padding: '12px 22px',
									borderBottom:
										i < filteredProducts.length - 1
											? '1px solid var(--bf-line)'
											: 'none',
									alignItems: 'center',
								}}
							>
								<input type='checkbox' />
								<FoodImg
									tone={TONES[i % TONES.length]}
									style={{ width: 44, height: 44 }}
								/>
								<div>
									<div style={{ font: '700 14px var(--bf-font)' }}>
										{it.name}
									</div>
									<div
										className='bf-mono'
										style={{ fontSize: 10.5, color: 'var(--bf-mute)' }}
									>
										ID-{it.id}
										{it.isHot && (
											<span
												style={{
													marginLeft: 6,
													color: 'var(--bf-ember)',
												}}
											>
												HOT
											</span>
										)}
									</div>
								</div>
								<span
									style={{ fontSize: 13, color: 'var(--bf-ink-2)' }}
								>
									{it.category}
								</span>
								<span
									style={{ fontWeight: 800, fontSize: 14 }}
									className='bf-tabular'
								>
									{it.hasSizes && it.priceSmall
										? <>
											<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--bf-mute)' }}>From </span>
											{rs(it.priceSmall)}
										</>
										: rs(it.price)
									}
								</span>
								<span>
									{it.isAvailable ? (
										<span
											className='bf-pill'
											style={{
												background: '#DCFCE7',
												color: '#166534',
												boxShadow: 'none',
											}}
										>
											<span className='bf-dot bf-dot-ready' />
											LIVE
										</span>
									) : (
										<span
											className='bf-pill'
											style={{
												background: '#F1ECE3',
												color: 'var(--bf-mute)',
												boxShadow: 'none',
											}}
										>
											OFF
										</span>
									)}
								</span>
								<div
									style={{
										display: 'flex',
										gap: 4,
										justifyContent: 'flex-end',
									}}
								>
									<button
										className='bf-btn bf-btn-ghost bf-btn-icon'
										style={{ width: 28, height: 28 }}
										onClick={() => openEdit(it)}
									>
										{Icons.edit}
									</button>
									<button
										className='bf-btn bf-btn-ghost bf-btn-icon'
										style={{
											width: 28,
											height: 28,
											color: 'var(--bf-ember)',
										}}
										onClick={() => setDeleteId(it.id)}
									>
										{Icons.trash}
									</button>
								</div>
							</div>
						))
					)}
				</div>

				{/* Add / Edit panel */}
				{panel.mode !== 'closed' && (
					<div className='bf-card' style={{ padding: 22, height: 'fit-content' }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 16,
							}}
						>
							<div className='bf-eyebrow'>
								{panel.mode === 'add' ? 'ADD ITEM' : 'EDIT ITEM'}
							</div>
							<button
								className='bf-btn bf-btn-ghost bf-btn-icon'
								style={{ width: 28, height: 28 }}
								onClick={closePanel}
							>
								✕
							</button>
						</div>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 14,
							}}
						>
							<div>
								<label className='bf-label'>Name *</label>
								<input
									className='bf-input'
									value={form.name}
									onChange={(e) =>
										setForm((f) => ({ ...f, name: e.target.value }))
									}
									placeholder='e.g. Buddy Pepperoni'
								/>
							</div>
							<div>
								<label className='bf-label'>Category *</label>
								<select
									className='bf-input'
									value={form.categoryId ?? ''}
									onChange={(e) => {
										const category = categories.find(
											(c) => c.id === Number(e.target.value),
										)
										setForm((f) => ({
											...f,
											categoryId: category?.id ?? null,
											category: category?.name ?? '',
										}))
									}}
								>
									<option value='' disabled>
										Select category
									</option>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
								<button
									className='bf-btn bf-btn-outline bf-btn-sm'
									style={{ width: '100%', marginTop: 8 }}
									onClick={() => {
										setCategoryError(null)
										setCategoryDialogOpen(true)
									}}
								>
									{Icons.plus} Add new category
								</button>
							</div>
							{!form.hasSizes ? (
								<div>
									<label className='bf-label'>Price (Rs.) *</label>
									<input
										className='bf-input'
										type='number'
										min={0}
										value={form.price || ''}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												price: parseFloat(e.target.value) || 0,
											}))
										}
										placeholder='349'
									/>
								</div>
							) : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									<label className='bf-label'>
										Size Prices (Rs.) *
										<span style={{ fontWeight: 400, color: 'var(--bf-mute)', marginLeft: 6 }}>
											{form.priceLarge ? 'S / M / L' : 'Half / Full'}
										</span>
									</label>
									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
										<div>
											<label className='bf-label' style={{ fontSize: 10 }}>
												{form.priceLarge ? 'Small (6\")' : 'Half'}
											</label>
											<input
												className='bf-input'
												type='number'
												min={0}
												value={form.priceSmall || ''}
												onChange={(e) => setForm(f => ({ ...f, priceSmall: parseFloat(e.target.value) || null }))}
												placeholder='330'
											/>
										</div>
										<div>
											<label className='bf-label' style={{ fontSize: 10 }}>
												{form.priceLarge ? 'Medium (9\")' : 'Full'}
											</label>
											<input
												className='bf-input'
												type='number'
												min={0}
												value={form.priceMedium || ''}
												onChange={(e) => setForm(f => ({ ...f, priceMedium: parseFloat(e.target.value) || null }))}
												placeholder='650'
											/>
										</div>
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<button
											type='button'
											onClick={() => setForm(f => ({ ...f, priceLarge: f.priceLarge ? null : 0 }))}
											style={{
												width: 16, height: 16, borderRadius: 4, border: `2px solid ${form.priceLarge !== null && form.priceLarge !== undefined ? 'var(--bf-ink)' : 'var(--bf-line-2)'}`,
												background: form.priceLarge !== null && form.priceLarge !== undefined ? 'var(--bf-ink)' : 'transparent',
												cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
											}}
										>
											{form.priceLarge !== null && form.priceLarge !== undefined && (
												<svg width={8} height={8} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={3}><path d='M4 12l5 5L20 6' /></svg>
											)}
										</button>
										<span style={{ fontSize: 12, color: 'var(--bf-ink-2)' }}>Has a Large (12") size</span>
										{form.priceLarge !== null && form.priceLarge !== undefined && (
											<input
												className='bf-input'
												type='number'
												min={0}
												value={form.priceLarge || ''}
												onChange={(e) => setForm(f => ({ ...f, priceLarge: parseFloat(e.target.value) || 0 }))}
												placeholder='930'
												style={{ flex: 1, minWidth: 0 }}
											/>
										)}
									</div>
								</div>
							)}
							<div>
								<label className='bf-label'>Description</label>
								<textarea
									className='bf-input'
									rows={2}
									value={form.description ?? ''}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											description: e.target.value,
										}))
									}
									placeholder='Short description…'
									style={{ resize: 'vertical' }}
								/>
							</div>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr 1fr',
									gap: 8,
								}}
							>
								{(
									[
										['isAvailable', 'Available'],
										['isHot', 'Hot item'],
										['hasSizes', 'Has sizes'],
									] as const
								).map(([key, label]) => (
									<button
										key={key}
										onClick={() =>
											setForm((f) => ({ ...f, [key]: !f[key] }))
										}
										style={{
											padding: '8px 6px',
											borderRadius: 10,
											border:
												'1.5px solid ' +
												(form[key]
													? 'var(--bf-ink)'
													: 'var(--bf-line-2)'),
											background: form[key]
												? 'var(--bf-cream-2)'
												: 'var(--bf-paper)',
											cursor: 'pointer',
											font: '600 11.5px var(--bf-font)',
											color: form[key]
												? 'var(--bf-ink)'
												: 'var(--bf-mute)',
										}}
									>
										{form[key] ? '✓ ' : ''}
										{label}
									</button>
								))}
							</div>

							{saveError && (
								<div
									style={{
										padding: '8px 12px',
										borderRadius: 10,
										background: 'rgba(232,67,31,.1)',
										color: 'var(--bf-ember)',
										fontSize: 12.5,
										fontWeight: 600,
									}}
								>
									{saveError}
								</div>
							)}

							<hr className='bf-rule' />
							<div style={{ display: 'flex', gap: 8 }}>
								<button
									className='bf-btn bf-btn-outline bf-btn-md'
									style={{ flex: 1 }}
									onClick={closePanel}
								>
									Cancel
								</button>
								<button
									className='bf-btn bf-btn-primary bf-btn-md'
									style={{ flex: 2 }}
									disabled={saving}
									onClick={handleSave}
								>
									{saving ? 'Saving…' : panel.mode === 'add' ? 'Add item' : 'Save changes'}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Category creation overlay */}
			{categoryDialogOpen && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(35,31,32,.5)',
						display: 'grid',
						placeItems: 'center',
						zIndex: 55,
					}}
					onClick={() => !creatingCategory && setCategoryDialogOpen(false)}
				>
					<div
						className='bf-card'
						style={{ padding: 28, maxWidth: 380, width: '100%' }}
						onClick={(e) => e.stopPropagation()}
					>
						<h3
							style={{
								fontWeight: 800,
								fontSize: 17,
								marginBottom: 8,
							}}
						>
							Add new category
						</h3>
						<p
							style={{
								fontSize: 13,
								color: 'var(--bf-mute)',
								marginBottom: 18,
							}}
						>
							Create a category and select it for this item.
						</p>
						<div style={{ marginBottom: 14 }}>
							<label className='bf-label'>Category name *</label>
							<input
								className='bf-input'
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								placeholder='e.g. Pizza'
								autoFocus
							/>
						</div>
						{categoryError && (
							<div
								style={{
									padding: '8px 12px',
									borderRadius: 10,
									background: 'rgba(232,67,31,.1)',
									color: 'var(--bf-ember)',
									fontSize: 12.5,
									fontWeight: 600,
									marginBottom: 14,
								}}
							>
								{categoryError}
							</div>
						)}
						<div style={{ display: 'flex', gap: 8 }}>
							<button
								className='bf-btn bf-btn-outline bf-btn-md'
								style={{ flex: 1 }}
								disabled={creatingCategory}
								onClick={() => setCategoryDialogOpen(false)}
							>
								Cancel
							</button>
							<button
								className='bf-btn bf-btn-primary bf-btn-md'
								style={{ flex: 1 }}
								disabled={creatingCategory}
								onClick={handleCreateCategory}
							>
								{creatingCategory ? 'Creating…' : 'Create'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete confirmation overlay */}
			{deleteId !== null && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(35,31,32,.5)',
						display: 'grid',
						placeItems: 'center',
						zIndex: 50,
					}}
					onClick={() => !deleting && setDeleteId(null)}
				>
					<div
						className='bf-card'
						style={{ padding: 28, maxWidth: 360, width: '100%' }}
						onClick={(e) => e.stopPropagation()}
					>
						<h3
							style={{
								fontWeight: 800,
								fontSize: 17,
								marginBottom: 8,
							}}
						>
							Delete item?
						</h3>
						<p
							style={{
								fontSize: 13,
								color: 'var(--bf-mute)',
								marginBottom: 20,
							}}
						>
							This will permanently remove the item from the menu. This
							cannot be undone.
						</p>
						<div style={{ display: 'flex', gap: 8 }}>
							<button
								className='bf-btn bf-btn-outline bf-btn-md'
								style={{ flex: 1 }}
								disabled={deleting}
								onClick={() => setDeleteId(null)}
							>
								Cancel
							</button>
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
