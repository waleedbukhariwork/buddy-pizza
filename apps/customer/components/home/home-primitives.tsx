'use client'
import React from 'react'
import Link from 'next/link'
import { FoodImg, type Tone } from '../ui/food-img'
import { Icons } from '../ui/icon'
import { rs, type Deal } from '../../lib/hooks'

// ─── Deal card ───────────────────────────────────────────────────────────────
function DealCard({ d, tone = 'ember' }: { d: Deal; tone?: Tone }) {
	return (
		<div className='bf-card bf-lift' style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
			<FoodImg
				tone={tone}
				caption={'deal · ' + d.title.toLowerCase()}
				style={{ height: 140, borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}
			/>
			<div style={{ padding: 16 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
					{d.tag && <span className='bf-pill bf-pill-ink'>{d.tag}</span>}
					{d.badge && <span className='bf-pill bf-pill-ember'>{d.badge}</span>}
				</div>
				<div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>{d.title}</div>
				{d.description && (
					<div style={{ color: 'var(--bf-ink-2)', fontSize: 12.5, marginTop: 4, lineHeight: 1.35 }}>
						{d.description}
					</div>
				)}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
					<div>
						{d.originalPrice && (
							<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', textDecoration: 'line-through' }}>
								{rs(d.originalPrice)}
							</div>
						)}
						<div style={{ fontWeight: 800, fontSize: 22, color: 'var(--bf-ember)' }}>
							{rs(d.discountPrice ?? 0)}
						</div>
					</div>
					<button className='bf-btn bf-btn-ink bf-btn-sm'>Order {Icons.arrow}</button>
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
