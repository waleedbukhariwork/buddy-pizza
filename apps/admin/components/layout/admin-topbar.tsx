'use client'
import React from 'react'
import { Icons } from '../ui/icon'

// ─── Admin topbar ─────────────────────────────────────────────────────────────
export function AdminTopbar({
	title,
	sub,
	cta,
}: {
	title: string
	sub: string
	cta?: string
}) {
	return (
		<div
			style={{
				padding: '20px 32px',
				borderBottom: '1px solid var(--bf-line)',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				background: 'var(--bf-cream)',
				position: 'sticky',
				top: 0,
				zIndex: 4,
			}}
		>
			<div>
				<div className='bf-eyebrow'>{sub}</div>
				<h1
					style={{
						fontWeight: 800,
						fontSize: 28,
						margin: '4px 0 0',
						letterSpacing: '-0.028em',
					}}
				>
					{title}
				</h1>
			</div>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<div style={{ position: 'relative' }}>
					<input
						className='bf-input'
						placeholder='Search…'
						style={{ width: 220, paddingLeft: 36, height: 38 }}
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
					className='bf-btn bf-btn-outline bf-btn-icon'
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
				<button className='bf-btn bf-btn-primary bf-btn-md'>
					{Icons.plus} {cta || 'New item'}
				</button>
			</div>
		</div>
	)
}
