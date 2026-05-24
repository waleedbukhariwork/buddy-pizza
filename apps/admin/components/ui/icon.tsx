'use client'
import React from 'react'

// ─── Icons ───────────────────────────────────────────────────────────────────
export function Icon({
	size = 18,
	sw = 1.8,
	children,
}: {
	size?: number
	sw?: number
	children: React.ReactNode
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={sw}
			strokeLinecap='round'
			strokeLinejoin='round'
			style={{ flexShrink: 0 }}
		>
			{children}
		</svg>
	)
}

export const Icons = {
	grid: (
		<Icon>
			<rect x='4' y='4' width='7' height='7' rx='1.5' />
			<rect x='13' y='4' width='7' height='7' rx='1.5' />
			<rect x='4' y='13' width='7' height='7' rx='1.5' />
			<rect x='13' y='13' width='7' height='7' rx='1.5' />
		</Icon>
	),
	receipt: (
		<Icon>
			<path d='M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3z' />
			<path d='M9 8h6M9 12h6M9 16h4' />
		</Icon>
	),
	pkg: (
		<Icon>
			<path d='M3 7l9-4 9 4-9 4-9-4z' />
			<path d='M3 7v10l9 4 9-4V7' />
			<path d='M12 11v10' />
		</Icon>
	),
	pct: (
		<Icon>
			<circle cx='7' cy='7' r='2' />
			<circle cx='17' cy='17' r='2' />
			<path d='M6 18 18 6' />
		</Icon>
	),
	bike: (
		<Icon>
			<circle cx='5.5' cy='17.5' r='3' />
			<circle cx='18.5' cy='17.5' r='3' />
			<path d='M5.5 17.5 9 9h5l3 6.5M14 9h3M9 9l2 5h6.5' />
		</Icon>
	),
	user: (
		<Icon>
			<circle cx='12' cy='8' r='3.5' />
			<path d='M4.5 20a7.5 7.5 0 0 1 15 0' />
		</Icon>
	),
	trend: (
		<Icon>
			<path d='M3 17l6-6 4 4 8-9M14 6h7v7' />
		</Icon>
	),
	plus: (
		<Icon>
			<path d='M12 5v14M5 12h14' />
		</Icon>
	),
	bell: (
		<Icon>
			<path d='M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16zM10 20a2 2 0 0 0 4 0' />
		</Icon>
	),
	search: (
		<Icon>
			<path d='M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16.5 16.5 21 21' />
		</Icon>
	),
	settings: (
		<Icon>
			<circle cx='12' cy='12' r='3' />
			<circle cx='12' cy='12' r='8.5' />
		</Icon>
	),
	filter: (
		<Icon>
			<path d='M3 5h18l-7 9v6l-4-2v-4L3 5z' />
		</Icon>
	),
	chevDown: (
		<Icon>
			<path d='M6 9l6 6 6-6' />
		</Icon>
	),
	edit: (
		<Icon>
			<path d='M4 20h4l10-10-4-4L4 16v4zM14 6l4 4' />
		</Icon>
	),
	trash: (
		<Icon>
			<path d='M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13' />
		</Icon>
	),
	arrow: (
		<Icon>
			<path d='M5 12h14M13 6l6 6-6 6' />
		</Icon>
	),
	pin: (
		<Icon>
			<path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z' />
			<circle cx='12' cy='9' r='2.6' />
		</Icon>
	),
	check: (
		<Icon sw={2.2}>
			<path d='M4 12l5 5L20 6' />
		</Icon>
	),
	minus: (
		<Icon>
			<path d='M5 12h14' />
		</Icon>
	),
	x: (
		<Icon>
			<path d='M6 6l12 12M18 6L6 18' />
		</Icon>
	),
	logout: (
		<Icon>
			<path d='M9 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5' />
			<path d='M16 17l5-5-5-5' />
			<path d='M21 12H9' />
		</Icon>
	),
	phone: (
		<Icon>
			<path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.8 19.8 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' />
		</Icon>
	),
	clock: (
		<Icon>
			<circle cx='12' cy='12' r='9' />
			<path d='M12 7v5l3 3' />
		</Icon>
	),
	tag: (
		<Icon>
			<path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
			<circle cx='7' cy='7' r='1.2' />
		</Icon>
	),
	info: (
		<Icon>
			<circle cx='12' cy='12' r='9' />
			<path d='M12 8v4M12 16h.01' strokeWidth={2.2} />
		</Icon>
	),
	chevRight: (
		<Icon>
			<path d='M9 6l6 6-6 6' />
		</Icon>
	),
	copy: (
		<Icon>
			<rect x='9' y='9' width='11' height='11' rx='2' />
			<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
		</Icon>
	),
}
