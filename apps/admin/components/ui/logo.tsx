'use client'
import React from 'react'
import Link from 'next/link'

// ─── Logo ────────────────────────────────────────────────────────────────────
export function Logo({
	tag = 'ADMIN',
	mono = false,
}: {
	tag?: string
	mono?: boolean
}) {
	return (
		<Link
			href='/'
			className='bf-logo'
			style={{ fontSize: 18, color: mono ? '#fff' : undefined }}
		>
			<span
				className='bf-logo-dot'
				style={mono ? { background: '#fff' } : undefined}
			/>
			Buddy Feast
			<small
				style={{
					fontSize: '0.5em',
					fontFamily: 'var(--bf-mono)',
					fontWeight: 600,
					letterSpacing: '0.18em',
					textTransform: 'uppercase',
					color: mono ? 'rgba(255,255,255,.6)' : 'var(--bf-mute)',
					marginLeft: 4,
				}}
			>
				{tag}
			</small>
		</Link>
	)
}
