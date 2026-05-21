'use client'
import React from 'react'
import Link from 'next/link'
import { CustomerShell } from '../../../components/layout/customer-shell'
import { Icons } from '../../../components/ui/icon'
import { useMyOrders, rs, timeAgo } from '../../../lib/hooks'

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
	NEW:        { pill: 'bf-pill-amber', label: 'New' },
	PREPARING:  { pill: 'bf-pill-amber', label: 'Preparing' },
	READY:      { pill: 'bf-pill-leaf',  label: 'Ready' },
	WITH_RIDER: { pill: 'bf-pill-ink',   label: 'On its way' },
	DELIVERED:  { pill: 'bf-pill-ink',   label: 'Delivered' },
	CANCELLED:  { pill: 'bf-pill-ember', label: 'Cancelled' },
}

function OrderCard({ order }: { order: ReturnType<typeof useMyOrders>['data'] extends (infer T)[] | undefined ? T : never }) {
	if (!order) return null
	const status = STATUS_STYLES[order.status] ?? { pill: 'bf-pill-ink', label: order.status }
	const itemSummary = order.items
		.map(i => `${i.quantity}× ${i.product?.name ?? 'Item'}`)
		.join(', ')

	return (
		<article className='bf-card' style={{ padding: '20px 24px' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
				<div>
					<div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>{order.orderNumber}</div>
					<div style={{ fontSize: 13, color: 'var(--bf-ink-2)', marginTop: 3 }}>
						{timeAgo(order.createdAt)}
						{order.deliveryAddress && <> · {order.deliveryAddress}</>}
					</div>
				</div>
				<span className={`bf-pill ${status.pill}`} style={{ flexShrink: 0 }}>{status.label}</span>
			</div>
			<div style={{ height: 1, background: 'var(--bf-line)', margin: '14px 0' }} />
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
				<div style={{ fontSize: 13, color: 'var(--bf-ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
					{itemSummary}
				</div>
				<strong style={{ flexShrink: 0, fontWeight: 800 }}>{rs(order.total)}</strong>
			</div>
		</article>
	)
}

export default function OrdersPage() {
	const { data: orders, isLoading, error, mutate } = useMyOrders()

	return (
		<CustomerShell activePage='orders'>
			<main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 56px' }}>
				<div className='bf-eyebrow'>ACCOUNT</div>
				<h1 style={{ fontWeight: 900, fontSize: 40, letterSpacing: '-0.03em', margin: '8px 0 28px' }}>Order history</h1>

				{isLoading ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className='bf-skeleton' style={{ height: 110, borderRadius: 'var(--bf-radius)' }} />
						))}
					</div>
				) : error ? (
					<div className='bf-card' style={{ padding: '40px 24px', textAlign: 'center' }}>
						<div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
						<div style={{ fontWeight: 700, fontSize: 16 }}>Couldn't load your orders</div>
						<div style={{ fontSize: 13, color: 'var(--bf-ink-2)', marginTop: 6 }}>
							{error.message?.includes('401') ? 'Please sign in to view your orders.' : 'Something went wrong. Please try again.'}
						</div>
						{error.message?.includes('401') ? (
							<Link href='/auth/login' className='bf-btn bf-btn-primary bf-btn-sm' style={{ marginTop: 16, display: 'inline-flex' }}>
								Sign in {Icons.arrow}
							</Link>
						) : (
							<button onClick={() => mutate()} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16 }}>
								Try again
							</button>
						)}
					</div>
				) : !orders || orders.length === 0 ? (
					<div style={{ padding: '80px 0', textAlign: 'center' }}>
						<div style={{ fontSize: 56, marginBottom: 16 }}>🛵</div>
						<div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.025em' }}>No orders yet</div>
						<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8 }}>
							Time to treat yourself. Your order history will show up here.
						</div>
						<Link href='/menu' className='bf-btn bf-btn-primary bf-btn-lg' style={{ marginTop: 24, display: 'inline-flex' }}>
							Order now {Icons.arrow}
						</Link>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{orders.map(order => <OrderCard key={order.id} order={order} />)}
					</div>
				)}
			</main>
		</CustomerShell>
	)
}
