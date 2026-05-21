'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Icons } from '../ui/icon'
import { Logo } from '../ui/logo'
import { useAdminAuthStore } from '../../lib/auth-store'
import { useOrders } from '../../lib/hooks'

// ─── Admin shell ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
	{ href: '/', id: 'dash', label: 'Dashboard' },
	{ href: '/orders', id: 'orders', label: 'Orders' },
	{ href: '/menu', id: 'menu', label: 'Menu' },
	{ href: '/deals', id: 'deals', label: 'Deals' },
	{ href: '/riders', id: 'riders', label: 'Riders' },
	{ href: '/reports', id: 'reports', label: 'Reports' },
]

const NAV_ICONS: Record<string, React.ReactNode> = {
	dash: Icons.grid,
	orders: Icons.receipt,
	menu: Icons.pkg,
	deals: Icons.pct,
	riders: Icons.bike,
	reports: Icons.trend,
}

export function AdminShell({
	children,
	active,
}: {
	children: React.ReactNode
	active?: string
}) {
	const pathname = usePathname()
	const router = useRouter()
	const { adminToken, isHydrated, hydrate, logout } = useAdminAuthStore()
	const { data: orders } = useOrders()

	useEffect(() => {
		hydrate()
	}, [hydrate])

	useEffect(() => {
		if (isHydrated && !adminToken) {
			router.push('/auth/login')
		}
	}, [isHydrated, adminToken, router])

	const newOrderCount =
		orders?.filter((o) => o.status === 'NEW').length ?? 0

	const activeId =
		active ||
		NAV_ITEMS.find(
			(n) =>
				n.href === pathname ||
				(n.href !== '/' && pathname.startsWith(n.href)),
		)?.id ||
		'dash'

	if (!isHydrated || !adminToken) {
		return (
			<div
				style={{
					minHeight: '100vh',
					display: 'grid',
					placeItems: 'center',
					background: 'var(--bf-cream)',
				}}
			>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
					<div className='bf-logo-dot' />
					<span
						style={{
							font: '700 13px var(--bf-mono)',
							color: 'var(--bf-mute)',
						}}
					>
						LOADING…
					</span>
				</div>
			</div>
		)
	}

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: '220px 1fr',
				minHeight: '100vh',
				background: 'var(--bf-cream)',
			}}
		>
			<aside
				style={{
					background: 'var(--bf-ink)',
					color: '#fff',
					padding: '24px 16px',
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
					position: 'sticky',
					top: 0,
					height: '100vh',
				}}
			>
				<Logo mono tag='ADMIN' />
				<div
					style={{
						marginTop: 28,
						display: 'flex',
						flexDirection: 'column',
						gap: 2,
					}}
				>
					{NAV_ITEMS.map((n) => {
						const badge = n.id === 'orders' ? newOrderCount : 0
						return (
							<Link
								key={n.id}
								href={n.href}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									padding: '10px 12px',
									borderRadius: 8,
									background:
										activeId === n.id
											? 'rgba(255,255,255,.08)'
											: 'transparent',
									color:
										activeId === n.id ? '#fff' : 'rgba(255,255,255,.62)',
									font: '600 13px var(--bf-font)',
									textDecoration: 'none',
									boxShadow:
										activeId === n.id
											? 'inset 2px 0 0 var(--bf-ember)'
											: 'none',
								}}
							>
								{NAV_ICONS[n.id]}
								<span style={{ flex: 1 }}>{n.label}</span>
								{badge > 0 && (
									<span
										style={{
											background: 'var(--bf-ember)',
											color: '#fff',
											font: '700 10px var(--bf-mono)',
											padding: '2px 6px',
											borderRadius: 999,
										}}
									>
										{badge}
									</span>
								)}
							</Link>
						)
					})}
				</div>
				<div style={{ flex: 1 }} />
				<div
					style={{
						padding: 12,
						borderRadius: 8,
						background: 'rgba(255,255,255,.06)',
						display: 'flex',
						gap: 10,
						alignItems: 'center',
					}}
				>
					<div
						style={{
							width: 36,
							height: 36,
							borderRadius: '50%',
							background: 'var(--bf-amber)',
							color: 'var(--bf-ink)',
							display: 'grid',
							placeItems: 'center',
							font: '800 14px var(--bf-font)',
							flexShrink: 0,
						}}
					>
						A
					</div>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div style={{ font: '700 13px var(--bf-font)', color: '#fff' }}>
							Admin
						</div>
						<div
							className='bf-mono'
							style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}
						>
							OWNER
						</div>
					</div>
					<button
						onClick={logout}
						className='bf-btn bf-btn-ghost bf-btn-icon'
						style={{
							color: 'rgba(255,255,255,.45)',
							width: 28,
							height: 28,
						}}
						title='Sign out'
					>
						{Icons.chevDown}
					</button>
				</div>
			</aside>
			<main
				style={{ overflow: 'auto', minHeight: '100vh' }}
				className='bf-scroll'
			>
				{children}
			</main>
		</div>
	)
}
