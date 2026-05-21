'use client'
import React from 'react'

// ─── Food img placeholder ────────────────────────────────────────────────────
export type Tone = 'cream' | 'ember' | 'amber' | 'ink'

export function FoodImg({
	tone = 'cream',
	style,
}: {
	tone?: Tone
	style?: React.CSSProperties
}) {
	const cls = {
		cream: '',
		ember: 'bf-img-ember',
		amber: 'bf-img-amber',
		ink: 'bf-img-ink',
	}[tone]
	return <div className={`bf-img ${cls}`} style={style} />
}
