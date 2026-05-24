'use client'
import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CustomerShell } from '../layout/customer-shell'
import { FoodImg, type Tone } from '../ui/food-img'
import { DealCard } from '../home/home-primitives'
import { Icons } from '../ui/icon'
import { rs, useDeals, parseDealItems, getDealExpiryBadge, type OptionGroup } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'

const TONES: Tone[] = ['ember', 'amber', 'ink']

function BackIcon() {
	return (
		<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
			<path d='M19 12H5M12 5l-7 7 7 7' />
		</svg>
	)
}

function CheckIcon() {
	return (
		<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round'>
			<polyline points='20 6 9 17 4 12' className='bf-check-stroke' />
		</svg>
	)
}

function QtyControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
	return (
		<div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--bf-line-2)', borderRadius: 999, overflow: 'hidden' }}>
			<button
				type='button'
				onClick={() => onChange(Math.max(1, value - 1))}
				style={{ width: 40, height: 40, border: 0, background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--bf-ink)', transition: 'background .12s' }}
				onMouseEnter={e => (e.currentTarget.style.background = 'var(--bf-cream-2)')}
				onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
			>{Icons.minus}</button>
			<span style={{ minWidth: 36, textAlign: 'center', font: '800 16px var(--bf-font)', color: 'var(--bf-ink)' }}>{value}</span>
			<button
				type='button'
				onClick={() => onChange(value + 1)}
				style={{ width: 40, height: 40, border: 0, background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--bf-ink)', transition: 'background .12s' }}
				onMouseEnter={e => (e.currentTarget.style.background = 'var(--bf-cream-2)')}
				onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
			>{Icons.plus}</button>
		</div>
	)
}

function Skel({ h, w, style }: { h: number; w?: number | string; style?: React.CSSProperties }) {
	return <div className='bf-skeleton' style={{ height: h, width: w, borderRadius: 12, ...style }} />
}

// ─── Options Picker Modal ─────────────────────────────────────────────────────
function getItemGroups(item: ReturnType<typeof parseDealItems>[number]): OptionGroup[] {
	if (item.options?.length) return item.options
	if (item.availableFlavors?.length) return [{ label: 'Flavor', type: 'single', required: false, choices: item.availableFlavors.map(s => ({ label: s, priceAdjustment: 0 })) }]
	return []
}

function totalAdjustment(groups: OptionGroup[], selectedOptions: Record<string, string[]>, itemName: string): number {
	let total = 0
	for (const g of groups) {
		const key = `${itemName}__${g.label}`
		const sel = selectedOptions[key] ?? []
		for (const s of sel) {
			const choice = g.choices.find(c => c.label === s)
			if (choice) total += choice.priceAdjustment ?? 0
		}
	}
	return total
}

