'use client'
import React from 'react'
import { Icons } from '../ui/icon'

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
			<div style={{ minWidth: 0 }}>
				<div className='bf-eyebrow bf-admin-topbar-sub' style={{ marginBottom: 3 }}>{sub}</div>
				<h1 className='bf-admin-topbar-title'>{title}</h1>
			</div>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
				<div className='bf-admin-topbar-search' style={{ position: 'relative' }}>
					<input
						className='bf-input'
						placeholder='Search…'
						style={{ paddingLeft: 36, height: 38 }}
					/>
					<span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--bf-mute)', pointerEvents: 'none' }}>
						{Icons.search}
					</span>
				</div>
				<button
					className='bf-btn bf-btn-outline bf-btn-icon bf-admin-topbar-bell'
					style={{ position: 'relative', flexShrink: 0 }}
				>
					{Icons.bell}
					<span style={{
						position: 'absolute', top: 7, right: 8,
						width: 7, height: 7, borderRadius: '50%',
						background: 'var(--bf-ember)',
						border: '1.5px solid var(--bf-paper)',
					}} />
				</button>
				{cta && (
					<button
						className='bf-btn bf-btn-primary bf-btn-md bf-admin-topbar-cta'
						onClick={onCta}
						style={{ flexShrink: 0 }}
					>
						{Icons.plus}
						<span className='bf-admin-topbar-cta-label'>{cta}</span>
					</button>
				)}
			</div>
		</div>
	)
}
