'use client'
import React, { useState } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Icons } from '../ui/icon'
import { Skeleton } from '../ui/skeleton'
import { OrderDetailDrawer } from './order-detail-drawer'
import { useOrders, updateOrderStatus, rs, timeAgo, shortAddress } from '../../lib/hooks'
import type { Order } from '../../lib/types'

// ─── Pipeline columns ─────────────────────────────────────────────────────────
const PIPELINE_COLS = [
	{ id: 'NEW',        title: 'New',        dot: 'bf-dot-new',   accent: '#DBEAFE', accentText: '#1E40AF' },
	{ id: 'PREPARING',  title: 'Preparing',  dot: 'bf-dot-prep',  accent: '#FFF1D6', accentText: '#92580E' },
	{ id: 'READY',      title: 'Ready',      dot: 'bf-dot-ready', accent: '#DCFCE7', accentText: '#166534' },
	{ id: 'WITH_RIDER', title: 'With rider', dot: 'bf-dot-rider', accent: '#EDE9FE', accentText: '#5B21B6' },
] as const

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({
	o,
	col,
	isFirst,
	onAction,
	actionLoading,
	onViewDetails,
}: {
	o: Order
	col: string
	isFirst: boolean
	onAction: (id: number, status: string) => void
	actionLoading: boolean
	onViewDetails: (o: Order) => void
}) {
	const [hovered, setHovered] = useState(false)

	return (
		<div
			onClick={() => onViewDetails(o)}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				background: 'var(--bf-paper)',
				borderRadius: 14,
				padding: 14,
				boxShadow: hovered ? 'var(--bf-shadow-md)' : 'var(--bf-shadow-sm)',
				border: `1px solid ${isFirst && col === 'NEW' ? 'rgba(232,67,31,.35)' : 'var(--bf-line)'}`,
				cursor: 'pointer',
				transform: hovered ? 'translateY(-2px)' : 'none',
				transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* Top accent stripe for first NEW order */}
			{isFirst && col === 'NEW' && (
				<div style={{
					position: 'absolute',
					top: 0, left: 0, right: 0,
					height: 3,
					background: 'linear-gradient(90deg, var(--bf-ember), #ff6b47)',
					borderRadius: '14px 14px 0 0',
				}} />
			)}

			{/* Header row */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isFirst && col === 'NEW' ? 6 : 0 }}>
				<span className='bf-mono' style={{ font: '700 11.5px var(--bf-mono)', color: 'var(--bf-ink)', letterSpacing: '.02em' }}>
					{o.orderNumber ?? `#${o.id}`}
				</span>
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<span className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)' }}>
						{timeAgo(o.createdAt)}
					</span>
					<span style={{ color: 'var(--bf-mute)', opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}>
						{Icons.chevRight}
					</span>
				</div>
			</div>

			{/* Customer name */}
			<div style={{ font: '700 14px var(--bf-font)', marginTop: 8, color: 'var(--bf-ink)', letterSpacing: '-0.01em' }}>
				{o.user?.name ?? o.customerPhone ?? '—'}
			</div>

			{/* Address */}
			<div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginTop: 4 }}>
				<span style={{ color: 'var(--bf-mute)', flexShrink: 0, marginTop: 1 }}>
					{Icons.pin}
				</span>
				<span style={{ fontSize: 12, color: 'var(--bf-ink-2)', lineHeight: 1.4 }}>
					{shortAddress(o.deliveryAddress)}
				</span>
			</div>

			{/* Items preview */}
			{o.items && o.items.length > 0 && (
				<div style={{
					marginTop: 8,
					padding: '6px 10px',
					background: 'var(--bf-cream)',
					borderRadius: 8,
					fontSize: 11.5,
					color: 'var(--bf-ink-2)',
					lineHeight: 1.4,
				}}>
					{o.items.slice(0, 2).map((item, i) => (
						<span key={i}>
							{i > 0 && <span style={{ color: 'var(--bf-mute)', margin: '0 4px' }}>·</span>}
							{item.quantity}× {item.itemName ?? item.product?.name ?? 'Item'}
						</span>
					))}
					{o.items.length > 2 && (
						<span style={{ color: 'var(--bf-mute)' }}> +{o.items.length - 2} more</span>
					)}
				</div>
			)}

			{/* Footer row */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
				<span className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)', letterSpacing: '.04em' }}>
					{o.items?.length ?? 0} ITEMS
				</span>
				<span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }} className='bf-tabular'>
					{rs(o.total ?? 0)}
				</span>
			</div>

			{/* Action buttons */}
			{col === 'NEW' && (
				<button
					className='bf-btn bf-btn-primary bf-btn-sm'
					disabled={actionLoading}
					onClick={(e) => { e.stopPropagation(); onAction(o.id, 'PREPARING') }}
					style={{ width: '100%', marginTop: 10, justifyContent: 'space-between', opacity: actionLoading ? 0.6 : 1 }}
				>
					<span>{actionLoading ? 'Accepting…' : 'Accept order'}</span>
					{Icons.arrow}
				</button>
			)}

			{col === 'PREPARING' && (
				<button
					className='bf-btn bf-btn-ink bf-btn-sm'
					disabled={actionLoading}
					onClick={(e) => { e.stopPropagation(); onAction(o.id, 'READY') }}
					style={{ width: '100%', marginTop: 10, justifyContent: 'space-between', opacity: actionLoading ? 0.6 : 1 }}
				>
					<span>{actionLoading ? 'Updating…' : 'Mark ready'}</span>
					{Icons.arrow}
				</button>
			)}

			{col === 'READY' && (
				<button
					className='bf-btn bf-btn-ink bf-btn-sm'
					disabled={actionLoading}
					onClick={(e) => { e.stopPropagation(); onAction(o.id, 'WITH_RIDER') }}
					style={{ width: '100%', marginTop: 10, justifyContent: 'space-between', opacity: actionLoading ? 0.6 : 1 }}
				>
					<span>{actionLoading ? 'Assigning…' : <>{Icons.bike} Assign rider</>}</span>
					{Icons.arrow}
				</button>
			)}

			{col === 'WITH_RIDER' && o.rider && (
				<div style={{
					marginTop: 10,
					display: 'flex',
					gap: 8,
					padding: '7px 10px',
					borderRadius: 9,
					background: '#EDE9FE',
					alignItems: 'center',
				}}>
					<div style={{
						width: 22, height: 22, borderRadius: '50%',
						background: '#8b5cf6', color: '#fff',
						display: 'grid', placeItems: 'center',
						font: '700 9px var(--bf-mono)', flexShrink: 0,
					}}>
						{o.rider.riderId.slice(-2).toUpperCase()}
					</div>
					<span style={{ font: '600 11.5px var(--bf-font)', color: '#5B21B6' }}>
						Rider {o.rider.riderId}
					</span>
				</div>
			)}
		</div>
	)
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<div style={{ background: 'var(--bf-paper)', borderRadius: 14, padding: 14, border: '1px solid var(--bf-line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<Skeleton h={11} w={80} />
				<Skeleton h={11} w={60} />
			</div>
			<Skeleton h={14} w='80%' />
			<Skeleton h={11} w='60%' />
			<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
				<Skeleton h={11} w={60} />
				<Skeleton h={14} w={70} />
			</div>
		</div>
	)
}