function OptionsPickerModal({
	optionItems,
	selectedOptions,
	onSelect,
	onConfirm,
	onClose,
	dealPrice,
	qty,
}: {
	optionItems: ReturnType<typeof parseDealItems>
	selectedOptions: Record<string, string[]>
	onSelect: (key: string, value: string, type: 'single' | 'multi') => void
	onConfirm: () => void
	onClose: () => void
	dealPrice: number
	qty: number
}) {
	const allRequiredMet = optionItems.every(item =>
		getItemGroups(item).every(g => !g.required || (selectedOptions[`${item.name}__${g.label}`]?.length ?? 0) > 0)
	)

	const totalAdj = optionItems.reduce((sum, item) => sum + totalAdjustment(getItemGroups(item), selectedOptions, item.name), 0)

	return (
		<div
			style={{ position: 'fixed', inset: 0, background: 'rgba(35,31,32,.65)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', zIndex: 100 }}
			onClick={onClose}
		>
			<div
				className='bf-card'
				style={{ padding: 0, maxWidth: 460, width: '92%', borderRadius: 22, overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
				onClick={e => e.stopPropagation()}
			>
				{/* Header */}
				<div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--bf-line)', flexShrink: 0 }}>
					<div className='bf-eyebrow' style={{ marginBottom: 4 }}>CUSTOMIZE YOUR DEAL</div>
					<h3 style={{ fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: '-0.02em' }}>Choose your options</h3>
					<p style={{ fontSize: 13, color: 'var(--bf-ink-2)', margin: '6px 0 0' }}>Make your selections below before adding to cart</p>
				</div>

				{/* Items */}
				<div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }} className='bf-scroll'>
					{optionItems.map((item, idx) => {
						const groups = getItemGroups(item)
						return (
							<div key={idx}>
								<div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--bf-ink)' }}>
									{item.qty}× {item.name}
								</div>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
									{groups.map(g => {
										const key = `${item.name}__${g.label}`
										const sel = selectedOptions[key] ?? []
										return (
											<div key={g.label}>
												<div style={{ fontSize: 10.5, fontWeight: 800, color: g.required ? 'var(--bf-ember)' : 'var(--bf-mute)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
													{g.label}
													{g.required
														? <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--bf-ember)', background: 'rgba(232,67,31,.08)', padding: '1px 6px', borderRadius: 999 }}>required</span>
														: <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--bf-mute)', opacity: .7 }}>optional</span>
													}
												</div>
												<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
													{g.choices.map(choice => {
														const isSelected = sel.includes(choice.label)
														return (
															<button
																key={choice.label}
																className={`bf-btn bf-btn-sm ${isSelected ? 'bf-btn-primary' : 'bf-btn-outline'}`}
																style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}
																onClick={() => onSelect(key, choice.label, g.type)}
															>
																{choice.label}
																{choice.priceAdjustment ? <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.8 }}>+Rs.{choice.priceAdjustment}</span> : null}
															</button>
														)
													})}
												</div>
											</div>
										)
									})}
								</div>
							</div>
						)
					})}
				</div>

				{/* Footer */}
				<div style={{ padding: '16px 24px', borderTop: '1px solid var(--bf-line)', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
					{totalAdj > 0 && (
						<div style={{ fontSize: 11, color: 'var(--bf-mute)', textAlign: 'center' }}>
							Option adjustments: <strong>+Rs.{totalAdj.toLocaleString('en-PK')}</strong>
						</div>
					)}
					<div style={{ display: 'flex', gap: 10 }}>
						<button className='bf-btn bf-btn-outline bf-btn-md' style={{ flex: 1 }} onClick={onClose}>Cancel</button>
						<button
							className='bf-btn bf-btn-primary bf-btn-md'
							style={{ flex: 2, opacity: allRequiredMet ? 1 : 0.5 }}
							disabled={!allRequiredMet}
							onClick={onConfirm}
						>
							Add to cart · {rs(dealPrice * qty)}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── DEAL DETAIL PAGE ─────────────────────────────────────────────────────────
function DealDetailPage({ dealId }: { dealId: number }) {
	const router = useRouter()
	const { data: deals, isLoading } = useDeals()

	const addItem = useCartStore((s) => s.addItem)
	const cartItems = useCartStore((s) => s.items)

	const deal = deals?.find((d) => d.id === dealId)
	const parsedItems = parseDealItems(deal?.items)
	const optionItems = parsedItems.filter(i => (i.options?.length ?? 0) > 0 || (i.availableFlavors?.length ?? 0) > 0)
	const needsOptions = optionItems.length > 0

	const savings =
		deal?.originalPrice && deal?.discountPrice && deal.originalPrice > deal.discountPrice
			? deal.originalPrice - deal.discountPrice
			: null
	const inCart = cartItems.some((i) => i.dealId === dealId)
	const cartQty = cartItems.find((i) => i.dealId === dealId)?.quantity ?? 0
	const expiryBadge = getDealExpiryBadge(deal?.expiresAt)

	const [qty, setQty] = useState(1)
	const [addState, setAddState] = useState<'idle' | 'added'>('idle')
	const [showOptionsPicker, setShowOptionsPicker] = useState(false)
	const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
	const [showTerms, setShowTerms] = useState(false)

	function handleOptionSelect(key: string, value: string, type: 'single' | 'multi') {
		setSelectedOptions(prev => {
			const current = prev[key] ?? []
			if (type === 'single') return { ...prev, [key]: current.includes(value) ? [] : [value] }
			return { ...prev, [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] }
		})
	}

	const tone: Tone = TONES[dealId % TONES.length]

	const otherDeals = useMemo(
		() => deals?.filter((d) => d.isActive && d.id !== dealId).slice(0, 3) ?? [],
		[deals, dealId],
	)

	function buildCustomizations(): string {
		return parsedItems.map(item => {
			const parts = [`${item.qty}× ${item.name}`]
			if (item.options?.length) {
				for (const g of item.options) {
					const sel = selectedOptions[`${item.name}__${g.label}`] ?? []
					if (sel.length > 0) parts.push(`${g.label}: ${sel.join(', ')}`)
				}
			} else {
				if (item.size) parts.push(item.size)
				const flavorSel = selectedOptions[`${item.name}__Flavor`]?.[0]
				if (flavorSel) parts.push(flavorSel)
			}
			return parts.join(' · ')
		}).join(', ')
	}

	function addToCart() {
		if (!deal) return
		addItem({
			productId: 0,
			dealId: deal.id,
			productName: deal.title,
			price: deal.discountPrice ?? 0,
			quantity: qty,
			customizations: buildCustomizations(),
		})
		setAddState('added')
		setShowOptionsPicker(false)
		setTimeout(() => setAddState('idle'), 2200)
	}

	function handleAdd() {
		if (!deal) return
		if (needsOptions) {
			setShowOptionsPicker(true)
			return
		}
		addToCart()
	}

	function handleShare() {
		if (!deal) return
		if (navigator.share) {
			navigator.share({ title: deal.title, text: deal.description ?? deal.title, url: window.location.href }).catch(() => { })
		} else {
			navigator.clipboard.writeText(window.location.href).catch(() => { })
		}
	}

	// ── Loading ──
	if (isLoading) {
		return (
			<CustomerShell>
				<div className='bf-pd-wrap'>
					<Skel h={18} w={80} style={{ marginBottom: 24 }} />
					<div className='bf-pd-layout'>
						<Skel h={420} style={{ borderRadius: 22 }} />
						<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
							<Skel h={12} w={100} />
							<Skel h={52} w='80%' />
							<Skel h={34} w={120} />
							<Skel h={18} />
							<Skel h={80} />
							{[1, 2, 3].map((i) => <Skel key={i} h={52} />)}
							<Skel h={56} style={{ marginTop: 8 }} />
						</div>
					</div>
				</div>
			</CustomerShell>
		)
	}

	// ── 404 ──
	if (!deal) {
		return (
			<CustomerShell>
				<div style={{ padding: '80px 20px', textAlign: 'center' }}>
					<div style={{ fontSize: 52, marginBottom: 16 }}>🏷️</div>
					<div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>Deal not found</div>
					<div style={{ color: 'var(--bf-ink-2)', fontSize: 14, marginTop: 8 }}>This deal may have ended or been removed.</div>
					<Link href='/deals' className='bf-btn bf-btn-outline bf-btn-md' style={{ marginTop: 20, display: 'inline-flex' }}>
						← Browse all deals
					</Link>
				</div>
			</CustomerShell>
		)
	}

	const isAdded = addState === 'added'

	return (
		<CustomerShell>
			<main>
				<div className='bf-pd-wrap'>
					{/* ── Nav row ── */}
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
						<button
							onClick={() => router.back()}
							className='bf-btn bf-btn-ghost bf-btn-sm'
							style={{ gap: 5, paddingLeft: 2, color: 'var(--bf-ink-2)' }}
						>
							<BackIcon />
							All deals
						</button>
						<button
							className='bf-btn bf-btn-ghost bf-btn-icon'
							style={{ color: 'var(--bf-ink-2)' }}
							onClick={handleShare}
							title='Share this deal'
						>
							<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
								<circle cx='18' cy='5' r='3'/><circle cx='6' cy='12' r='3'/><circle cx='18' cy='19' r='3'/>
								<line x1='8.59' y1='13.51' x2='15.42' y2='17.49'/><line x1='15.41' y1='6.51' x2='8.59' y2='10.49'/>
							</svg>
						</button>
					</div>

					{/* ── Expiry countdown banner ── */}
					{expiryBadge && (
						<div style={{
							marginBottom: 20, padding: '12px 18px', borderRadius: 14,
							background: expiryBadge.urgent ? 'rgba(220,38,38,.06)' : 'rgba(146,64,14,.06)',
							border: `1px solid ${expiryBadge.urgent ? 'rgba(220,38,38,.18)' : 'rgba(146,64,14,.15)'}`,
							display: 'flex', alignItems: 'center', gap: 12,
						}}>
							<span style={{ fontSize: 20 }}>⏱</span>
							<div>
								<div style={{ fontWeight: 800, fontSize: 14, color: expiryBadge.urgent ? '#dc2626' : '#92400e' }}>{expiryBadge.text}</div>
								<div style={{ fontSize: 11, color: 'var(--bf-ink-2)', marginTop: 1 }}>Don&apos;t miss out on this deal</div>
							</div>
						</div>
					)}

					{/* ── 2-col layout ── */}
					<div className='bf-pd-layout'>
						{/* LEFT — hero image */}
						<div className='bf-pd-image-col bf-fade-up'>
							{deal.imageUrl ? (
								<img
									src={deal.imageUrl}
									alt={deal.title}
									style={{ width: '100%', borderRadius: 22, objectFit: 'cover', aspectRatio: '4/3' }}
								/>
							) : (
								<FoodImg
									tone={tone}
									caption={'deal · ' + deal.title.toLowerCase()}
									className='bf-pd-hero-img'
								/>
							)}

							{/* Savings highlight */}
							{savings && (
								<div className='bf-pd-trust-strip' style={{ marginTop: 16, borderRadius: 14, padding: '14px 18px', background: 'rgba(47,143,78,.08)', border: '1px solid rgba(47,143,78,.22)', display: 'flex', alignItems: 'center', gap: 12 }}>
									<div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bf-leaf)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
										<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
											<path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
										</svg>
									</div>
									<div>
										<div style={{ fontWeight: 800, fontSize: 15, color: 'var(--bf-leaf)' }}>Save {rs(savings)}</div>
										<div style={{ fontSize: 12, color: 'var(--bf-ink-2)', marginTop: 2 }}>vs. ordering separately</div>
									</div>
								</div>
							)}
						</div>

						{/* RIGHT — deal info */}
						<div className='bf-pd-detail-col bf-fade-up-1'>
							{/* Tag + badges */}
							<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
								{deal.tag && <span className='bf-eyebrow' style={{ color: 'var(--bf-mute)' }}>{deal.tag}</span>}
								{savings && <span className='bf-pill bf-pill-leaf' style={{ fontSize: 10 }}>Save {rs(savings)}</span>}
								{deal.badge && <span className='bf-pill bf-pill-ember'>{deal.badge}</span>}
								{expiryBadge && (
									<span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: expiryBadge.urgent ? '#dc2626' : '#92400e', background: expiryBadge.urgent ? '#fee2e2' : '#fef3c7' }}>
										⏱ {expiryBadge.text}
									</span>
								)}
							</div>

							{/* Title */}
							<h1 style={{ fontWeight: 900, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.04, marginBottom: 12 }}>
								{deal.title}
							</h1>

							{/* Description */}
							{deal.description && (
								<p style={{ color: 'var(--bf-ink-2)', fontSize: 15, lineHeight: 1.55, marginBottom: 20 }}>
									{deal.description}
								</p>
							)}

							{/* Included items */}
							{parsedItems.length > 0 && (
								<div style={{ marginBottom: 24 }}>
									<div className='bf-eyebrow' style={{ marginBottom: 12, color: 'var(--bf-ink-2)' }}>WHAT&apos;S INCLUDED</div>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
										{parsedItems.map((item, i) => {
											const groups = getItemGroups(item)
											return (
												<div key={i} style={{ padding: '11px 14px', background: 'var(--bf-paper)', borderRadius: 12, border: '1px solid var(--bf-line)' }}>
													<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
														<div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bf-ember)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
															<CheckIcon />
														</div>
														<div style={{ flex: 1 }}>
															<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--bf-ink)' }}>
																{item.qty}× {item.name}
															</span>
														</div>
													</div>
													{groups.length > 0 && (
														<div style={{ marginTop: 8, paddingLeft: 34, display: 'flex', flexDirection: 'column', gap: 6 }}>
															{groups.map(g => (
																<div key={g.label}>
																	<div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--bf-mute)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
																		{g.label} {g.type === 'single' ? '— choose one' : '— choose any'}
																	</div>
																	<div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
{g.choices.map(c => (
																		<span key={c.label} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(232,67,31,.08)', color: 'var(--bf-ember)' }}>
																			{c.label}{c.priceAdjustment ? <span style={{ marginLeft: 2, opacity: 0.7 }}>+Rs.{c.priceAdjustment}</span> : null}
																		</span>
																	))}
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											)
										})}
									</div>
								</div>
							)}

							{/* Quota progress */}
							{deal.maxOrders && deal.ordersCount !== undefined && deal.ordersCount !== null && (
								<div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bf-cream-2)', borderRadius: 12 }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
										<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--bf-ink-2)' }}>Availability</span>
										<span className='bf-mono' style={{ fontSize: 12, color: 'var(--bf-mute)' }}>
											{deal.maxOrders - deal.ordersCount} left of {deal.maxOrders}
										</span>
									</div>
									<div style={{ height: 6, background: 'var(--bf-line)', borderRadius: 999, overflow: 'hidden' }}>
										<div style={{
											height: '100%',
											width: `${Math.min(100, Math.round((deal.ordersCount / deal.maxOrders) * 100))}%`,
											background: (deal.ordersCount / deal.maxOrders) > 0.8 ? 'var(--bf-ember)' : 'var(--bf-leaf)',
										}} />
									</div>
								</div>
							)}

							{/* Divider */}
							<div style={{ height: 1, background: 'var(--bf-line)', marginBottom: 20 }} />

							{/* Price block */}
							<div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
								<span style={{ fontWeight: 900, fontSize: 40, letterSpacing: '-0.03em', color: 'var(--bf-ember)', lineHeight: 1 }}>
									{rs(deal.discountPrice ?? 0)}
								</span>
								{deal.originalPrice && (
									<span className='bf-mono' style={{ fontSize: 16, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
										{rs(deal.originalPrice)}
									</span>
								)}
							</div>

							{/* Qty + Add to cart */}
							{inCart ? (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, background: 'rgba(47,143,78,.08)', border: '1px solid rgba(47,143,78,.2)' }}>
										<div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bf-leaf)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
											<CheckIcon />
										</div>
										<div>
											<div style={{ fontWeight: 700, fontSize: 14, color: 'var(--bf-leaf)' }}>Already in your cart</div>
											<div style={{ fontSize: 12, color: 'var(--bf-ink-2)', marginTop: 1 }}>× {cartQty} — view in cart to adjust</div>
										</div>
									</div>
									<Link href='/checkout' className='bf-btn bf-btn-primary bf-btn-lg' style={{ width: '100%', justifyContent: 'space-between' }}>
										<span>Go to checkout</span>
										<span>{Icons.arrow}</span>
									</Link>
								</div>
							) : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
										<div>
											<div className='bf-eyebrow' style={{ marginBottom: 8 }}>QUANTITY</div>
											<QtyControl value={qty} onChange={setQty} />
										</div>
										{qty > 1 && (
											<div style={{ paddingTop: 24 }}>
												<div className='bf-mono' style={{ fontSize: 12, color: 'var(--bf-mute)' }}>Total</div>
												<div style={{ fontWeight: 800, fontSize: 18, color: 'var(--bf-ember)' }}>{rs((deal.discountPrice ?? 0) * qty)}</div>
											</div>
										)}
									</div>
									<button
										className={`bf-btn bf-btn-lg${isAdded ? ' bf-btn-success' : ' bf-btn-primary'} bf-added-btn`}
										style={{ width: '100%', justifyContent: 'space-between', transition: 'background 0.2s, box-shadow 0.2s' }}
										onClick={handleAdd}
									>
										{isAdded ? (
											<><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckIcon /> Added to cart!</span><span /></>
										) : (
											<>
												<span>
													{needsOptions ? 'Customize & add' : `Add to cart${qty > 1 ? ` · ${qty}×` : ''}`}
													{!needsOptions && ` · ${rs((deal.discountPrice ?? 0) * qty)}`}
												</span>
												<span>{Icons.arrow}</span>
											</>
										)}
									</button>
								</div>
							)}

							{/* Savings callout */}
							{savings && !inCart && (
								<div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bf-leaf)', fontSize: 12.5, fontWeight: 600 }}>
									<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
										<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
									</svg>
									You save {rs(savings * qty)} with this deal
								</div>
							)}

							{/* Terms */}
							{deal.termsText && (
								<div style={{ marginTop: 20 }}>
									<button
										style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, font: '600 12px var(--bf-font)', color: 'var(--bf-ink-2)' }}
										onClick={() => setShowTerms(!showTerms)}
									>
										<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
											<circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/>
										</svg>
										Terms &amp; conditions
										<svg width={11} height={11} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} style={{ transform: showTerms ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
											<polyline points='6 9 12 15 18 9'/>
										</svg>
									</button>
									{showTerms && (
										<div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 10, background: 'var(--bf-cream-2)', fontSize: 12, color: 'var(--bf-ink-2)', lineHeight: 1.6 }}>
											{deal.termsText}
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* ── Other deals ── */}
					{otherDeals.length > 0 && (
						<section style={{ marginTop: 56 }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
								<h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.022em', margin: 0 }}>More deals</h2>
								<Link href='/deals' style={{ font: '600 13px var(--bf-font)', color: 'var(--bf-ink-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
									See all {Icons.chev}
								</Link>
							</div>
							<div className='bf-deal-detail-related'>
								{otherDeals.map((d, i) => (
									<DealCard key={d.id} d={d} tone={TONES[i % TONES.length]} />
								))}
							</div>
						</section>
					)}
				</div>
			</main>

			{/* ── Mobile sticky bar ── */}
			{!inCart && (
				<div className='bf-pd-mobile-bar'>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
						<div>
							{deal.originalPrice && (
								<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
									{rs(deal.originalPrice)}
								</div>
							)}
							<div style={{ fontWeight: 900, fontSize: 22, color: 'var(--bf-ember)', letterSpacing: '-0.02em' }}>
								{rs(deal.discountPrice ?? 0)}
							</div>
						</div>
					</div>
					<button
						className={`bf-btn bf-btn-lg${isAdded ? ' bf-btn-success' : ' bf-btn-primary'} bf-added-btn`}
						style={{ flex: 1, justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
						onClick={handleAdd}
					>
						{isAdded ? <><CheckIcon /> Added!</> : needsOptions ? <>Customize {Icons.arrow}</> : <>Add to cart {Icons.arrow}</>}
					</button>
				</div>
			)}

			{/* ── Options Picker Modal ── */}
			{showOptionsPicker && (
				<OptionsPickerModal
					optionItems={optionItems}
					selectedOptions={selectedOptions}
					onSelect={handleOptionSelect}
					onConfirm={addToCart}
					onClose={() => setShowOptionsPicker(false)}
					dealPrice={deal.discountPrice ?? 0}
					qty={qty}
				/>
			)}
		</CustomerShell>
	)
}

export { DealDetailPage }
