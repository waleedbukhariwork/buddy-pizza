'use client'
import React, { useEffect } from 'react'

let injected = false
function injectKeyframes() {
	if (injected || typeof document === 'undefined') return
	injected = true
	const style = document.createElement('style')
	style.textContent =
		'@keyframes bf-pulse{0%,100%{opacity:.45}50%{opacity:1}}'
	document.head.appendChild(style)
}

export function Skeleton({
	w,
	h = 16,
	r = 8,
	style,
}: {
	w?: number | string
	h?: number | string
	r?: number
	style?: React.CSSProperties
}) {
	useEffect(injectKeyframes, [])
	return (
		<div
			style={{
				width: w ?? '100%',
				height: h,
				borderRadius: r,
				background: 'var(--bf-line)',
				animation: 'bf-pulse 1.4s ease-in-out infinite',
				flexShrink: 0,
				...style,
			}}
		/>
	)
}

export function SkeletonCard({
	height = 80,
	style,
}: {
	height?: number
	style?: React.CSSProperties
}) {
	return (
		<div
			className='bf-card'
			style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, ...style }}
		>
			<Skeleton h={height} r={10} />
		</div>
	)
}
