'use client'
import React, { useState, useEffect } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Icons } from '../ui/icon'
import { Skeleton } from '../ui/skeleton'
import { useDeals, saveDeal, deleteDeal } from '../../lib/hooks'
import type { Deal } from '../../lib/types'

const EMPTY_DEAL: Omit<Deal, 'id'> = {
	title: '',
	description: '',
	tag: '',
	badge: '',
	originalPrice: null,
	discountPrice: null,
	isActive: true,
}

// ─── DEALS ────────────────────────────────────────────────────────────────────
export function AdminDeals() {
	const { data: deals, isLoading, error, mutate } = useDeals()
	const [selected, setSelected] = useState<Deal | null>(null)
	const [isNew, setIsNew] = useState(false)
	const [form, setForm] = useState<Omit<Deal, 'id'>>(EMPTY_DEAL)
	const [saving, setSaving] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const [deleting, setDeleting] = useState(false)

	useEffect(() => {
		if (deals && deals.length > 0 && !selected && !isNew) {
			const first = deals[0]
			setSelected(first)
			setForm({
				title: first.title,
				description: first.description ?? '',
				tag: first.tag ?? '',
				badge: first.badge ?? '',
				originalPrice: first.originalPrice ?? null,
				discountPrice: first.discountPrice ?? null,
				isActive: first.isActive,
			})
		}
	}, [deals])

	function selectDeal(deal: Deal) {
		setIsNew(false)
		setSaveError(null)
		setSelected(deal)
		setForm({
			title: deal.title,
			description: deal.description ?? '',
			tag: deal.tag ?? '',
			badge: deal.badge ?? '',
			originalPrice: deal.originalPrice ?? null,
			discountPrice: deal.discountPrice ?? null,
			isActive: deal.isActive,
		})
	}

	function openNew() {
		setIsNew(true)
		setSelected(null)
		setSaveError(null)
		setForm({ ...EMPTY_DEAL })
	}

	async function handleSave() {
		if (!form.title.trim()) {
			setSaveError('Title is required.')
			return
		}
		setSaving(true)
		setSaveError(null)
		try {
			await saveDeal(isNew ? null : selected?.id ?? null, form)
			setIsNew(false)
		} catch {
			setSaveError('Failed to save. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete(id: number) {
		setDeleting(true)
		try {
			await deleteDeal(id)
			setDeleteId(null)
			setSelected(null)
			setIsNew(false)
		} catch {
			// ignore
		} finally {
			setDeleting(false)
		}
	}

	async function handleToggleActive() {
		if (!selected) return
		setSaving(true)
		try {
			await saveDeal(selected.id, { ...form, isActive: !form.isActive })
			setForm((f) => ({ ...f, isActive: !f.isActive }))
		} finally {
			setSaving(false)
		}
	}

	const activeCount = (deals ?? []).filter((d) => d.isActive).length
	const inactiveCount = (deals ?? []).filter((d) => !d.isActive).length

	return (
		<AdminShell active='deals'>
			<AdminTopbar
				title='Deals & promotions'
				sub={
					isLoading
						? 'Loading…'
						: `${activeCount} ACTIVE · ${inactiveCount} INACTIVE`
				}
				cta='New promo'
			/>
			<div
				style={{
					padding: 28,
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: 18,
				}}
			>
				{/* Deal list */}
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
							All promotions
						</h2>
						<button
							className='bf-btn bf-btn-primary bf-btn-sm'
							onClick={openNew}
						>
							{Icons.plus} New promo
						</button>
					</div>

					{isLoading ? (
						<div
							style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
						>
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									style={{
										padding: '14px 22px',
										borderBottom: '1px solid var(--bf-line)',
										display: 'flex',
										gap: 14,
										alignItems: 'center',
									}}
								>
									<Skeleton h={56} w={56} r={12} />
									<div
										style={{
											flex: 1,
											display: 'flex',
											flexDirection: 'column',
											gap: 7,
										}}
									>
										<div style={{ display: 'flex', gap: 6 }}>
											<Skeleton h={18} w={60} r={999} />
											<Skeleton h={18} w={120} />
										</div>
										<Skeleton h={11} w='80%' />
										<Skeleton h={4} r={2} />
									</div>
								</div>
							))}
						</div>
					) : error ? (
						<div
							style={{ padding: '32px', textAlign: 'center' }}
						>
							<p
								style={{
									color: 'var(--bf-mute)',
									fontSize: 13,
									marginBottom: 12,
								}}
							>
								Could not load deals
							</p>
							<button
								className='bf-btn bf-btn-outline bf-btn-sm'
								onClick={() => mutate()}
							>
								Retry
							</button>
						</div>
					) : (deals ?? []).length === 0 ? (
						<div
							style={{ padding: '48px', textAlign: 'center' }}
						>
							<p
								style={{
									color: 'var(--bf-mute)',
									fontSize: 13,
									marginBottom: 14,
								}}
							>
								No promotions yet
							</p>
							<button
								className='bf-btn bf-btn-primary bf-btn-sm'
								onClick={openNew}
							>
								{Icons.plus} Create first promo
							</button>
						</div>
					) : (
						(deals ?? []).map((p, i) => {
							const isSelected =
								!isNew && selected?.id === p.id
							const statusColor = p.isActive
								? 'var(--bf-ember)'
								: 'var(--bf-line)'
							const pillStyle = p.isActive
								? { background: '#DCFCE7', color: '#166534' }
								: { background: '#F1ECE3', color: 'var(--bf-mute)' }
							return (
								<div
									key={p.id}
									onClick={() => selectDeal(p)}
									style={{
										padding: '14px 22px',
										borderBottom:
											i < (deals ?? []).length - 1
												? '1px solid var(--bf-line)'
												: 'none',
										display: 'flex',
										gap: 14,
										alignItems: 'center',
										cursor: 'pointer',
										background: isSelected
											? 'var(--bf-cream-2)'
											: 'transparent',
										transition: 'background .12s',
									}}
								>
									<div
										style={{
											width: 56,
											height: 56,
											borderRadius: 12,
											background: statusColor,
											color: p.isActive ? '#fff' : 'var(--bf-mute)',
											display: 'grid',
											placeItems: 'center',
											flexShrink: 0,
										}}
									>
										{Icons.pct}
									</div>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 8,
											}}
										>
											{p.tag && (
												<span className='bf-pill bf-pill-ink'>
													{p.tag}
												</span>
											)}
											<span
												style={{
													font: '800 14.5px var(--bf-font)',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
											>
												{p.title}
											</span>
										</div>
										{p.description && (
											<div
												style={{
													fontSize: 12.5,
													color: 'var(--bf-ink-2)',
													marginTop: 3,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
											>
												{p.description}
											</div>
										)}
										{p.originalPrice != null &&
											p.discountPrice != null && (
												<div
													className='bf-mono'
													style={{
														fontSize: 10.5,
														color: 'var(--bf-mute)',
														marginTop: 5,
													}}
												>
													Rs. {p.originalPrice} → Rs. {p.discountPrice}
												</div>
											)}
									</div>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'flex-end',
											gap: 6,
											flexShrink: 0,
										}}
									>
										<span
											className='bf-pill'
											style={{ ...pillStyle, boxShadow: 'none' }}
										>
											{p.isActive ? 'ACTIVE' : 'INACTIVE'}
										</span>
										<button
											className='bf-btn bf-btn-ghost bf-btn-icon'
											style={{ width: 26, height: 26 }}
											onClick={(e) => {
												e.stopPropagation()
												setDeleteId(p.id)
											}}
										>
											{Icons.trash}
										</button>
									</div>
								</div>
							)
						})
					)}
				</div>

				{/* Editor */}
				<div className='bf-card' style={{ padding: 22 }}>
					{!selected && !isNew ? (
						<div
							style={{
								height: '100%',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 12,
								minHeight: 300,
							}}
						>
							<span style={{ fontSize: 28, opacity: 0.3 }}>
								{Icons.pct}
							</span>
							<p style={{ fontSize: 13, color: 'var(--bf-mute)' }}>
								Select a promotion to edit
							</p>
							<button
								className='bf-btn bf-btn-primary bf-btn-sm'
								onClick={openNew}
							>
								{Icons.plus} New promo
							</button>
						</div>
					) : (
						<>
							<div className='bf-eyebrow'>
								{isNew ? 'NEW PROMOTION' : 'EDIT PROMOTION'}
							</div>
							<h2
								style={{
									fontWeight: 800,
									fontSize: 20,
									margin: '4px 0 18px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{isNew
									? 'New promotion'
									: `${form.tag ? form.tag + ' · ' : ''}${form.title || 'Untitled'}`}
							</h2>

							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: 14,
								}}
							>
								<div>
									<label className='bf-label'>Title *</label>
									<input
										className='bf-input'
										value={form.title}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												title: e.target.value,
											}))
										}
										placeholder='e.g. BOGO Pizza'
									/>
								</div>

								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr',
										gap: 12,
									}}
								>
									<div>
										<label className='bf-label'>Promo tag / code</label>
										<input
											className='bf-input bf-mono'
											value={form.tag ?? ''}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													tag: e.target.value.toUpperCase(),
												}))
											}
											placeholder='FRIDAY'
											style={{
												fontWeight: 700,
												letterSpacing: '.08em',
											}}
										/>
									</div>
									<div>
										<label className='bf-label'>Badge label</label>
										<input
											className='bf-input'
											value={form.badge ?? ''}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													badge: e.target.value,
												}))
											}
											placeholder='HOT · BOGO · NEW'
										/>
									</div>
								</div>

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
										placeholder='Short description of this promotion…'
										style={{ resize: 'vertical' }}
									/>
								</div>

								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr',
										gap: 12,
									}}
								>
									<div>
										<label className='bf-label'>Original price (Rs.)</label>
										<input
											className='bf-input'
											type='number'
											min={0}
											value={form.originalPrice ?? ''}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													originalPrice:
														e.target.value
															? parseFloat(e.target.value)
															: null,
												}))
											}
											placeholder='1290'
										/>
									</div>
									<div>
										<label className='bf-label'>Discounted price (Rs.)</label>
										<input
											className='bf-input'
											type='number'
											min={0}
											value={form.discountPrice ?? ''}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													discountPrice:
														e.target.value
															? parseFloat(e.target.value)
															: null,
												}))
											}
											placeholder='990'
										/>
									</div>
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
									{!isNew && (
										<button
											className='bf-btn bf-btn-outline bf-btn-md'
											style={{ flex: 1 }}
											disabled={saving}
											onClick={handleToggleActive}
										>
											{form.isActive ? 'Pause' : 'Activate'}
										</button>
									)}
									<button
										className='bf-btn bf-btn-primary bf-btn-md'
										style={{ flex: 2 }}
										disabled={saving}
										onClick={handleSave}
									>
										{saving
											? 'Saving…'
											: isNew
											? 'Create promo'
											: 'Save changes'}
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

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
							Delete promotion?
						</h3>
						<p
							style={{
								fontSize: 13,
								color: 'var(--bf-mute)',
								marginBottom: 20,
							}}
						>
							This will permanently remove this promotion. This cannot be
							undone.
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
								style={{ flex: 1 }}
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
