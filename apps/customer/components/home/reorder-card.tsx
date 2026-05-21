'use client'
import React from 'react'
import Link from 'next/link'
import { Icons } from '../ui/icon'
import { useMyOrders, rs } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'

function ReorderCard() {
	const { user } = useAuthStore()
	const { data: orders, isLoading } = useMyOrders(!!user)
	const addItem = useCartStore((s) => s.addItem)
	const clearCart = useCartStore((s) => s.clearCart)

	if (!user) return null

	const lastOrder = orders?.find((o) => o.status !== 'CANCELLED')
	if (isLoading) {
		return <div className='bf-reorder-card bf-skeleton' style={{ height: 88 }} />
	}
	if (!lastOrder || lastOrder.items.length === 0) return null

	const summary = lastOrder.items
		.slice(0, 2)
		.map((i) => `${i.quantity}× ${i.product?.name ?? 'Item'}`)
		.join(', ')
	const more = lastOrder.items.length > 2 ? ` +${lastOrder.items.length - 2} more` : ''

	function handleReorder() {
		clearCart()
		for (const line of lastOrder!.items) {
			if (!line.product) continue
			addItem({
				productId: line.product.id,
				productName: line.product.name,
				price: line.price / line.quantity,
				quantity: line.quantity,
			})
		}
	}

	return (
		<section className='bf-page-section bf-reorder-section'>
			<div className='bf-reorder-card'>
				<div className='bf-reorder-icon'>{Icons.receipt}</div>
				<div className='bf-reorder-body'>
					<div className='bf-eyebrow' style={{ marginBottom: 4 }}>ORDER AGAIN</div>
					<div className='bf-reorder-title'>Your last feast</div>
					<div className='bf-reorder-meta'>
						{summary}{more} · <span className='bf-mono'>{rs(lastOrder.total)}</span>
					</div>
				</div>
				<div className='bf-reorder-actions'>
					<button type='button' className='bf-btn bf-btn-primary bf-btn-md' onClick={handleReorder}>
						Reorder {Icons.arrow}
					</button>
					<Link href='/account/orders' className='bf-reorder-link'>
						History
					</Link>
				</div>
			</div>
		</section>
	)
}

export { ReorderCard }
