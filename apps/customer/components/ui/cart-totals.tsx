'use client'
import React from 'react'
import { rs } from '../../lib/hooks'

// ─── Cart totals ─────────────────────────────────────────────────────────────
function CartTotals({ subtotal, delivery = 0, discount = 0 }: { subtotal: number; delivery?: number; discount?: number }) {
	const total = subtotal + delivery - discount
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 6, font: '500 13px var(--bf-font)' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<span style={{ color: 'var(--bf-ink-2)' }}>Subtotal</span>
				<span className='bf-tabular'>{rs(subtotal)}</span>
			</div>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<span style={{ color: 'var(--bf-ink-2)' }}>Delivery</span>
				<span className='bf-mono' style={{ color: 'var(--bf-leaf)', fontWeight: 700, fontSize: 12 }}>{delivery === 0 ? 'FREE' : rs(delivery)}</span>
			</div>
			{discount > 0 && (
				<div style={{ display: 'flex', justifyContent: 'space-between' }}>
					<span style={{ color: 'var(--bf-ink-2)' }}>Promo</span>
					<span className='bf-tabular' style={{ color: 'var(--bf-ember)' }}>− {rs(discount)}</span>
				</div>
			)}
			<hr className='bf-rule' style={{ margin: '6px 0' }} />
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<span style={{ fontWeight: 800, fontSize: 14 }}>Total</span>
				<span className='bf-tabular' style={{ fontWeight: 800, fontSize: 18 }}>{rs(total)}</span>
			</div>
		</div>
	)
}

export { CartTotals }
