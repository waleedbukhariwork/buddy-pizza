'use client'
import React from 'react'

// ─── Hot badge ───────────────────────────────────────────────────────────────
function HotBadge() {
	return (
		<span className='bf-pill bf-pill-ember' style={{ padding: '3px 7px', fontSize: 9.5 }}>
			<svg width='9' height='11' viewBox='0 0 9 11' fill='currentColor'><path d='M4.5 0c.5 1.5 2 2 2 4a2 2 0 1 1-4 0c0-1 .5-1.5.5-2.5C3.7 2.2 4 2.9 4.5 0z' /></svg>
			HOT
		</span>
	)
}

export { HotBadge }
