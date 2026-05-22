'use client'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FoodImg, type Tone } from '../ui/food-img'
import { Icons } from '../ui/icon'
import { rs, type Deal } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'

function CheckIcon() {
	return (
		<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={3.5} strokeLinecap='round' strokeLinejoin='round'>
			<polyline points='20 6 9 17 4 12' className='bf-check-stroke' />
		</svg>
	)
}

// ─── Deal card ────────────────────────────────────────────────────────────────
function DealCard({ d, tone = 'ember' }: { d: Deal; tone?: Tone }) {
	const router = useRouter()
	const addItem = useCartStore((s) => s.addItem)
	const inCart = useCartStore((s) => s.items.some((i) => i.dealId === d.id))
	const token = useAuthStore((s) => s.token)

	const itemLines = d.items?.split('\n').filter(Boolean) ?? []

	function handleAdd(e: React.MouseEvent) {
		e.stopPropagation()
		if (!token) {
			router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
			return
		}
		addItem({
			productId: 0,
			dealId: d.id,
			productName: d.title,
			price: d.discountPrice ?? 0,
			quantity: 1,
			customizations: d.items ?? '',
		})
	}

	return (
		<div
			className='bf-card bf-lift'
			style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
			onClick={() => router.push(`/deals/${d.id}`)}
		>
			{/* Image — fixed height, edge-to-edge */}
			<FoodImg
				tone={tone}
				caption={'deal · ' + d.title.toLowerCase()}
				style={{ height: 130, borderRadius: 0, flexShrink: 0 }}
			/>

			{/* Body — grows to fill card height so button always sticks to bottom */}
			<div style={{ flex: 1, padding: '14px 16px 16px', display: 'flex', flexDirection: 'column' }}>
				{/* Badges row */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
					<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
						{d.tag && <span className='bf-pill bf-pill-ink'>{d.tag}</span>}
						{d.originalPrice && d.discountPrice && d.originalPrice > d.discountPrice && (
							<span className='bf-pill bf-pill-leaf' style={{ fontSize: 10 }}>
								Save {rs(d.originalPrice - d.discountPrice)}
							</span>
						)}
					</div>
					{d.badge && <span className='bf-pill bf-pill-ember'>{d.badge}</span>}
				</div>

				{/* Title + description */}
				<div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{d.title}</div>
				{d.description && (
					<div style={{ color: 'var(--bf-ink-2)', fontSize: 12, marginTop: 4, lineHeight: 1.35,
						display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
						{d.description}
					</div>
				)}

				{/* Included items */}
				{itemLines.length > 0 && (
					<ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
						{itemLines.map((line, i) => (
							<li key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
								<span style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--bf-ember)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 8, fontWeight: 800 }}>✓</span>
								<span style={{ color: 'var(--bf-ink)' }}>{line}</span>
							</li>
						))}
					</ul>
				)}

				{/* Spacer — pushes price+CTA to bottom */}
				<div style={{ flex: 1 }} />

				{/* Price + CTA — always at bottom */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
					<div>
						{d.originalPrice && (
							<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
								{rs(d.originalPrice)}
							</div>
						)}
						<div style={{ fontWeight: 800, fontSize: 20, color: 'var(--bf-ember)', letterSpacing: '-0.01em' }}>
							{rs(d.discountPrice ?? 0)}
						</div>
					</div>
					{inCart ? (
						<button
							className='bf-btn bf-btn-success bf-added-btn'
							disabled
							onClick={(e) => e.stopPropagation()}
							style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}
						>
							<CheckIcon />
						</button>
					) : (
						<button
							className='bf-btn bf-btn-primary'
							onClick={handleAdd}
							style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}
						>
							{Icons.plus}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

// ─── Section row header ───────────────────────────────────────────────────────
function SectionRow({ title, link, eyebrow }: { title: string; link?: string; eyebrow?: string }) {
	return (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
			<div>
				{eyebrow && (
					<div className='bf-eyebrow' style={{ color: 'var(--bf-ember)', marginBottom: 4 }}>{eyebrow}</div>
				)}
				<h2 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.022em', lineHeight: 1.08, margin: 0 }}>
					{title}
				</h2>
			</div>
			{link && (
				<Link href={link} style={{ font: '600 13px var(--bf-font)', color: 'var(--bf-ink-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
					See all {Icons.chev}
				</Link>
			)}
		</div>
	)
}

// ─── Trust stat ───────────────────────────────────────────────────────────────
function TrustStat({ k, v }: { k: string; v: string }) {
	return (
		<div>
			<div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>{k}</div>
			<div className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{v}</div>
		</div>
	)
}

export { DealCard, SectionRow, TrustStat }
