'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '../ui/logo'
import { Icons } from '../ui/icon'
import { CartDrawer } from '../cart/cart-drawer'
import { DeliveryChip } from './delivery-chip'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'
import { rs } from '../../lib/hooks'
import type { User } from '@shared/index'

function AvatarBadge({ name, size = 30 }: { name: string; size?: number }) {
	const initials = name
		.trim()
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join('')
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				background: 'var(--bf-ember)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
				fontSize: size * 0.38,
				fontWeight: 900,
				color: '#fff',
				letterSpacing: '-0.02em',
				lineHeight: 1,
			}}
		>
			{initials || '?'}
		</div>
	)
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)
	const close = useCallback(() => setOpen(false), [])

	useEffect(() => {
		if (!open) return
		function onPointerDown(e: PointerEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) close()
		}
		document.addEventListener('pointerdown', onPointerDown)
		return () => document.removeEventListener('pointerdown', onPointerDown)
	}, [open, close])

	useEffect(() => {
		if (!open) return
		function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, close])

	const firstName = user.name?.split(' ')[0] ?? 'Account'

	return (
		<div ref={ref} style={{ position: 'relative' }}>
			<button
				type='button'
				onClick={() => setOpen((v) => !v)}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					padding: '5px 10px 5px 5px',
					border: `1.5px solid ${open ? 'var(--bf-ink)' : 'var(--bf-line-2)'}`,
					borderRadius: 999,
					background: open ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
					cursor: 'pointer',
					transition: 'border-color .15s, background .15s, box-shadow .15s',
					boxShadow: open ? '0 0 0 3px rgba(35,31,32,.07)' : 'none',
					fontFamily: 'var(--bf-font)',
				}}
			>
				<AvatarBadge name={user.name || '?'} size={28} />
				<span style={{ fontSize: 13, fontWeight: 700, color: 'var(--bf-ink)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
					{firstName}
				</span>
				<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='var(--bf-mute)' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round' style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }}>
					<path d='M6 9l6 6 6-6' />
				</svg>
			</button>
			{open && (
				<div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 228, background: 'var(--bf-paper)', borderRadius: 16, boxShadow: '0 8px 32px rgba(35,31,32,.16)', border: '1px solid var(--bf-line)', overflow: 'hidden', zIndex: 50, animation: 'bf-dropdown-in .18s cubic-bezier(.34,1.56,.64,1) both' }}>
					<div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
						<AvatarBadge name={user.name || '?'} size={40} />
						<div style={{ minWidth: 0 }}>
							<div style={{ fontWeight: 800, fontSize: 14, color: 'var(--bf-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
							<div style={{ fontSize: 12, color: 'var(--bf-mute)', marginTop: 1 }}>{user.email || user.phone}</div>
						</div>
					</div>
					<div style={{ height: 1, background: 'var(--bf-line)', margin: '0 12px' }} />
					<div style={{ padding: '6px 0' }}>
						{[
							{ href: '/account/profile', label: 'My Profile', icon: Icons.user },
							{ href: '/account/orders', label: 'My Orders', icon: Icons.receipt },
						].map((item) => (
							<Link key={item.href} href={item.href} onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, color: 'var(--bf-ink)' }} className='bf-dd-item'>
								<span style={{ color: 'var(--bf-ink-2)', display: 'flex' }}>{item.icon}</span>
								{item.label}
							</Link>
						))}
					</div>
					<div style={{ height: 1, background: 'var(--bf-line)', margin: '0 12px' }} />
					<div style={{ padding: '6px 0 8px' }}>
						<button type='button' onClick={() => { close(); onLogout() }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 16px', fontSize: 13.5, fontWeight: 700, color: 'var(--bf-ember)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--bf-font)' }} className='bf-dd-item-danger'>
							Sign out
						</button>
					</div>
				</div>
			)}
			<style>{`
				@keyframes bf-dropdown-in { from { opacity: 0; transform: scale(.94) translateY(-6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
				.bf-dd-item:hover { background: var(--bf-cream) !important; }
				.bf-dd-item-danger:hover { background: rgba(232,67,31,.06) !important; }
			`}</style>
		</div>
	)
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
	return (
		<Link href={href} style={{ font: '600 14px var(--bf-font)', color: active ? 'var(--bf-ink)' : 'var(--bf-ink-2)', textDecoration: 'none', padding: '6px 0', borderBottom: active ? '2px solid var(--bf-ember)' : '2px solid transparent' }}>
			{children}
		</Link>
	)
}

