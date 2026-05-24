'use client'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { CustomerShell } from '../../../components/layout/customer-shell'
import { Icons } from '../../../components/ui/icon'
import { useMyOrders, rs, timeAgo } from '../../../lib/hooks'
import { useCartStore } from '../../../lib/cart-store'
import { useAuthStore } from '../../../lib/auth-store'

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
	NEW:        { pill: 'bf-pill-amber', label: 'New' },
	PREPARING:  { pill: 'bf-pill-amber', label: 'Preparing' },
	READY:      { pill: 'bf-pill-leaf',  label: 'Ready' },
	WITH_RIDER: { pill: 'bf-pill-ink',   label: 'On its way' },
	DELIVERED:  { pill: 'bf-pill-ink',   label: 'Delivered' },
	CANCELLED:  { pill: 'bf-pill-ember', label: 'Cancelled' },
}

const TABS = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active' },
	{ key: 'delivered', label: 'Delivered' },
	{ key: 'cancelled', label: 'Cancelled' },
] as const

type TabKey = (typeof TABS)[number]['key']

const ACTIVE_STATUSES = new Set(['NEW', 'PREPARING', 'READY', 'WITH_RIDER'])

function ReorderBtn({ items }: { items: Array<{ productId: number | null; dealId: number | null; productName: string | null; itemName: string | null; quantity: number; price: number }> }) {
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
		setTimeout(() => setState('done'), 400)
	}, [items, clearCart, addItem])

	if (state === 'done') {
		return (
			<Link href='/checkout' className='bf-btn bf-btn-leaf bf-btn-sm' style={{ background: 'var(--bf-leaf)', color: '#fff', boxShadow: '0 2px 0 #1f6d38, 0 6px 14px rgba(47,143,78,0.32)' }}>
				{Icons.check} View cart
			</Link>
		)
	}

	return (
		<button type='button' className='bf-btn bf-btn-ghost bf-btn-sm' onClick={handleClick} disabled={state === 'loading'} style={{ fontWeight: 700, fontSize: 12.5, gap: 4 }}>
			{state === 'loading' ? (
				<span className='bf-spinner' style={{ width: 14, height: 14, border: '2px solid var(--bf-line-2)', borderTopColor: 'var(--bf-ember)', borderRadius: '50%', display: 'inline-block', animation: 'bf-spin 0.6s linear infinite' }} />
			) : (
				<>Reorder {Icons.arrow}</>
			)}
		</button>
	)
}

