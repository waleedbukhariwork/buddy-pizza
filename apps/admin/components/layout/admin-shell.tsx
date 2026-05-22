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

// All nav items shown on mobile bottom nav
const MOBILE_NAV_ITEMS = NAV_ITEMS

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
		<div className='bf-admin-layout'>
			{/* ── Sidebar (desktop/tablet) ── */}
			<aside className='bf-admin-sidebar'>
				<Logo mono tag='ADMIN' />

				{/* Nav items */}
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
						const isActive = activeId === n.id
						return (
							<Link
								key={n.id}
								href={n.href}
								title={n.label}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									padding: '10px 12px',
									borderRadius: 8,
									background: isActive
										? 'rgba(255,255,255,.08)'
										: 'transparent',
									color: isActive ? '#fff' : 'rgba(255,255,255,.62)',
									font: '600 13px var(--bf-font)',
									textDecoration: 'none',
									boxShadow: isActive
										? 'inset 2px 0 0 var(--bf-ember)'
										: 'none',
									justifyContent: 'flex-start',
								}}
							>
								{NAV_ICONS[n.id]}
								<span className='bf-admin-sidebar-label'>{n.label}</span>
								{badge > 0 && (
									<span className='bf-admin-sidebar-badge'>{badge}</span>
								)}
							</Link>
						)
					})}
				</div>

				<div style={{ flex: 1 }} />

				{/* User footer */}
				<div className='bf-admin-sidebar-user'>
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
					<div className='bf-admin-sidebar-user-info' style={{ flex: 1, minWidth: 0 }}>
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
						className='bf-btn bf-btn-ghost bf-btn-icon bf-admin-sidebar-logout'
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

			{/* ── Main content ── */}
			<main
				style={{ overflow: 'auto', minHeight: '100vh' }}
				className='bf-scroll'
			>
				{children}
			</main>

			{/* ── Mobile bottom navigation ── */}
			<nav className='bf-admin-bottom-nav'>
				{MOBILE_NAV_ITEMS.map((n) => {
					const isActive = activeId === n.id
					const badge = n.id === 'orders' ? newOrderCount : 0
					return (
						<Link
							key={n.id}
							href={n.href}
							className={`bf-admin-mobile-tab${isActive ? ' active' : ''}`}
						>
							<span style={{ position: 'relative', display: 'flex' }}>
								{NAV_ICONS[n.id]}
								{badge > 0 && (
									<span
										style={{
											position: 'absolute',
											top: -5,
											right: -8,
											background: 'var(--bf-ember)',
											color: '#fff',
											fontSize: 9,
											fontWeight: 700,
											minWidth: 15,
											height: 15,
											borderRadius: 999,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											padding: '0 3px',
											border: '1.5px solid var(--bf-ink)',
											fontFamily: 'var(--bf-mono)',
										}}
									>
										{badge}
									</span>
								)}
							</span>
							<span className='bf-admin-mobile-tab-label'>{n.label}</span>
						</Link>
					)
				})}
			</nav>
		</div>
	)
}
