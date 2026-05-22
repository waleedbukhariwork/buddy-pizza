'use client'
import React from 'react'
import { Icons } from '../ui/icon'

// ─── Admin topbar ─────────────────────────────────────────────────────────────
export function AdminTopbar({
	title,
	sub,
	cta,
	onCta,
}: {
	title: string
	sub: string
	cta?: string
	onCta?: () => void
}) {
	return (
		<div className='bf-admin-topbar'>
			<div>
				<div className='bf-eyebrow bf-admin-topbar-sub'>{sub}</div>
				<h1 className='bf-admin-topbar-title'>{title}</h1>
			</div>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<div className='bf-admin-topbar-search'>
					<input
						className='bf-input'
						placeholder='Search…'
						style={{ paddingLeft: 36, height: 38 }}
					/>
					<span
						style={{
							position: 'absolute',
							left: 12,
							top: 9,
							color: 'var(--bf-mute)',
						}}
					>
						{Icons.search}
					</span>
				</div>
				<button
					className='bf-btn bf-btn-outline bf-btn-icon bf-admin-topbar-bell'
					style={{ position: 'relative' }}
				>
					{Icons.bell}
					<span
						style={{
							position: 'absolute',
							top: 5,
							right: 6,
							width: 8,
							height: 8,
							borderRadius: '50%',
							background: 'var(--bf-ember)',
							border: '1.5px solid var(--bf-paper)',
						}}
					/>
				</button>
				{cta && (
					<button
						className='bf-btn bf-btn-primary bf-btn-md bf-admin-topbar-cta'
						onClick={onCta}
					>
						{Icons.plus}
						<span className='bf-admin-topbar-cta-label'>{cta}</span>
					</button>
				)}
			</div>
		</div>
	)
}
