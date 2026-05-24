'use client'
import React, { useState } from 'react'
import { Icons } from '../ui/icon'
import { STATUS_MAP } from '../ui/status-pill'
import type { Order, OrderStatus } from '../../lib/types'
import { rs, timeAgo, updateOrderStatus } from '../../lib/hooks'

const TIMELINE: OrderStatus[] = ['NEW', 'PREPARING', 'READY', 'WITH_RIDER', 'DELIVERED']

const TIMELINE_LABEL: Record<OrderStatus, string> = {
	NEW: 'New',
	PREPARING: 'Prep',
	READY: 'Ready',
	WITH_RIDER: 'Rider',
	DELIVERED: 'Done',
	CANCELLED: 'Cancel',
}

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus; style: string }>> = {
	NEW: { label: 'Accept order', next: 'PREPARING', style: 'bf-btn-primary' },
	PREPARING: { label: 'Mark ready', next: 'READY', style: 'bf-btn-ink' },
	READY: { label: 'Assign rider', next: 'WITH_RIDER', style: 'bf-btn-ink' },
	WITH_RIDER: { label: 'Mark delivered', next: 'DELIVERED', style: 'bf-btn-amber' },
}

export function OrderDetailDrawer({
	order,
	onClose,
	onUpdated,
}: {
	order: Order
	onClose: () => void
	onUpdated?: () => void
}) {
	const [loading, setLoading] = useState(false)

	async function handleAction() {
		const act = NEXT_ACTION[order.status as OrderStatus]
		if (!act) return
		setLoading(true)
		try {
			await updateOrderStatus(order.id, act.next)
			onUpdated?.()
			onClose()
		} catch {
			console.error('Failed to update order', order.id)
		} finally {
			setLoading(false)
		}
	}

	const statusIdx = TIMELINE.indexOf(order.status as OrderStatus)
	const nextAction = NEXT_ACTION[order.status as OrderStatus]

	return (
		<>
			{/* Overlay */}
			<div className='bf-drawer-overlay' onClick={onClose} />

			{/* Drawer panel */}
			<div className='bf-drawer' role='dialog' aria-modal='true'>

				{/* ── Header ── */}
				<div className='bf-drawer-header'>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							className='bf-mono'
							style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}
						>
							Order details
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
							<span style={{ font: '800 22px var(--bf-font)', color: '#fff', letterSpacing: '-0.024em' }}>
								{order.orderNumber ?? `#${order.id}`}
							</span>
							<DrawerStatusBadge status={order.status as OrderStatus} />
						</div>
						<div style={{ marginTop: 5, display: 'flex', gap: 12, alignItems: 'center' }}>
							<span style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,.5)', fontFamily: 'var(--bf-mono)' }}>
								{Icons.clock}
								{timeAgo(order.createdAt)}
							</span>
							<span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontFamily: 'var(--bf-mono)' }}>
								{order.items?.length ?? 0} ITEMS
							</span>
						</div>
					</div>
					<button
						onClick={onClose}
						style={{
							width: 34,
							height: 34,
							borderRadius: '50%',
							border: 0,
							background: 'rgba(255,255,255,.12)',
							color: 'rgba(255,255,255,.7)',
							display: 'grid',
							placeItems: 'center',
							cursor: 'pointer',
							flexShrink: 0,
							transition: 'background .15s, color .15s',
						}}
						onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.22)'; e.currentTarget.style.color = '#fff' }}
						onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)' }}
					>
						{Icons.x}
					</button>
				</div>

				{/* ── Scrollable body ── */}
				<div className='bf-drawer-body bf-scroll'>

					{/* Status timeline */}
					{order.status !== 'CANCELLED' && (
						<div className='bf-drawer-section'>
							<div className='bf-drawer-section-label'>Progress</div>
							<div style={{ display: 'flex', alignItems: 'flex-start' }}>
								{TIMELINE.map((step, i) => {
									const done = i <= statusIdx
									const active = i === statusIdx
									return (
										<React.Fragment key={step}>
											<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
												<div
													style={{
														width: 30,
														height: 30,
														borderRadius: '50%',
														border: `2px solid ${done ? (active ? 'var(--bf-ember)' : 'var(--bf-leaf)') : 'var(--bf-line-2)'}`,
														background: done ? (active ? 'var(--bf-ember)' : 'var(--bf-leaf)') : 'var(--bf-cream-2)',
														display: 'grid',
														placeItems: 'center',
														color: done ? '#fff' : 'var(--bf-mute)',
														boxShadow: active ? '0 0 0 5px rgba(232,67,31,.15)' : 'none',
														transition: 'all .2s',
														flexShrink: 0,
													}}
												>
													{done && !active ? (
														<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
															<path d='M4 12l5 5L20 6' />
														</svg>
													) : (
														<span style={{ font: `700 10px var(--bf-mono)` }}>{i + 1}</span>
													)}
												</div>
												<span style={{
													fontSize: 9,
													fontFamily: 'var(--bf-mono)',
													fontWeight: 700,
													letterSpacing: '.06em',
													color: (done || active) ? 'var(--bf-ink)' : 'var(--bf-mute)',
													textTransform: 'uppercase',
													textAlign: 'center',
													width: 40,
												}}>
													{TIMELINE_LABEL[step]}
												</span>
											</div>
											{i < TIMELINE.length - 1 && (
												<div style={{
													flex: 1,
													height: 2,
													background: i < statusIdx ? 'var(--bf-leaf)' : 'var(--bf-line-2)',
													marginTop: 14,
													transition: 'background .3s',
												}} />
											)}
										</React.Fragment>
									)
								})}
							</div>
						</div>
					)}

					{/* Customer info */}
					<div className='bf-drawer-section'>
						<div className='bf-drawer-section-label'>Customer</div>
						<div className='bf-drawer-info-card'>
							{(order.user?.name || order.customerPhone) && (
								<div className='bf-drawer-info-row'>
									<span className='bf-drawer-info-icon'>{Icons.user}</span>
									<span>{order.user?.name ?? '—'}</span>
								</div>
							)}
							<div className='bf-drawer-info-row'>
								<span className='bf-drawer-info-icon'>{Icons.phone}</span>
								<span>{order.customerPhone ?? order.user?.phone ?? '—'}</span>
							</div>
							<div className='bf-drawer-info-row'>
								<span className='bf-drawer-info-icon'>{Icons.pin}</span>
								<span style={{ lineHeight: 1.5 }}>{order.deliveryAddress ?? '—'}</span>
							</div>
							{order.specialNotes && (
								<div className='bf-drawer-info-row' style={{ color: 'var(--bf-ink-2)' }}>
									<span className='bf-drawer-info-icon'>{Icons.info}</span>
									<span style={{ fontStyle: 'italic', fontSize: 13 }}>{order.specialNotes}</span>
								</div>
							)}
						</div>
					</div>

					{/* Order items */}
					<div className='bf-drawer-section'>
						<div className='bf-drawer-section-label'>Items ({order.items?.length ?? 0})</div>
						<div className='bf-drawer-items'>
							{(order.items ?? []).map((item, i) => {
								const isDeal = !!item.dealId
								const name = item.itemName ?? item.product?.name ?? 'Item'
								return (
									<div key={i} className='bf-drawer-item'>
										<div
											style={{
												width: 34,
												height: 34,
												borderRadius: 9,
												background: isDeal ? '#EDE9FE' : 'var(--bf-cream-2)',
												display: 'grid',
												placeItems: 'center',
												color: isDeal ? '#7c3aed' : 'var(--bf-ink-2)',
												flexShrink: 0,
											}}
										>
											{isDeal ? Icons.tag : Icons.pkg}
										</div>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{ font: '600 13.5px var(--bf-font)', color: 'var(--bf-ink)', lineHeight: 1.3 }}>
												{name}
											</div>
											{isDeal && (
												<span style={{
													fontSize: 10,
													fontFamily: 'var(--bf-mono)',
													fontWeight: 700,
													color: '#7c3aed',
													background: '#EDE9FE',
													padding: '2px 7px',
													borderRadius: 999,
													display: 'inline-block',
													marginTop: 3,
													letterSpacing: '.04em',
												}}>
													DEAL
												</span>
											)}
											{item.customizations && (
												<div style={{ fontSize: 11.5, color: 'var(--bf-mute)', marginTop: 2 }}>
													{item.customizations}
												</div>
											)}
										</div>
										<div style={{ textAlign: 'right', flexShrink: 0 }}>
											<div style={{ font: '700 13.5px var(--bf-font)', color: 'var(--bf-ink)' }}>
												{rs(item.price * item.quantity)}
											</div>
											<div style={{ fontSize: 11, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', marginTop: 2 }}>
												{item.quantity} × {rs(item.price)}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>

					{/* Pricing */}
					<div className='bf-drawer-section'>
						<div className='bf-drawer-section-label'>Pricing</div>
						<div className='bf-drawer-pricing'>
							<div className='bf-drawer-pricing-row'>
								<span>Subtotal</span>
								<span>{rs(order.subtotal ?? order.total)}</span>
							</div>
							{(order.deliveryFee ?? 0) > 0 && (
								<div className='bf-drawer-pricing-row'>
									<span>Delivery fee</span>
									<span>{rs(order.deliveryFee!)}</span>
								</div>
							)}
							{(order.discount ?? 0) > 0 && (
								<div className='bf-drawer-pricing-row' style={{ color: 'var(--bf-leaf)' }}>
									<span>Discount</span>
									<span>-{rs(order.discount!)}</span>
								</div>
							)}
							<div className='bf-drawer-pricing-total'>
								<span>Total</span>
								<span>{rs(order.total)}</span>
							</div>
						</div>
					</div>

					{/* Rider (if assigned) */}
					{order.rider && (
						<div className='bf-drawer-section'>
							<div className='bf-drawer-section-label'>Rider</div>
							<div className='bf-drawer-info-card'>
								<div className='bf-drawer-info-row'>
									<div
										style={{
											width: 28,
											height: 28,
											borderRadius: '50%',
											background: '#8b5cf6',
											color: '#fff',
											display: 'grid',
											placeItems: 'center',
											font: '700 10px var(--bf-mono)',
											flexShrink: 0,
										}}
									>
										{order.rider.riderId.slice(-2).toUpperCase()}
									</div>
									<span style={{ font: '600 13.5px var(--bf-font)' }}>Rider {order.rider.riderId}</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* ── Footer ── */}
				<div className='bf-drawer-footer'>
					{nextAction ? (
						<button
							className={`bf-btn ${nextAction.style} bf-btn-md`}
							style={{ flex: 1, justifyContent: 'space-between' }}
							disabled={loading}
							onClick={handleAction}
						>
							<span>{loading ? 'Updating…' : nextAction.label}</span>
							{Icons.arrow}
						</button>
					) : order.status === 'DELIVERED' ? (
						<div
							style={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
								padding: '10px',
								borderRadius: 12,
								background: 'rgba(47,143,78,.1)',
								color: 'var(--bf-leaf)',
								font: '700 13px var(--bf-font)',
							}}
						>
							{Icons.check} Delivered
						</div>
					) : order.status === 'CANCELLED' ? (
						<div
							style={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
								padding: '10px',
								borderRadius: 12,
								background: '#FEE2E2',
								color: '#991B1B',
								font: '700 13px var(--bf-font)',
							}}
						>
							{Icons.x} Cancelled
						</div>
					) : null}
					<button
						className='bf-btn bf-btn-outline bf-btn-md'
						style={{ flexShrink: 0 }}
						onClick={onClose}
					>
						Close
					</button>
				</div>
			</div>
		</>
	)
}

function DrawerStatusBadge({ status }: { status: OrderStatus }) {
	const cfg = STATUS_MAP[status] || STATUS_MAP.NEW
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 5,
				padding: '3px 10px',
				borderRadius: 999,
				font: '700 10.5px var(--bf-font)',
				background: 'rgba(255,255,255,.14)',
				color: '#fff',
				letterSpacing: '.02em',
				backdropFilter: 'blur(4px)',
			}}
		>
			<span className={`bf-dot ${cfg.dot}`} />
			{cfg.label}
		</span>
	)
}
