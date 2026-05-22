'use client'
import React, { useState } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Icons } from '../ui/icon'
import { Skeleton } from '../ui/skeleton'
import { useOrders, updateOrderStatus, rs, timeAgo, shortAddress } from '../../lib/hooks'
import type { Order } from '../../lib/types'

// ─── ORDER PIPELINE ───────────────────────────────────────────────────────────
const PIPELINE_COLS = [
	{ id: 'NEW', title: 'New', dot: 'bf-dot-new' },
	{ id: 'PREPARING', title: 'Preparing', dot: 'bf-dot-prep' },
	{ id: 'READY', title: 'Ready', dot: 'bf-dot-ready' },
	{ id: 'WITH_RIDER', title: 'With rider', dot: 'bf-dot-rider' },
] as const

function OrderCard({
	o,
	col,
	accent,
	onAction,
	actionLoading,
}: {
	o: Order
	col: string
	accent?: boolean
	onAction: (id: number, status: string) => void
	actionLoading: boolean
}) {
	return (
		<div
			style={{
				background: 'var(--bf-paper)',
				borderRadius: 12,
				padding: 12,
				boxShadow: 'var(--bf-shadow-sm)',
				border:
					'1px solid ' + (accent ? 'var(--bf-ember)' : 'var(--bf-line)'),
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<span
					className='bf-mono'
					style={{ font: '700 12px var(--bf-mono)' }}
				>
					{o.orderNumber ?? `#${o.id}`}
				</span>
				<span
					className='bf-mono'
					style={{ fontSize: 10.5, color: 'var(--bf-mute)' }}
				>
					{timeAgo(o.createdAt)}
				</span>
			</div>
			<div style={{ font: '800 14px var(--bf-font)', marginTop: 6 }}>
				{o.user?.name ?? o.customerPhone ?? '—'}
			</div>
			<div
				style={{
					fontSize: 11.5,
					color: 'var(--bf-ink-2)',
					marginTop: 1,
					display: 'flex',
					gap: 4,
					alignItems: 'center',
				}}
			>
				<span style={{ width: 12, color: 'var(--bf-mute)' }}>
					{Icons.pin}
				</span>
				{shortAddress(o.deliveryAddress)}
			</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginTop: 10,
				}}
			>
				<span
					className='bf-mono'
					style={{ fontSize: 10.5, color: 'var(--bf-mute)' }}
				>
					{o.items?.length ?? 0} ITEMS
				</span>
				<span
					style={{ fontWeight: 800, fontSize: 14 }}
					className='bf-tabular'
				>
					{rs(o.total ?? 0)}
				</span>
			</div>

			{col === 'NEW' && (
				<button
					className='bf-btn bf-btn-primary bf-btn-sm'
					disabled={actionLoading}
					onClick={() => onAction(o.id, 'PREPARING')}
					style={{
						width: '100%',
						marginTop: 10,
						justifyContent: 'space-between',
						opacity: actionLoading ? 0.6 : 1,
					}}
				>
					<span>{actionLoading ? 'Accepting…' : 'Accept order'}</span>
					{Icons.arrow}
				</button>
			)}

			{col === 'PREPARING' && (
				<button
					className='bf-btn bf-btn-ink bf-btn-sm'
					disabled={actionLoading}
					onClick={() => onAction(o.id, 'READY')}
					style={{
						width: '100%',
						marginTop: 10,
						justifyContent: 'space-between',
						opacity: actionLoading ? 0.6 : 1,
					}}
				>
					<span>
						{actionLoading ? 'Updating…' : 'Mark ready'}
					</span>
					{Icons.arrow}
				</button>
			)}

			{col === 'READY' && (
				<button
					className='bf-btn bf-btn-ink bf-btn-sm'
					disabled={actionLoading}
					onClick={() => onAction(o.id, 'WITH_RIDER')}
					style={{
						width: '100%',
						marginTop: 10,
						justifyContent: 'space-between',
						opacity: actionLoading ? 0.6 : 1,
					}}
				>
					<span>{actionLoading ? 'Assigning…' : `${Icons.bike} Assign rider`}</span>
					{Icons.arrow}
				</button>
			)}

			{col === 'WITH_RIDER' && (
				<div
					style={{
						marginTop: 10,
						display: 'flex',
						gap: 8,
						padding: '6px 10px',
						borderRadius: 8,
						background: 'var(--bf-cream-2)',
						alignItems: 'center',
					}}
				>
					<div
						style={{
							width: 22,
							height: 22,
							borderRadius: '50%',
							background: '#8B5CF6',
							color: '#fff',
							display: 'grid',
							placeItems: 'center',
							font: '700 9px var(--bf-mono)',
							flexShrink: 0,
						}}
					>
						{o.rider
							? o.rider.riderId.slice(-2).toUpperCase()
							: 'R'}
					</div>
					<span style={{ font: '600 11.5px var(--bf-font)' }}>
						{o.rider ? `Rider ${o.rider.riderId}` : 'Out for delivery'}
					</span>
				</div>
			)}
		</div>
	)
}