function OrderCard({ order }: { order: ReturnType<typeof useMyOrders>['data'] extends (infer T)[] | undefined ? T : never }) {
	if (!order) return null
	const status = STATUS_STYLES[order.status] ?? { pill: 'bf-pill-ink', label: order.status }
	const [expanded, setExpanded] = useState(false)
	const [copied, setCopied] = useState(false)

	const handleCopy = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation()
		try {
			await navigator.clipboard.writeText(order.orderNumber)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch { /* ignore */ }
	}, [order.orderNumber])

	const itemNames = order.items.map(i => `${i.quantity}× ${i.productName ?? i.itemName ?? 'Item'}`)

	return (
		<div className='bf-oh-card'>
			<div className='bf-oh-card-main' onClick={() => setExpanded((v) => !v)}>
				<div className='bf-oh-card-row'>
					<div className='bf-oh-card-left'>
						<div className='bf-oh-card-number'>
							{order.orderNumber}
							<button type='button' className='bf-oh-card-copy' onClick={handleCopy} title='Copy order number'>
								{copied ? (
									<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='var(--bf-leaf)' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
										<path d='M4 12l5 5L20 6' />
									</svg>
								) : (
									<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
										<rect x='9' y='9' width='13' height='13' rx='2' ry='2' /><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
									</svg>
								)}
							</button>
						</div>
						<div className='bf-oh-card-time'>
							<span>{timeAgo(order.createdAt)}</span>
							{order.deliveryAddress && <><span style={{ opacity: 0.3 }}>·</span><span className='bf-oh-card-address'>{order.deliveryAddress}</span></>}
						</div>
					</div>
					<span className={`bf-pill ${status.pill}`} style={{ flexShrink: 0 }}>{status.label}</span>
				</div>
				<div className='bf-oh-card-divider' />
				<div className='bf-oh-card-bottom'>
					<div className='bf-oh-card-items'>
						{itemNames.slice(0, 3).map((n, i) => (
							<span key={i} className='bf-oh-card-item'>{n}</span>
						))}
						{itemNames.length > 3 && (
							<span className='bf-oh-card-item'>+{itemNames.length - 3} more</span>
						)}
					</div>
					<div className='bf-oh-card-actions'>
						{order.status !== 'CANCELLED' && <ReorderBtn items={order.items} />}
						<span className='bf-oh-card-total'>{rs(order.total)}</span>
						<span className={`bf-oh-card-expand-icon${expanded ? ' open' : ''}`}>
							<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
								<path d='M6 9l6 6 6-6' />
							</svg>
						</span>
					</div>
				</div>
			</div>
			{expanded && (
				<div className='bf-oh-card-detail'>
					<div className='bf-oh-detail-grid'>
						<div>
							<div className='bf-oh-detail-section-title'>Order details</div>
							<div className='bf-oh-detail-row'>
								<span className='bf-oh-detail-row-label'>Status</span>
								<span className={`bf-pill ${status.pill}`} style={{ fontSize: 10 }}>{status.label}</span>
							</div>
							<div className='bf-oh-detail-row'>
								<span className='bf-oh-detail-row-label'>Order number</span>
								<span className='bf-oh-detail-row-value'>{order.orderNumber}</span>
							</div>
							<div className='bf-oh-detail-row'>
								<span className='bf-oh-detail-row-label'>Placed</span>
								<span className='bf-oh-detail-row-value'>{new Date(order.createdAt).toLocaleString('en-PK', { dateStyle: 'long', timeStyle: 'short' })}</span>
							</div>
							{order.deliveryAddress && (
								<div className='bf-oh-detail-row'>
									<span className='bf-oh-detail-row-label'>Delivery to</span>
									<span className='bf-oh-detail-row-value' style={{ textAlign: 'right', maxWidth: 200 }}>{order.deliveryAddress}</span>
								</div>
							)}
							<div className='bf-oh-detail-row bf-oh-detail-total'>
								<span className='bf-oh-detail-row-label'>Total</span>
								<span>{rs(order.total)}</span>
							</div>
						</div>
						<div>
							<div className='bf-oh-detail-section-title'>Items</div>
							<div className='bf-oh-detail-items'>
								{order.items.map((item) => (
									<div key={item.id} className='bf-oh-detail-item'>
										<div>
											<span className='bf-oh-detail-item-name'>{item.productName ?? item.itemName ?? 'Item'}</span>
											<span style={{ fontSize: 12, color: 'var(--bf-mute)', marginLeft: 6 }}>×{item.quantity}</span>
										</div>
										<span className='bf-oh-detail-item-price'>{rs(item.price)}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default function OrdersPage() {
	const { token, hydrate } = useAuthStore()
	const [hydrated, setHydrated] = useState(false)

	useEffect(() => {
		hydrate()
		setHydrated(true)
	}, [hydrate])

	const { data: orders, isLoading, error, mutate } = useMyOrders(!!token)
	const [tab, setTab] = useState<TabKey>('all')
	const [search, setSearch] = useState('')

	const filteredOrders = useMemo(() => {
		if (!orders) return []
		let result = orders
		if (tab === 'active') result = result.filter((o) => ACTIVE_STATUSES.has(o.status))
		else if (tab === 'delivered') result = result.filter((o) => o.status === 'DELIVERED')
		else if (tab === 'cancelled') result = result.filter((o) => o.status === 'CANCELLED')
		if (search.trim()) {
			const q = search.trim().toLowerCase()
			result = result.filter((o) => o.orderNumber.toLowerCase().includes(q))
		}
		return result
	}, [orders, tab, search])

	if (!hydrated) {
		return (
			<CustomerShell activePage='orders'>
				<main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 56px' }}>
					<div className='bf-oh-list'>
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className='bf-skeleton' style={{ height: 130, borderRadius: 'var(--bf-radius)' }} />
						))}
					</div>
				</main>
			</CustomerShell>
		)
	}

	if (!token) {
		return (
			<CustomerShell activePage='orders'>
				<main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 56px' }}>
					<div className='bf-oh-header'>
						<div className='bf-oh-title-area'>
							<div>
								<div className='bf-eyebrow' style={{ marginBottom: 4 }}>ACCOUNT</div>
								<h1>Order history</h1>
							</div>
						</div>
					</div>
					<div className='bf-card' style={{ padding: '64px 24px', textAlign: 'center' }}>
						<div style={{ fontSize: 52, marginBottom: 20, lineHeight: 1 }}>
							<svg width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='var(--bf-ink-2)' strokeWidth='1.2' strokeLinecap='round' strokeLinejoin='round'>
								<path d='M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3z' />
								<path d='M9 8h6M9 12h6M9 16h4' />
							</svg>
						</div>
						<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.025em' }}>Sign in to view your orders</div>
						<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8, marginBottom: 28, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
							Track your orders, reorder past favourites, and see your full history.
						</div>
						<Link href='/auth/login?redirect=/account/orders' className='bf-btn bf-btn-primary bf-btn-lg' style={{ display: 'inline-flex' }}>
							Sign in {Icons.arrow}
						</Link>
						<div style={{ marginTop: 16 }}>
							<Link href='/' style={{ fontSize: 13, color: 'var(--bf-mute)', textDecoration: 'underline' }}>
								Continue as guest
							</Link>
						</div>
					</div>
				</main>
			</CustomerShell>
		)
	}

	return (
		<CustomerShell activePage='orders'>
			<main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 56px' }}>
				<div className='bf-oh-header'>
					<div className='bf-oh-title-area'>
						<div>
							<div className='bf-eyebrow' style={{ marginBottom: 4 }}>ACCOUNT</div>
							<h1>Order history</h1>
						</div>
						{orders && orders.length > 0 && (
							<span className='bf-oh-count'>{orders.length} total</span>
						)}
					</div>
					<div className='bf-oh-controls'>
						<div className='bf-oh-search'>
							<span className='bf-oh-search-icon'>{Icons.search}</span>
							<input
								className='bf-input'
								type='text'
								placeholder='Search by order number…'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div className='bf-oh-tabs'>
							{TABS.map((t) => (
								<button key={t.key} type='button' className={`bf-oh-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
									{t.label}
								</button>
							))}
						</div>
					</div>
				</div>

				{isLoading ? (
					<div className='bf-oh-list'>
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className='bf-skeleton' style={{ height: 130, borderRadius: 'var(--bf-radius)' }} />
						))}
					</div>
				) : error ? (
					<div className='bf-card' style={{ padding: '40px 24px', textAlign: 'center' }}>
						<div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
						<div style={{ fontWeight: 700, fontSize: 16 }}>Couldn't load your orders</div>
						<div style={{ fontSize: 13, color: 'var(--bf-ink-2)', marginTop: 6 }}>
							{error.status === 401 || error.message?.includes('401')
								? 'Please sign in to view your orders.'
								: error.errorCode === 'ENDPOINT_NOT_FOUND'
									? 'Route not found.'
									: 'Something went wrong. Please try again.'}
						</div>
						{error.status === 401 || error.message?.includes('401') ? (
							<Link href='/auth/login' className='bf-btn bf-btn-primary bf-btn-sm' style={{ marginTop: 16, display: 'inline-flex' }}>
								Sign in {Icons.arrow}
							</Link>
						) : (
							<button onClick={() => mutate()} className='bf-btn bf-btn-outline bf-btn-sm' style={{ marginTop: 16 }}>
								Try again
							</button>
						)}
					</div>
				) : filteredOrders.length === 0 ? (
					<div className='bf-oh-empty'>
						<div className='bf-oh-empty-icon'>
							{search ? '🔍' : tab === 'active' ? '🛵' : tab === 'delivered' ? '✅' : tab === 'cancelled' ? '🚫' : '🛵'}
						</div>
						<div className='bf-oh-empty-title'>
							{search ? 'No orders match your search' :
							 tab === 'active' ? 'No active orders' :
							 tab === 'delivered' ? 'No delivered orders yet' :
							 tab === 'cancelled' ? 'No cancelled orders' :
							 'No orders yet'}
						</div>
						<div className='bf-oh-empty-sub'>
							{search ? 'Try a different order number.' :
							 tab !== 'cancelled' ? 'Time to treat yourself. Your order history will show up here.' :
							 'No cancelled orders found.'}
						</div>
						{!search && tab !== 'cancelled' && (
							<div className='bf-oh-empty-action'>
								<Link href='/menu' className='bf-btn bf-btn-primary bf-btn-md' style={{ display: 'inline-flex' }}>
									Browse menu {Icons.arrow}
								</Link>
							</div>
						)}
					</div>
				) : (
					<div className='bf-oh-list'>
						{filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
					</div>
				)}
			</main>
		</CustomerShell>
	)
}
