'use client'
import React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { Logo } from '../ui/logo'
import { Icons } from '../ui/icon'
import { CartDrawer } from '../cart/cart-drawer'
import { useCartStore } from '../../lib/cart-store'

// ─── Nav Link ────────────────────────────────────────────────────────────────
function NavLink({
	href,
	active,
	children,
}: {
	href: string
	active?: boolean
	children: React.ReactNode
}) {
	return (
		<Link
			href={href}
			style={{
				font: '600 14px var(--bf-font)',
				color: active ? 'var(--bf-ink)' : 'var(--bf-ink-2)',
				textDecoration: 'none',
				padding: '6px 0',
				borderBottom: active
					? '2px solid var(--bf-ember)'
					: '2px solid transparent',
			}}
		>
			{children}
		</Link>
	)
}

// ─── Customer shell ───────────────────────────────────────────────────────────
function CustomerShell({
	children,
	activePage = 'home',
}: {
	children: React.ReactNode
	activePage?: string
}) {
	const items = useCartStore((s) => s.items)
	const count = items.reduce((s, i) => s + i.quantity, 0)
	const [cartOpen, setCartOpen] = useState(false)

	return (
		<div style={{ minHeight: '100vh', background: 'var(--bf-cream)' }}>
			<header
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '18px 56px',
					borderBottom: '1px solid var(--bf-line)',
					background: 'var(--bf-cream)',
					position: 'sticky',
					top: 0,
					zIndex: 20,
				}}
			>
				<Logo size={22} />
				<nav style={{ display: 'flex', gap: 28 }}>
					<NavLink href='/' active={activePage === 'home'}>
						Home
					</NavLink>
					<NavLink href='/menu' active={activePage === 'menu'}>
						Menu
					</NavLink>
					<NavLink href='/#deals' active={false}>
						Deals
					</NavLink>
					<NavLink href='/account/orders' active={activePage === 'orders'}>
						Track order
					</NavLink>
				</nav>
				<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
					<button
						className='bf-btn bf-btn-ghost bf-btn-sm'
						style={{ display: 'flex', gap: 6 }}
					>
						{Icons.pin} <span style={{ fontWeight: 600 }}>DHA Phase 5</span>
					</button>
					<Link
						className='bf-btn bf-btn-outline bf-btn-sm'
						href='/auth/login'
						style={{ display: 'flex', gap: 6 }}
					>
						{Icons.user} Sign in
					</Link>
					<button
						className='bf-btn bf-btn-primary bf-btn-sm'
						style={{ display: 'flex', gap: 6 }}
						onClick={() => setCartOpen(true)}
					>
						{Icons.cart} Cart · {count}
					</button>
				</div>
			</header>
			{children}
			<CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
			<section
				style={{
					padding: '40px 56px',
					background: 'var(--bf-ink)',
					color: '#fff',
				}}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: 24,
						maxWidth: 1280,
						margin: '0 auto',
					}}
				>
					{[
						{ k: '30 min', v: "Hot-out-of-oven delivery, or it's on us." },
						{ k: 'One kitchen', v: 'No marketplace. We cook, we deliver.' },
						{
							k: 'COD or card',
							v: 'Pay how you like. Card support coming soon.',
						},
						{
							k: 'Real photos',
							v: 'What you see is what shows up at your door.',
						},
					].map((t, i) => (
						<div key={i}>
							<div
								style={{
									fontWeight: 800,
									fontSize: 28,
									color: 'var(--bf-amber)',
									letterSpacing: '-0.022em',
								}}
							>
								{t.k}
							</div>
							<div
								style={{
									fontSize: 14,
									color: 'rgba(255,255,255,.7)',
									marginTop: 6,
								}}
							>
								{t.v}
							</div>
						</div>
					))}
				</div>
			</section>
			<footer
				style={{
					padding: '32px 56px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					background: 'var(--bf-cream-2)',
				}}
			>
				<Logo size={18} />
				<div
					style={{
						display: 'flex',
						gap: 24,
						font: '500 13px var(--bf-font)',
						color: 'var(--bf-ink-2)',
					}}
				>
					<span>About</span>
					<span>Careers</span>
					<span>Help</span>
					<span>Privacy</span>
					<span>Terms</span>
				</div>
				<div
					className='bf-mono'
					style={{ fontSize: 11, color: 'var(--bf-mute)' }}
				>
					© 2026 BUDDY FEAST · LAHORE
				</div>
			</footer>
		</div>
	)
}

export { CustomerShell }
