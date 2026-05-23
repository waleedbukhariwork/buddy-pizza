'use client'
import React from 'react'
import Link from 'next/link'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { Metric } from '../ui/metric'
import { Sparkline } from '../ui/sparkline'
import { StatusPill } from '../ui/status-pill'
import { Icons } from '../ui/icon'
import { Skeleton } from '../ui/skeleton'
import {
	useDashboardMetrics,
	useOrders,
	useDeals,
	rs,
	shortAddress,
	topItems,
} from '../../lib/hooks'

function ErrorState({
	message,
	onRetry,
}: {
	message: string
	onRetry: () => void
}) {
	return (
		<div
			style={{
				padding: '24px',
				textAlign: 'center',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 10,
			}}
		>
			<span style={{ fontSize: 13, color: 'var(--bf-mute)' }}>{message}</span>
			<button className='bf-btn bf-btn-outline bf-btn-sm' onClick={onRetry}>
				Retry
			</button>
		</div>
	)
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export function AdminDashboard() {
	const {
		data: metrics,
		isLoading: metricsLoading,
		error: metricsError,
		mutate: retryMetrics,
	} = useDashboardMetrics()
	const {
		data: orders,
		isLoading: ordersLoading,
		error: ordersError,
		mutate: retryOrders,
	} = useOrders()
	const { data: deals, isLoading: dealsLoading } = useDeals()

	const liveOrders = (orders ?? [])
		.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
		.slice(0, 5)

	const activeDeals = (deals ?? []).filter((d) => d.isActive).slice(0, 3)

	const items = topItems(orders ?? [])
	const maxCount = items[0]?.count ?? 1

	const activeCount =
		orders?.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
			.length ?? 0
	const deliveredCount =
		orders?.filter((o) => o.status === 'DELIVERED').length ?? 0

	return (
		<AdminShell active='dash'>
			<AdminTopbar
				title='Dashboard'
				sub={
					ordersLoading
						? 'Loading…'
						: `${activeCount} ACTIVE · ${deliveredCount} DELIVERED TODAY`
				}
			/>
			<div className='bf-admin-page'>
				{/* Metrics */}
				<div className='bf-admin-metrics-grid'>
					{metricsLoading ? (
						Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className='bf-card' style={{ padding: 18 }}>
								<Skeleton h={14} w='60%' style={{ marginBottom: 10 }} />
								<Skeleton h={28} w='80%' style={{ marginBottom: 8 }} />
								<Skeleton h={10} w='50%' />
							</div>
						))
					) : metricsError ? (
						<div
							className='bf-card'
							style={{
								padding: 18,
								gridColumn: '1 / -1',
								textAlign: 'center',
							}}
						>
							<ErrorState
								message='Could not load metrics'
								onRetry={retryMetrics}
							/>
						</div>
					) : (
						<>
							<Metric
								label='Active orders'
								value={String(metrics?.activeOrders ?? 0)}
								delta={`${activeCount} in pipeline`}
								deltaPositive
								accent='ember'
							>
								<Sparkline
									data={metrics?.sparklineData?.slice(0, 10) ?? []}
									w={140}
									h={40}
									color='var(--bf-amber)'
								/>
							</Metric>
							<Metric
								label='Sales today'
								value={rs(metrics?.salesToday ?? 0)}
								delta='Live total'
								deltaPositive
							>
								<Sparkline
									data={metrics?.sparklineData ?? []}
									w={140}
									h={40}
									color='var(--bf-leaf)'
								/>
							</Metric>
							<Metric
								label='Avg. order'
								value={rs(Math.round(metrics?.avgOrderValue ?? 0))}
								delta='All-time average'
							/>
							<Metric
								label='Delivered'
								value={String(metrics?.deliveredToday ?? 0)}
								delta={`${activeDeals.length} active promos`}
							>
								<div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
									{Array.from({ length: 6 }).map((_, i) => (
										<span
											key={i}
											style={{
												flex: 1,
												height: 6,
												borderRadius: 3,
												background: 'var(--bf-amber)',
												opacity: i < Math.min(activeDeals.length, 6) ? 1 : 0.25,
											}}
										/>
									))}
								</div>
							</Metric>
						</>
					)}
				</div>

				{/* Live orders + side cards */}
				<div className='bf-admin-dash-2col'>
					<div className='bf-card' style={{ padding: 22 }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'baseline',
								marginBottom: 16,
							}}
						>
							<h2 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>
								Live orders
							</h2>
							<div style={{ display: 'flex', gap: 6 }}>
								<Link href='/orders' className='bf-btn bf-btn-ink bf-btn-sm'>
									View pipeline {Icons.arrow}
								</Link>
							</div>
						</div>

						{/* Table — scrollable on small screens */}
						<div className='bf-admin-table-scroll'>
							<div className='bf-admin-table-min'>
								{/* Table header */}
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '110px 1fr 1fr 80px 120px 80px',
										gap: 12,
										font: '600 10.5px var(--bf-mono)',
										color: 'var(--bf-mute)',
										letterSpacing: '.08em',
										textTransform: 'uppercase',
										padding: '0 8px 10px',
										borderBottom: '1px solid var(--bf-line)',
									}}
								>
									<span>ORDER</span>
									<span>CUSTOMER</span>
									<span>AREA</span>
									<span>ITEMS</span>
									<span>STATUS</span>
									<span style={{ textAlign: 'right' }}>TOTAL</span>
								</div>

								{ordersLoading ? (
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: 12,
											padding: '14px 8px',
										}}
									>
										{Array.from({ length: 4 }).map((_, i) => (
											<div
												key={i}
												style={{
													display: 'grid',
													gridTemplateColumns: '110px 1fr 1fr 80px 120px 80px',
													gap: 12,
													alignItems: 'center',
												}}
											>
												<Skeleton h={12} />
												<Skeleton h={12} />
												<Skeleton h={12} />
												<Skeleton h={12} />
												<Skeleton h={20} r={999} />
												<Skeleton h={12} />
											</div>
										))}
									</div>
								) : ordersError ? (
									<ErrorState
										message='Could not load orders'
										onRetry={retryOrders}
									/>
								) : liveOrders.length === 0 ? (
									<div
										style={{
											padding: '32px 8px',
											textAlign: 'center',
											color: 'var(--bf-mute)',
											fontSize: 13,
										}}
									>
										No active orders right now
									</div>
								) : (
									liveOrders.map((o, i) => (
										<div
											key={o.id}
											style={{
												display: 'grid',
												gridTemplateColumns: '110px 1fr 1fr 80px 120px 80px',
												gap: 12,
												padding: '14px 8px',
												borderBottom:
													i < liveOrders.length - 1
														? '1px solid var(--bf-line)'
														: 'none',
												alignItems: 'center',
												font: '500 13px var(--bf-font)',
											}}
										>
											<span className='bf-mono' style={{ fontWeight: 700 }}>
												{o.orderNumber ?? `#${o.id}`}
											</span>
											<span style={{ fontWeight: 600 }}>
												{o.user?.name ?? o.customerPhone ?? '—'}
											</span>
											<span style={{ color: 'var(--bf-ink-2)' }}>
												{shortAddress(o.deliveryAddress)}
											</span>
											<span className='bf-mono'>
												{o.items?.length ?? 0} items
											</span>
											<StatusPill status={o.status} />
											<span
												className='bf-tabular'
												style={{ textAlign: 'right', fontWeight: 700 }}
											>
												{rs(o.total ?? 0)}
											</span>
										</div>
									))
								)}
							</div>
						</div>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
						{/* Top items */}
						<div className='bf-card' style={{ padding: 22 }}>
							<h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 14px' }}>
								Top items today
							</h3>
							{ordersLoading ? (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 10,
									}}
								>
									{Array.from({ length: 5 }).map((_, i) => (
										<div
											key={i}
											style={{
												display: 'flex',
												flexDirection: 'column',
												gap: 5,
											}}
										>
											<Skeleton h={11} w='70%' />
											<Skeleton h={5} r={3} />
										</div>
									))}
								</div>
							) : items.length === 0 ? (
								<p
									style={{
										fontSize: 13,
										color: 'var(--bf-mute)',
										textAlign: 'center',
										padding: '12px 0',
									}}
								>
									No orders yet today
								</p>
							) : (
								items.map((t, i) => (
									<div key={i} style={{ marginBottom: 10 }}>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												font: '600 12.5px var(--bf-font)',
												marginBottom: 4,
											}}
										>
											<span>{t.name}</span>
											<span
												className='bf-mono'
												style={{ color: 'var(--bf-mute)' }}
											>
												{t.count}
											</span>
										</div>
										<div
											style={{
												height: 5,
												background: 'var(--bf-line)',
												borderRadius: 3,
											}}
										>
											<div
												style={{
													width: Math.round((t.count / maxCount) * 100) + '%',
													height: '100%',
													borderRadius: 3,
													background: 'var(--bf-ember)',
												}}
											/>
										</div>
									</div>
								))
							)}
						</div>

						{/* Active promos */}
						<div className='bf-card' style={{ padding: 22 }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'baseline',
									marginBottom: 10,
								}}
							>
								<h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
									Active promos
								</h3>
								<Link
									href='/deals'
									className='bf-mono'
									style={{ fontSize: 11, color: 'var(--bf-ink-2)' }}
								>
									Manage →
								</Link>
							</div>

							{dealsLoading ? (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 10,
									}}
								>
									{Array.from({ length: 3 }).map((_, i) => (
										<div
											key={i}
											style={{
												display: 'flex',
												gap: 8,
												alignItems: 'center',
												padding: '8px 0',
											}}
										>
											<Skeleton h={12} w={60} r={999} />
											<Skeleton h={12} />
										</div>
									))}
								</div>
							) : activeDeals.length === 0 ? (
								<p
									style={{
										fontSize: 13,
										color: 'var(--bf-mute)',
										textAlign: 'center',
										padding: '12px 0',
									}}
								>
									No active promos
								</p>
							) : (
								activeDeals.map((p, i) => (
									<div
										key={p.id}
										style={{
											padding: '10px 0',
											borderTop: i > 0 ? '1px solid var(--bf-line)' : 'none',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<div>
											<div
												style={{
													display: 'flex',
													gap: 6,
													alignItems: 'center',
												}}
											>
												{p.tag && (
													<span className='bf-pill bf-pill-amber'>{p.tag}</span>
												)}
												<span style={{ font: '600 13px var(--bf-font)' }}>
													{p.title}
												</span>
											</div>
											{p.description && (
												<div
													className='bf-mono'
													style={{
														fontSize: 10.5,
														color: 'var(--bf-mute)',
														marginTop: 3,
													}}
												>
													{p.description}
												</div>
											)}
										</div>
										<Link
											href='/deals'
											className='bf-btn bf-btn-ghost bf-btn-icon'
										>
											{Icons.settings}
										</Link>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</AdminShell>
	)
}