function BottomNav({ activePage, onCartOpen }: { activePage: string; onCartOpen: () => void }) {
	const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
	const prevCountRef = useRef(count)
	const [badgePop, setBadgePop] = useState(false)

	useEffect(() => {
		if (count > prevCountRef.current) {
			setBadgePop(false)
			requestAnimationFrame(() => setBadgePop(true))
			const t = setTimeout(() => setBadgePop(false), 950)
			return () => clearTimeout(t)
		}
		prevCountRef.current = count
	}, [count])

	return (
		<nav className='bf-bottom-nav'>
			<Link href='/' className={`bf-bottom-nav-tab${activePage === 'home' ? ' active' : ''}`}>
				<span className='bf-nav-icon'>{Icons.home}</span>
				<span className='bf-nav-label'>Home</span>
			</Link>
			<Link href='/menu' className={`bf-bottom-nav-tab${activePage === 'menu' ? ' active' : ''}`}>
				<span className='bf-nav-icon'>{Icons.grid}</span>
				<span className='bf-nav-label'>Menu</span>
			</Link>
			<button type='button' className='bf-bottom-nav-tab' onClick={onCartOpen}>
				<span className='bf-nav-icon'>
					{Icons.cart}
					{count > 0 && <span className={`bf-nav-badge${badgePop ? ' bf-nav-badge-pop' : ''}`}>{count}</span>}
				</span>
				<span className='bf-nav-label'>Cart</span>
			</button>
			<Link href='/account/profile' className={`bf-bottom-nav-tab${activePage === 'profile' || activePage === 'orders' ? ' active' : ''}`}>
				<span className='bf-nav-icon'>{Icons.user}</span>
				<span className='bf-nav-label'>Account</span>
			</Link>
		</nav>
	)
}

function CartBar({ onOpen }: { onOpen: () => void }) {
	const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
	const total = useCartStore((s) => s.total)
	const [visible, setVisible] = useState(false)
	const [animKey, setAnimKey] = useState(0)

	useEffect(() => {
		if (count > 0 && !visible) {
			setVisible(true)
			setAnimKey((k) => k + 1)
		} else if (count === 0) setVisible(false)
	}, [count, visible])

	if (!visible) return null

	return (
		<div className='bf-cart-bar'>
			<button key={animKey} type='button' className='bf-cart-bar-btn bf-cart-bar-enter' onClick={onOpen}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
					{Icons.cart}
					<span style={{ fontWeight: 700, fontSize: 14 }}>{count} {count === 1 ? 'item' : 'items'}</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--bf-mono)' }}>{rs(total)}</span>
					{Icons.arrow}
				</div>
			</button>
		</div>
	)
}