export function AdminOrders() {
	const { data: orders, isLoading, error, mutate } = useOrders()
	const [actionLoading, setActionLoading] = useState<number | null>(null)

	const activeOrders = (orders ?? []).filter(
		(o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED',
	)
	const deliveredCount = (orders ?? []).filter(
		(o) => o.status === 'DELIVERED',
	).length

	async function handleAction(orderId: number, status: string) {
		setActionLoading(orderId)
		try {
			await updateOrderStatus(orderId, status)
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
				cta='New order'
			/>
			<div className='bf-admin-page'>
				{/* Hint on very small screens */}
				<p
					style={{
						display: 'none',
						fontSize: 11,
						color: 'var(--bf-mute)',
						marginBottom: 10,
						fontFamily: 'var(--bf-mono)',
					}}
					className='bf-pipeline-scroll-hint'
				>
					← Swipe to see all columns →
				</p>
				{error ? (
					<div className='bf-card' style={{ padding: 32, textAlign: 'center' }}>
						<p style={{ color: 'var(--bf-mute)', fontSize: 13, marginBottom: 12 }}>
							Could not load orders
						</p>
						<button className='bf-btn bf-btn-outline bf-btn-sm' onClick={() => mutate()}>
							Retry
						</button>
					</div>
				) : (
					<div className='bf-admin-pipeline'>
						{PIPELINE_COLS.map((col) => {
							const colOrders = (orders ?? []).filter(
								(o) => o.status === col.id,
							)
							return (
								<div
									key={col.id}
									className='bf-admin-pipeline-col'
									style={{
										background: 'var(--bf-cream-2)',
										borderRadius: 14,
										padding: 12,
										minHeight: 460,
									}}
								>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											padding: '4px 4px 10px',
										}}
									>
										<div
											style={{
												display: 'flex',
												gap: 8,
												alignItems: 'center',
											}}
										>
											<span className={`bf-dot ${col.dot}`} />
											<span
												style={{ font: '800 13px var(--bf-font)' }}
											>
												{col.title}
											</span>
											<span
												className='bf-mono'
												style={{
													fontSize: 11,
													color: 'var(--bf-mute)',
												}}
											>
												{isLoading ? '…' : colOrders.length}
											</span>
										</div>
									</div>

									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: 8,
										}}
									>
										{isLoading ? (
											Array.from({ length: 2 }).map((_, i) => (
												<div
													key={i}
													style={{
														background: 'var(--bf-paper)',
														borderRadius: 12,
														padding: 12,
														border: '1px solid var(--bf-line)',
														display: 'flex',
														flexDirection: 'column',
														gap: 8,
													}}
												>
													<div
														style={{
															display: 'flex',
															justifyContent: 'space-between',
														}}
													>
														<Skeleton h={11} w={80} />
														<Skeleton h={11} w={60} />
													</div>
													<Skeleton h={14} w='80%' />
													<Skeleton h={11} w='60%' />
													<div
														style={{
															display: 'flex',
															justifyContent: 'space-between',
															marginTop: 4,
														}}
													>
														<Skeleton h={11} w={60} />
														<Skeleton h={11} w={70} />
													</div>
												</div>
											))
										) : colOrders.length === 0 ? (
											<div
												style={{
													padding: '32px 12px',
													textAlign: 'center',
													color: 'var(--bf-mute)',
													font: '500 12px var(--bf-font)',
												}}
											>
												No orders
											</div>
										) : (
											colOrders.map((o, i) => (
												<OrderCard
													key={o.id}
													o={o}
													col={col.id}
													accent={i === 0 && col.id === 'NEW'}
													onAction={handleAction}
													actionLoading={actionLoading === o.id}
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
		</AdminShell>
	)
}
