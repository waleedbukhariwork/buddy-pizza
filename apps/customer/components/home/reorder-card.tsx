'use client'
import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { Icons } from '../ui/icon'
import { useMyOrders, rs, timeAgo } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'

const STATUS_PILLS: Record<string, string> = {
	NEW: 'bf-pill-amber',
	PREPARING: 'bf-pill-amber',
	READY: 'bf-pill-leaf',
	WITH_RIDER: 'bf-pill-ink',
	DELIVERED: 'bf-pill-ink',
	CANCELLED: 'bf-pill-ember',
}

function ReorderButton({ orderId, items, onDone }: { orderId: number; items: Array<{ productId: number | null; dealId: number | null; productName: string | null; itemName: string | null; quantity: number; price: number }>; onDone: (id: number) => void }) {
	const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
	const addItem = useCartStore((s) => s.addItem)
	const clearCart = useCartStore((s) => s.clearCart)

	const handleClick = useCallback(() => {
		setState('loading')
		clearCart()
		for (const line of items) {
			const raw = line as Record<string, unknown>
			const pid = (line.productId ?? (raw.product as Record<string, unknown> | null)?.id ?? null) as number | null
			const did = (line.dealId ?? null) as number | null
			const name = (line.productName ?? line.itemName ?? (raw.product as Record<string, unknown> | null)?.name ?? null) as string | null
			if (!name) continue
			if (did != null) {
				addItem({
					dealId: did,
					productName: name,
					productId: 0,
					price: line.price / line.quantity,
					quantity: line.quantity,
				})
			} else if (pid != null) {
				addItem({
					productId: pid,
					productName: name,
					price: line.price / line.quantity,
					quantity: line.quantity,
				})
			}
		}
		setTimeout(() => {
			setState('done')
			onDone(orderId)
		}, 400)
	}, [items, clearCart, addItem, orderId, onDone])

	return (
		<button
			type='button'
			className={`bf-btn bf-reorder-btn ${state === 'done' ? 'bf-reorder-btn-done' : 'bf-btn-primary'} bf-btn-sm`}
			onClick={handleClick}
			disabled={state !== 'idle'}
		>
			{state === 'loading' ? (
				<span className='bf-spinner' />
			) : state === 'done' ? (
				<>{Icons.check} Added!</>
			) : (
				<>Reorder {Icons.arrow}</>
			)}
		</button>
	)
}

function ReorderCard() {
	const { user } = useAuthStore()
	const { data: orders, isLoading } = useMyOrders(!!user)
	const [doneIds, setDoneIds] = useState<Set<number>>(new Set())
	const handleDone = useCallback((id: number) => {
		setDoneIds((prev) => new Set(prev).add(id))
	}, [])

	if (!user) return null

	const validOrders = orders?.filter((o) => o.items.length > 0 && o.status !== 'CANCELLED') ?? []
	const displayOrders = validOrders.slice(0, 2)

	if (isLoading) {
		return (
			<section className='bf-page-section bf-reorder-wrap'>
				<div className='bf-reorder-head'>
					<h2>Your orders</h2>
				</div>
				<div className='bf-reorder-grid'>
					<div className='bf-skeleton' style={{ height: 120, borderRadius: 'var(--bf-radius)' }} />
				</div>
			</section>
		)
	}

	if (displayOrders.length === 0) {
		return (
			<section className='bf-page-section bf-reorder-wrap'>
				<div className='bf-reorder-head'>
					<h2>Your orders</h2>
				</div>
				<div className='bf-reorder-empty'>
					<div className='bf-reorder-empty-icon'>🍕</div>
					<div className='bf-reorder-empty-text'>No past orders yet</div>
					<div className='bf-reorder-empty-sub'>Place your first order and it'll show up here for quick reorder.</div>
					<Link href='/menu' className='bf-btn bf-btn-primary bf-btn-sm' style={{ marginTop: 16, display: 'inline-flex' }}>
						Browse menu {Icons.arrow}
					</Link>
				</div>
			</section>
		)
	}

	return (
		<section className='bf-page-section bf-reorder-wrap'>
			<div className='bf-reorder-head'>
				<h2>Order again</h2>
				<Link href='/account/orders'>
					View all {Icons.arrow}
				</Link>
			</div>
			<div className={`bf-reorder-grid${displayOrders.length > 1 ? ' has-multi' : ''}`}>
				{displayOrders.map((order) => {
					const isDone = doneIds.has(order.id)
					const summary = order.items.slice(0, 3).map((i) => `${i.quantity}× ${i.productName ?? i.itemName ?? 'Item'}`)
					const more = order.items.length > 3 ? order.items.length - 3 : 0

					return (
						<div key={order.id} className='bf-reorder-item' style={{ opacity: isDone ? 0.6 : 1, transition: 'opacity 0.3s' }}>
							<div className='bf-reorder-item-top'>
								<div>
									<div className='bf-reorder-item-number'>{order.orderNumber}</div>
									<div style={{ fontSize: 12, color: 'var(--bf-mute)', marginTop: 2 }}>
										{timeAgo(order.createdAt)}
									</div>
								</div>
								<span className={`bf-pill ${STATUS_PILLS[order.status] ?? 'bf-pill-ink'}`} style={{ fontSize: 10 }}>
									{order.status === 'NEW' ? 'New' :
									 order.status === 'PREPARING' ? 'Preparing' :
									 order.status === 'READY' ? 'Ready' :
									 order.status === 'WITH_RIDER' ? 'On its way' :
									 order.status === 'DELIVERED' ? 'Delivered' : order.status}
								</span>
							</div>
							<div className='bf-reorder-items'>
								{summary.map((s, i) => (
									<span key={i} className='bf-reorder-item-dot'>{s}</span>
								))}
								{more > 0 && (
									<span className='bf-reorder-item-dot'>+{more} more</span>
								)}
							</div>
							<div className='bf-reorder-item-meta'>
								<span className='bf-reorder-item-total'>{rs(order.total)}</span>
								<ReorderButton orderId={order.id} items={order.items} onDone={handleDone} />
							</div>
						</div>
					)
				})}
			</div>
		</section>
	)
}

export { ReorderCard }