function ShellInner({ children, activePage = 'home' }: { children: React.ReactNode; activePage?: string }) {
	const count = useCartStore((s) => s.items.reduce((s, i) => s + i.quantity, 0))
	const prevCountRef = useRef(count)
	const [badgePop, setBadgePop] = useState(false)

	useEffect(() => {
		if (count > prevCountRef.current) {
			setBadgePop(false)
			requestAnimationFrame(() => setBadgePop(true))
			const t = setTimeout(() => setBadgePop(false), 950)
			return () => clearTimeout(t)
		}
		prevCountRef.current = count
	}, [count])

	const [cartOpen, setCartOpen] = useState(false)
	const router = useRouter()
	const { user, hydrate, logout } = useAuthStore()

	const [headerScrolled, setHeaderScrolled] = useState(false)

	function handleLogout() {
		logout()
		router.push('/')
	}

	useEffect(() => { hydrate() }, [hydrate])

	useEffect(() => {
		function onScroll() {
			setHeaderScrolled(window.scrollY > 20)
		}
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	return (
		<div className='bf-shell-wrap' style={{ minHeight: '100vh', background: 'var(--bf-cream)', display: 'flex', flexDirection: 'column' }}>
			<header className={`bf-smart-header bf-header-desktop${headerScrolled ? ' bf-header-scrolled' : ''}`}>
				<Logo size={22} />
				<nav className='bf-header-nav'>
					<NavLink href='/' active={activePage === 'home'}>Home</NavLink>
					<NavLink href='/menu' active={activePage === 'menu'}>Menu</NavLink>
					<NavLink href='/deals' active={activePage === 'deals'}>Deals</NavLink>
					<NavLink href='/account/orders' active={activePage === 'orders'}>Track order</NavLink>
				</nav>
				<div className='bf-header-right'>
					<div className='bf-delivery-wrap'>
						<DeliveryChip />
					</div>
					{user ? (
						<UserMenu user={user} onLogout={handleLogout} />
					) : (
						<Link className='bf-btn bf-btn-outline bf-btn-sm' href='/auth/login' style={{ display: 'flex', gap: 6 }}>
							{Icons.user} Sign in
						</Link>
					)}
					<button type='button' className='bf-btn bf-btn-primary bf-btn-sm' style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setCartOpen(true)}>
						<span style={{ position: 'relative', display: 'flex' }}>
							{Icons.cart}
							{count > 0 && <span className={`bf-nav-badge${badgePop ? ' bf-nav-badge-pop' : ''}`} style={{ top: -6, right: -8 }}>{count}</span>}
						</span>
						Cart
					</button>
				</div>
			</header>

			<header className={`bf-smart-header bf-header-mobile${headerScrolled ? ' bf-header-scrolled' : ''}`}>
				<Logo size={20} />
				<div className='bf-header-mobile-center'>
					<DeliveryChip compact />
				</div>
				<div className='bf-header-actions'>
					<button type='button' className='bf-btn bf-btn-primary bf-btn-sm bf-header-search-btn' onClick={() => setCartOpen(true)} aria-label='Cart'>
						<span style={{ position: 'relative', display: 'flex' }}>
							{Icons.cart}
							{count > 0 && <span className={`bf-nav-badge${badgePop ? ' bf-nav-badge-pop' : ''}`} style={{ top: -6, right: -6 }}>{count}</span>}
						</span>
					</button>
				</div>
			</header>

			<div style={{ flex: 1 }}>{children}</div>

			<CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
			<CartBar onOpen={() => setCartOpen(true)} />
			<BottomNav activePage={activePage} onCartOpen={() => setCartOpen(true)} />

			<section className='bf-footer-trust'>
				<div className='bf-footer-trust-grid'>
					{[
						{ k: '30 min', v: "Hot-out-of-oven delivery, or it's on us." },
						{ k: 'One kitchen', v: 'No marketplace. We cook, we deliver.' },
						{ k: 'COD', v: 'Pay cash on delivery. Card support coming soon.' },
						{ k: 'Real photos', v: 'What you see is what shows up at your door.' },
					].map((t, i) => (
						<div key={i}>
							<div style={{ fontWeight: 800, fontSize: 28, color: 'var(--bf-amber)', letterSpacing: '-0.022em' }}>{t.k}</div>
							<div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginTop: 6 }}>{t.v}</div>
						</div>
					))}
				</div>
			</section>
			<footer className='bf-footer-bar'>
				<Logo size={18} />
				<div className='bf-footer-links'>
					<span>About</span>
					<span>Help</span>
					<span>Privacy</span>
				</div>
				<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)' }}>© 2026 BUDDY FEAST · LAHORE</div>
			</footer>
		</div>
	)
}

function CustomerShell(props: { children: React.ReactNode; activePage?: string }) {
	return <ShellInner {...props} />
}

export { CustomerShell }
