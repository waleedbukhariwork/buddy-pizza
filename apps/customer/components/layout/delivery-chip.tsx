'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Icons } from '../ui/icon'
import { DELIVERY_AREAS, useDeliveryStore } from '../../lib/delivery-store'

function DeliveryChip({ compact }: { compact?: boolean }) {
	const { area, etaMinutes, hydrate, setArea } = useDeliveryStore()
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => { hydrate() }, [hydrate])

	useEffect(() => {
		if (!open) return
		function onDown(e: PointerEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('pointerdown', onDown)
		return () => document.removeEventListener('pointerdown', onDown)
	}, [open])

	return (
		<div ref={ref} style={{ position: 'relative' }}>
			{!compact && (
				<span className='bf-delivery-eta bf-mono'>
					{Icons.clock}
					{etaMinutes} min
				</span>
			)}
			<button
				type='button'
				className='bf-delivery-area-btn'
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
			>
				{Icons.pin}
				<span>{area}</span>
				{Icons.chevDown}
			</button>
			{open && (
				<div className='bf-delivery-dropdown'>
					<div className='bf-delivery-dropdown-title'>Deliver to</div>
					{DELIVERY_AREAS.map((a) => (
						<button
							key={a}
							type='button'
							className={`bf-delivery-option${a === area ? ' active' : ''}`}
							onClick={() => { setArea(a); setOpen(false) }}
						>
							{a}
							{a === area && Icons.check}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

export { DeliveryChip }
