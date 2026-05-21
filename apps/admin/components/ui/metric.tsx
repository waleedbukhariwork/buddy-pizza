'use client'
import React from 'react'
import { Sparkline } from './sparkline'

// ─── Metric card ─────────────────────────────────────────────────────────────
export function Metric({
	label,
	value,
	delta,
	deltaPositive,
	accent,
	children,
}: {
	label: string
	value: string
	delta?: string
	deltaPositive?: boolean
	accent?: 'ember'
	children?: React.ReactNode
}) {
	const dark = accent === 'ember'
	return (
		<div
			className='bf-card'
			style={{
				padding: 18,
				background: dark ? 'var(--bf-ink)' : 'var(--bf-paper)',
				color: dark ? '#fff' : 'inherit',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}
			>
				<div
					className='bf-mono'
					style={{
						fontSize: 10.5,
						color: dark ? 'rgba(255,255,255,.6)' : 'var(--bf-mute)',
						letterSpacing: '.08em',
						textTransform: 'uppercase',
					}}
				>
					{label}
				</div>
				{dark && <span className='bf-pill bf-pill-amber'>LIVE</span>}
			</div>
			<div
				style={{
					fontWeight: 900,
					fontSize: 32,
					letterSpacing: '-0.035em',
					marginTop: 6,
					color: dark ? 'var(--bf-amber)' : 'inherit',
				}}
				className='bf-tabular'
			>
				{value}
			</div>
			{delta && (
				<div
					style={{
						fontSize: 11.5,
						color: deltaPositive
							? 'var(--bf-leaf)'
							: dark
								? 'rgba(255,255,255,.6)'
								: 'var(--bf-mute)',
						marginTop: 4,
						fontWeight: 600,
					}}
				>
					{delta}
				</div>
			)}
			{children && <div style={{ marginTop: 10 }}>{children}</div>}
		</div>
	)
}

export { Sparkline }