// ─── Main orders view ─────────────────────────────────────────────────────────
export function AdminOrders() {
	const { data: orders, isLoading, error, mutate } = useOrders()
	const [actionLoading, setActionLoading] = useState<number | null>(null)
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

	const activeOrders = (orders ?? []).filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
	const deliveredCount = (orders ?? []).filter((o) => o.status === 'DELIVERED').length

	async function handleAction(orderId: number, status: string) {
		setActionLoading(orderId)
		try {
			await updateOrderStatus(orderId, status)
			mutate()
		} catch {
			console.error('Failed to update order', orderId)
		} finally {
			setActionLoading(null)
		}
	}

	return (
		<AdminShell active='orders'>
			<AdminTopbar
				title='Order pipeline'
				sub={
					isLoading
						? 'Loading…'
						: `${activeOrders.length} ACTIVE · ${deliveredCount} DELIVERED TODAY`
				}
			/>

			<div className='bf-admin-page'>
				{/* Scroll hint on mobile */}
				<p className='bf-pipeline-scroll-hint' style={{ display: 'none', fontSize: 11, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', marginBottom: 4 }}>
					← Swipe to see all columns →
				</p>

				{error ? (
					<div className='bf-card' style={{ padding: 40, textAlign: 'center' }}>
						<div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
						<p style={{ color: 'var(--bf-ink)', fontWeight: 700, marginBottom: 6 }}>Could not load orders</p>
						<p style={{ color: 'var(--bf-mute)', fontSize: 13, marginBottom: 16 }}>Check your connection or try again.</p>
						<button className='bf-btn bf-btn-outline bf-btn-sm' onClick={() => mutate()}>
							Retry
						</button>
					</div>
				) : (
					<div className='bf-admin-pipeline'>
						{PIPELINE_COLS.map((col) => {
							const colOrders = (orders ?? []).filter((o) => o.status === col.id)
							return (
								<div
									key={col.id}
									className='bf-admin-pipeline-col'
									style={{
										background: 'var(--bf-cream-2)',
										borderRadius: 16,
										padding: '12px 12px 16px',
										minHeight: 480,
										border: '1px solid var(--bf-line)',
									}}
								>
									{/* Column header */}
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 12px' }}>
										<div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
											<span className={`bf-dot ${col.dot}`} style={{ width: 8, height: 8 }} />
											<span style={{ font: '800 13px var(--bf-font)', color: 'var(--bf-ink)', letterSpacing: '-0.01em' }}>
												{col.title}
											</span>
										</div>
										<span
											style={{
												minWidth: 22,
												height: 22,
												borderRadius: 999,
												background: colOrders.length > 0 ? col.accent : 'transparent',
												color: colOrders.length > 0 ? col.accentText : 'var(--bf-mute)',
												font: '700 11px var(--bf-mono)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												padding: '0 6px',
											}}
										>
											{isLoading ? '…' : colOrders.length}
										</span>
									</div>

									{/* Cards */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
										{isLoading ? (
											Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
										) : colOrders.length === 0 ? (
											<div style={{
												padding: '40px 16px',
												textAlign: 'center',
												color: 'var(--bf-mute)',
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												gap: 8,
											}}>
												<div style={{ opacity: .35, fontSize: 28 }}>○</div>
												<span style={{ font: '500 12px var(--bf-font)' }}>No orders</span>
											</div>
										) : (
											colOrders.map((o, i) => (
												<OrderCard
													key={o.id}
													o={o}
													col={col.id}
													isFirst={i === 0}
													onAction={handleAction}
													actionLoading={actionLoading === o.id}
													onViewDetails={setSelectedOrder}
												/>
											))
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>

			{/* Order detail drawer */}
			{selectedOrder && (
				<OrderDetailDrawer
					order={selectedOrder}
					onClose={() => setSelectedOrder(null)}
					onUpdated={() => mutate()}
				/>
			)}
		</AdminShell>
	)
}
