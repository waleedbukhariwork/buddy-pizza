'use client'
import React from 'react'
import { Icons } from './icon'

// ─── Qty Stepper ─────────────────────────────────────────────────────────────
function QtyStepper({ value, onChange, sm }: { value: number; onChange: (v: number) => void; sm?: boolean }) {
	const s = sm ? { btn: 24, font: 13 } : { btn: 30, font: 14 }
	return (
		<div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bf-paper)', borderRadius: 999, boxShadow: 'inset 0 0 0 1.5px var(--bf-line-2)' }}>
			<button onClick={() => onChange(Math.max(1, value - 1))} className='bf-stepper-btn' style={{ width: s.btn, height: s.btn, border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--bf-ink)', display: 'grid', placeItems: 'center' }}>{Icons.minus}</button>
			<span style={{ minWidth: 22, textAlign: 'center', font: `700 ${s.font}px var(--bf-font)` }} className='bf-tabular'>{value}</span>
			<button onClick={() => onChange(value + 1)} className='bf-stepper-btn' style={{ width: s.btn, height: s.btn, border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--bf-ink)', display: 'grid', placeItems: 'center' }}>{Icons.plus}</button>
		</div>
	)
}

export { QtyStepper }
