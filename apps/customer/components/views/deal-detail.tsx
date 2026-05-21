'use client'
import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CustomerShell } from '../layout/customer-shell'
import { FoodImg, type Tone } from '../ui/food-img'
import { DealCard } from '../home/home-primitives'
import { Icons } from '../ui/icon'
import { rs, useDeals } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'

const TONES: Tone[] = ['ember', 'amber', 'ink']

// ─── Back chevron icon ────────────────────────────────────────────────────────
function BackIcon() {
	return (
		<svg
			width={16}
			height={16}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={2.2}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<path d='M19 12H5M12 5l-7 7 7 7' />
		</svg>
	)
}

// ─── Animated check icon ──────────────────────────────────────────────────────
function CheckIcon() {
	return (
		<svg
			width={16}
			height={16}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={3}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<polyline points='20 6 9 17 4 12' className='bf-check-stroke' />
		</svg>
	)
}

// ─── Qty stepper ──────────────────────────────────────────────────────────────
function QtyControl({
	value,
	onChange,
}: {
	value: number
	onChange: (v: number) => void
}) {
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 0,
				border: '1.5px solid var(--bf-line-2)',
				borderRadius: 999,
				overflow: 'hidden',
			}}
		>
			<button
				type='button'
				onClick={() => onChange(Math.max(1, value - 1))}
				style={{
					width: 40,
					height: 40,
					border: 0,
					background: 'transparent',
					cursor: 'pointer',
					display: 'grid',
					placeItems: 'center',
					color: 'var(--bf-ink)',
					transition: 'background .12s',
				}}
				onMouseEnter={(e) =>
					(e.currentTarget.style.background = 'var(--bf-cream-2)')
				}
				onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
			>
				{Icons.minus}
			</button>
			<span
				style={{
					minWidth: 36,
					textAlign: 'center',
					font: '800 16px var(--bf-font)',
					color: 'var(--bf-ink)',
				}}
			>
				{value}
			</span>
			<button
				type='button'
				onClick={() => onChange(value + 1)}
				style={{
					width: 40,
					height: 40,
					border: 0,
					background: 'transparent',
					cursor: 'pointer',
					display: 'grid',
					placeItems: 'center',
					color: 'var(--bf-ink)',
					transition: 'background .12s',
				}}
				onMouseEnter={(e) =>
					(e.currentTarget.style.background = 'var(--bf-cream-2)')
				}
				onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
			>
				{Icons.plus}
			</button>
		</div>
	)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({
	h,
	w,
	style,
}: {
	h: number
	w?: number | string
	style?: React.CSSProperties
}) {
	return (
		<div
			className='bf-skeleton'
			style={{ height: h, width: w, borderRadius: 12, ...style }}
		/>
	)
}

