'use client'
import React from 'react'

// ─── Sparkline ───────────────────────────────────────────────────────────────
export function Sparkline({
	data,
	w = 120,
	h = 36,
	color = 'var(--bf-ember)',
}: {
	data: number[]
	w?: number
	h?: number
	color?: string
}) {
	const max = Math.max(...data),
		min = Math.min(...data)
	const pts = data
		.map((v, i) => {
			const x = (i / (data.length - 1)) * w
			const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2
			return `${x},${y}`
		})
		.join(' ')
	const area = `0,${h} ${pts} ${w},${h}`
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
			<polygon points={area} fill={color} opacity='.12' />
			<polyline
				points={pts}
				fill='none'
				stroke={color}
				strokeWidth='2'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	)
}
