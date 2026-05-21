'use client'
import React from 'react'

// ─── Food image placeholder ──────────────────────────────────────────────────
type Tone = 'cream' | 'ember' | 'amber' | 'ink'

function FoodImg({ caption, tone = 'cream', style, className = '' }: { caption?: string; tone?: Tone; style?: React.CSSProperties; className?: string }) {
	const cls = { cream: '', ember: 'bf-img-ember', amber: 'bf-img-amber', ink: 'bf-img-ink' }[tone] || ''
	return (
		<div className={`bf-img ${cls} ${className}`} style={style}>
			{caption && <span className='bf-img-cap'>{caption}</span>}
		</div>
	)
}

export type { Tone }
export { FoodImg }