// ─── DEAL DETAIL PAGE ─────────────────────────────────────────────────────────
function DealDetailPage({ dealId }: { dealId: number }) {
	const router = useRouter()
	const { data: deals, isLoading } = useDeals()

	const addItem = useCartStore((s) => s.addItem)
	const cartItems = useCartStore((s) => s.items)

	const deal = deals?.find((d) => d.id === dealId)
	const itemLines = deal?.items?.split('\n').filter(Boolean) ?? []
	const savings =
		deal?.originalPrice &&
		deal?.discountPrice &&
		deal.originalPrice > deal.discountPrice
			? deal.originalPrice - deal.discountPrice
			: null
	const inCart = cartItems.some((i) => i.dealId === dealId)
	const cartQty = cartItems.find((i) => i.dealId === dealId)?.quantity ?? 0

	const [qty, setQty] = useState(1)
	const [addState, setAddState] = useState<'idle' | 'added'>('idle')

	const tone: Tone = TONES[dealId % TONES.length]

	// Other active deals (exclude current)
	const otherDeals = useMemo(
		() => deals?.filter((d) => d.isActive && d.id !== dealId).slice(0, 3) ?? [],
		[deals, dealId],
	)

	function handleAdd() {
		if (!deal) return
		addItem({
			productId: 0,
			dealId: deal.id,
			productName: deal.title,
			price: deal.discountPrice ?? 0,
			quantity: qty,
			customizations: deal.items ?? '',
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
						<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
							<Skel h={12} w={100} />
							<Skel h={52} w='80%' />
							<Skel h={34} w={120} />
							<Skel h={18} />
							<Skel h={80} />
							{[1, 2, 3].map((i) => (
								<Skel key={i} h={52} />
							))}
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
					<div
						style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}
					>
						Deal not found
					</div>
					<div style={{ color: 'var(--bf-ink-2)', fontSize: 14, marginTop: 8 }}>
						This deal may have ended or been removed.
					</div>
					<Link
						href='/deals'
						className='bf-btn bf-btn-outline bf-btn-md'
						style={{ marginTop: 20, display: 'inline-flex' }}
					>
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
					{/* ── Back nav ── */}
					<button
						onClick={() => router.back()}
						className='bf-btn bf-btn-ghost bf-btn-sm'
						style={{
							gap: 5,
							paddingLeft: 2,
							marginBottom: 20,
							color: 'var(--bf-ink-2)',
						}}
					>
						<BackIcon />
						All deals
					</button>

					{/* ── 2-col layout (reuses product-detail CSS) ── */}
					<div className='bf-pd-layout'>
						{/* LEFT — hero image */}
						<div className='bf-pd-image-col bf-fade-up'>
							<FoodImg
								tone={tone}
								caption={'deal · ' + deal.title.toLowerCase()}
								className='bf-pd-hero-img'
							/>

							{/* Savings highlight — only on desktop */}
							{savings && (
								<div
									className='bf-pd-trust-strip'
									style={{
										marginTop: 16,
										borderRadius: 14,
										padding: '14px 18px',
										background: 'rgba(47,143,78,.08)',
										border: '1px solid rgba(47,143,78,.22)',
										display: 'flex',
										alignItems: 'center',
										gap: 12,
									}}
								>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 10,
											background: 'var(--bf-leaf)',
											display: 'grid',
											placeItems: 'center',
											flexShrink: 0,
										}}
									>
										<svg
											width={18}
											height={18}
											viewBox='0 0 24 24'
											fill='none'
											stroke='#fff'
											strokeWidth={2.2}
											strokeLinecap='round'
											strokeLinejoin='round'
										>
											<path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
										</svg>
									</div>
									<div>
										<div
											style={{
												fontWeight: 800,
												fontSize: 15,
												color: 'var(--bf-leaf)',
											}}
										>
											Save {rs(savings)}
										</div>
										<div
											style={{
												fontSize: 12,
												color: 'var(--bf-ink-2)',
												marginTop: 2,
											}}
										>
											vs. ordering separately
										</div>
									</div>
								</div>
							)}
						</div>

						{/* RIGHT — deal info */}
						<div className='bf-pd-detail-col bf-fade-up-1'>
							{/* Tag + badges row */}
							<div
								style={{
									display: 'flex',
									gap: 8,
									alignItems: 'center',
									marginBottom: 12,
									flexWrap: 'wrap',
								}}
							>
								{deal.tag && (
									<span
										className='bf-eyebrow'
										style={{ color: 'var(--bf-mute)' }}
									>
										{deal.tag}
									</span>
								)}
								{savings && (
									<span
										className='bf-pill bf-pill-leaf'
										style={{ fontSize: 10 }}
									>
										Save {rs(savings)}
									</span>
								)}
								{deal.badge && (
									<span className='bf-pill bf-pill-ember'>{deal.badge}</span>
								)}
							</div>

							{/* Title */}
							<h1
								style={{
									fontWeight: 900,
									fontSize: 36,
									letterSpacing: '-0.03em',
									lineHeight: 1.04,
									marginBottom: 12,
								}}
							>
								{deal.title}
							</h1>

							{/* Description */}
							{deal.description && (
								<p
									style={{
										color: 'var(--bf-ink-2)',
										fontSize: 15,
										lineHeight: 1.55,
										marginBottom: 20,
									}}
								>
									{deal.description}
								</p>
							)}

							{/* Included items */}
							{itemLines.length > 0 && (
								<div style={{ marginBottom: 24 }}>
									<div
										className='bf-eyebrow'
										style={{ marginBottom: 12, color: 'var(--bf-ink-2)' }}
									>
										WHAT&apos;S INCLUDED
									</div>
									<div
										style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
									>
										{itemLines.map((line, i) => (
											<div
												key={i}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: 12,
													padding: '11px 14px',
													background: 'var(--bf-paper)',
													borderRadius: 12,
													border: '1px solid var(--bf-line)',
												}}
											>
												<div
													style={{
														width: 22,
														height: 22,
														borderRadius: '50%',
														background: 'var(--bf-ember)',
														color: '#fff',
														display: 'grid',
														placeItems: 'center',
														flexShrink: 0,
													}}
												>
													<CheckIcon />
												</div>
												<span
													style={{
														fontSize: 14,
														fontWeight: 600,
														color: 'var(--bf-ink)',
													}}
												>
													{line}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Divider */}
							<div
								style={{
									height: 1,
									background: 'var(--bf-line)',
									marginBottom: 20,
								}}
							/>

							{/* Price block */}
							<div
								style={{
									display: 'flex',
									alignItems: 'baseline',
									gap: 12,
									marginBottom: 22,
								}}
							>
								<span
									style={{
										fontWeight: 900,
										fontSize: 40,
										letterSpacing: '-0.03em',
										color: 'var(--bf-ember)',
										lineHeight: 1,
									}}
								>
									{rs(deal.discountPrice ?? 0)}
								</span>
								{deal.originalPrice && (
									<span
										className='bf-mono'
										style={{
											fontSize: 16,
											color: 'var(--bf-mute)',
											textDecoration: 'line-through',
										}}
									>
										{rs(deal.originalPrice)}
									</span>
								)}
							</div>

							{/* Qty + Add to cart */}
							{inCart ? (
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 12,
											padding: '14px 18px',
											borderRadius: 14,
											background: 'rgba(47,143,78,.08)',
											border: '1px solid rgba(47,143,78,.2)',
										}}
									>
										<div
											style={{
												width: 28,
												height: 28,
												borderRadius: '50%',
												background: 'var(--bf-leaf)',
												display: 'grid',
												placeItems: 'center',
												flexShrink: 0,
											}}
										>
											<CheckIcon />
										</div>
										<div>
											<div
												style={{
													fontWeight: 700,
													fontSize: 14,
													color: 'var(--bf-leaf)',
												}}
											>
												Already in your cart
											</div>
											<div
												style={{
													fontSize: 12,
													color: 'var(--bf-ink-2)',
													marginTop: 1,
												}}
											>
												× {cartQty} — view in cart to adjust
											</div>
										</div>
									</div>
									<Link
										href='/checkout'
										className='bf-btn bf-btn-primary bf-btn-lg'
										style={{ width: '100%', justifyContent: 'space-between' }}
									>
										<span>Go to checkout</span>
										<span>{Icons.arrow}</span>
									</Link>
								</div>
							) : (
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
								>
									<div
										style={{ display: 'flex', alignItems: 'center', gap: 14 }}
									>
										<div>
											<div className='bf-eyebrow' style={{ marginBottom: 8 }}>
												QUANTITY
											</div>
											<QtyControl value={qty} onChange={setQty} />
										</div>
										{qty > 1 && (
											<div style={{ paddingTop: 24 }}>
												<div
													className='bf-mono'
													style={{ fontSize: 12, color: 'var(--bf-mute)' }}
												>
													Total
												</div>
												<div
													style={{
														fontWeight: 800,
														fontSize: 18,
														color: 'var(--bf-ember)',
													}}
												>
													{rs((deal.discountPrice ?? 0) * qty)}
												</div>
											</div>
										)}
									</div>
									<button
										className={`bf-btn bf-btn-lg${isAdded ? ' bf-btn-success' : ' bf-btn-primary'} bf-added-btn`}
										style={{
											width: '100%',
											justifyContent: 'space-between',
											transition: 'background 0.2s, box-shadow 0.2s',
										}}
										onClick={handleAdd}
									>
										{isAdded ? (
											<>
												<span
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 8,
													}}
												>
													<CheckIcon /> Added to cart!
												</span>
												<span />
											</>
										) : (
											<>
												<span>
													Add to cart · {qty > 1 ? `${qty}×` : ''}{' '}
													{rs((deal.discountPrice ?? 0) * qty)}
												</span>
												<span>{Icons.arrow}</span>
											</>
										)}
									</button>
								</div>
							)}

							{/* Value callout */}
							{savings && !inCart && (
								<div
									style={{
										marginTop: 14,
										display: 'flex',
										alignItems: 'center',
										gap: 6,
										color: 'var(--bf-leaf)',
										fontSize: 12.5,
										fontWeight: 600,
									}}
								>
									<svg
										width={14}
										height={14}
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth={2.2}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
									</svg>
									You save {rs(savings * qty)} with this deal
								</div>
							)}
						</div>
					</div>

					{/* ── Other deals ── */}
					{otherDeals.length > 0 && (
						<section style={{ marginTop: 56 }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: 20,
								}}
							>
								<h2
									style={{
										fontWeight: 800,
										fontSize: 24,
										letterSpacing: '-0.022em',
										margin: 0,
									}}
								>
									More deals
								</h2>
								<Link
									href='/deals'
									style={{
										font: '600 13px var(--bf-font)',
										color: 'var(--bf-ink-2)',
										display: 'flex',
										alignItems: 'center',
										gap: 4,
									}}
								>
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
					<div
						style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
					>
						<div>
							{deal.originalPrice && (
								<div
									className='bf-mono'
									style={{
										fontSize: 11,
										color: 'var(--bf-mute)',
										textDecoration: 'line-through',
									}}
								>
									{rs(deal.originalPrice)}
								</div>
							)}
							<div
								style={{
									fontWeight: 900,
									fontSize: 22,
									color: 'var(--bf-ember)',
									letterSpacing: '-0.02em',
								}}
							>
								{rs(deal.discountPrice ?? 0)}
							</div>
						</div>
					</div>
					<button
						className={`bf-btn bf-btn-lg${isAdded ? ' bf-btn-success' : ' bf-btn-primary'} bf-added-btn`}
						style={{
							flex: 1,
							justifyContent: 'center',
							gap: 8,
							transition: 'background 0.2s',
						}}
						onClick={handleAdd}
					>
						{isAdded ? (
							<>
								<CheckIcon /> Added!
							</>
						) : (
							<>Add to cart {Icons.arrow}</>
						)}
					</button>
				</div>
			)}
		</CustomerShell>
	)
}

export { DealDetailPage }
