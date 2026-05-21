'use client'
import React from 'react'

// ─── Status config ───────────────────────────────────────────────────────────
export const STATUS_MAP = {
	NEW: {
		label: 'New',
		dot: 'bf-dot-new',
		pill: { background: '#DBEAFE', color: '#1E40AF' },
	},
	PREPARING: {
		label: 'Preparing',
		dot: 'bf-dot-prep',
		pill: { background: '#FFF1D6', color: '#92580E' },
	},
	READY: {
		label: 'Ready',
		dot: 'bf-dot-ready',
		pill: { background: '#DCFCE7', color: '#166534' },
	},
	WITH_RIDER: {
		label: 'With rider',
		dot: 'bf-dot-rider',
		pill: { background: '#EDE9FE', color: '#5B21B6' },
	},
	DELIVERED: {
		label: 'Delivered',
		dot: 'bf-dot-done',
		pill: { background: '#F1ECE3', color: '#4A4244' },
	},
	CANCELLED: {
		label: 'Cancelled',
		dot: 'bf-dot-done',
		pill: { background: '#FEE2E2', color: '#991B1B' },
	},
} as const

export function StatusPill({ status }: { status: keyof typeof STATUS_MAP }) {
	const cfg = STATUS_MAP[status] || STATUS_MAP.NEW
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				padding: '4px 9px',
				borderRadius: 999,
				font: '700 11px var(--bf-font)',
				...cfg.pill,
			}}
		>
			<span className={`bf-dot ${cfg.dot}`} />
			{cfg.label}
		</span>
	)
}
