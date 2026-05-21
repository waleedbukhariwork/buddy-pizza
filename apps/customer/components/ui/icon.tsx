'use client'
import React from 'react'

// ─── Icons ──────────────────────────────────────────────────────────────────
function Icon({ size = 20, sw = 1.8, children }: { size?: number; sw?: number; children: React.ReactNode }) {
	return (
		<svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={sw} strokeLinecap='round' strokeLinejoin='round' style={{ flexShrink: 0 }}>
			{children}
		</svg>
	)
}

const Icons = {
	cart: <Icon><circle cx='9' cy='20' r='1.4' /><circle cx='17' cy='20' r='1.4' /><path d='M3 4h2l2.4 11a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.8 8H6' /></Icon>,
	plus: <Icon><path d='M12 5v14M5 12h14' /></Icon>,
	minus: <Icon><path d='M5 12h14' /></Icon>,
	user: <Icon><circle cx='12' cy='8' r='3.5' /><path d='M4.5 20a7.5 7.5 0 0 1 15 0' /></Icon>,
	pin: <Icon><path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z' /><circle cx='12' cy='9' r='2.6' /></Icon>,
	clock: <Icon><circle cx='12' cy='12' r='9' /><path d='M12 7v5l3 2' /></Icon>,
	check: <Icon sw={2.2}><path d='M4 12l5 5L20 6' /></Icon>,
	arrow: <Icon><path d='M5 12h14M13 6l6 6-6 6' /></Icon>,
	chev: <Icon><path d='M9 6l6 6-6 6' /></Icon>,
	chevDown: <Icon><path d='M6 9l6 6 6-6' /></Icon>,
	x: <Icon><path d='M6 6l12 12M18 6L6 18' /></Icon>,
	search: <Icon><path d='M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16.5 16.5 21 21' /></Icon>,
	truck: <Icon><path d='M3 7h11v9H3zM14 11h4l3 3v2h-7z' /><circle cx='7' cy='18' r='1.6' /><circle cx='17.5' cy='18' r='1.6' /></Icon>,
	home: <Icon><path d='M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9z' /></Icon>,
	receipt: <Icon><path d='M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3z' /><path d='M9 8h6M9 12h6M9 16h4' /></Icon>,
	cash: <Icon><rect x='3' y='6' width='18' height='12' rx='2' /><circle cx='12' cy='12' r='2.5' /></Icon>,
	card: <Icon><rect x='3' y='6' width='18' height='13' rx='2' /><path d='M3 10h18M7 15h3' /></Icon>,
	phone: <Icon><path d='M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' /></Icon>,
	bike: <Icon><circle cx='5.5' cy='17.5' r='3' /><circle cx='18.5' cy='17.5' r='3' /><path d='M5.5 17.5 9 9h5l3 6.5M14 9h3M9 9l2 5h6.5' /></Icon>,
	grid: <Icon><rect x='4' y='4' width='7' height='7' rx='1.5' /><rect x='13' y='4' width='7' height='7' rx='1.5' /><rect x='4' y='13' width='7' height='7' rx='1.5' /><rect x='13' y='13' width='7' height='7' rx='1.5' /></Icon>,
	list: <Icon><path d='M8 6h12M8 12h12M8 18h12' /><circle cx='4' cy='6' r='1' fill='currentColor' /><circle cx='4' cy='12' r='1' fill='currentColor' /><circle cx='4' cy='18' r='1' fill='currentColor' /></Icon>,
}

export { Icon, Icons }
