'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icons } from '../ui/icon'
import { useAdminAuthStore } from '../../lib/auth-store'
import { useAdminProfile } from '../../lib/hooks'

function UserMenu() {
	const { logout } = useAdminAuthStore()
	const { data: profile } = useAdminProfile()
	const router = useRouter()
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
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') close()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, close])

	function handleLogout() {
		logout()
		router.push('/auth/login')
	}

	const initial = (profile?.name || 'A').charAt(0).toUpperCase()

	return (
		<div ref={ref} style={{ position: 'relative' }}>
			<button
				onClick={() => setOpen((v) => !v)}
				className='bf-btn bf-btn-outline bf-btn-icon'
				style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, overflow: 'hidden', flexShrink: 0 }}
				title='Account'
			>
				{profile?.avatarUrl ? (
					<img src={profile.avatarUrl} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
				) : (
					<span style={{ fontWeight: 800, fontSize: 13, color: 'var(--bf-ink)' }}>{initial}</span>
				)}
			</button>
			{open && (
				<div
					style={{
						position: 'absolute', top: 'calc(100% + 8px)', right: 0,
						width: 200, background: 'var(--bf-paper)',
						borderRadius: 14, boxShadow: '0 8px 32px rgba(35,31,32,.16)',
						border: '1px solid var(--bf-line)', overflow: 'hidden',
						zIndex: 100, animation: 'bf-dropdown-in .18s cubic-bezier(.34,1.56,.64,1) both',
					}}
				>
					<div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bf-line)' }}>
						<div style={{ fontWeight: 700, fontSize: 13, color: 'var(--bf-ink)' }}>{profile?.name || 'Admin'}</div>
						<div style={{ fontSize: 11.5, color: 'var(--bf-mute)', marginTop: 2 }}>{profile?.email}</div>
					</div>
					<Link href='/account' onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--bf-ink)', textDecoration: 'none' }} className='bf-dd-item'>
						<span style={{ color: 'var(--bf-ink-2)', display: 'flex' }}>{Icons.user}</span>
						My Account
					</Link>
					<div style={{ borderTop: '1px solid var(--bf-line)' }}>
						<button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 700, color: 'var(--bf-ember)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'var(--bf-font)' }} className='bf-dd-item-danger'>
							<span style={{ display: 'flex' }}>{Icons.logout}</span>
							Sign out
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export function AdminTopbar({
	title,
	sub,
	cta,
	onCta,
}: {
	title: string
	sub: string
	cta?: string
	onCta?: () => void
}) {
	return (
		<div className='bf-admin-topbar'>
			<div style={{ minWidth: 0 }}>
				<div className='bf-eyebrow bf-admin-topbar-sub' style={{ marginBottom: 3 }}>{sub}</div>
				<h1 className='bf-admin-topbar-title'>{title}</h1>
			</div>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
				<div className='bf-admin-topbar-search' style={{ position: 'relative' }}>
					<input
						className='bf-input'
						placeholder='Search…'
						style={{ paddingLeft: 36, height: 38 }}
					/>
					<span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--bf-mute)', pointerEvents: 'none' }}>
						{Icons.search}
					</span>
				</div>
				<button
					className='bf-btn bf-btn-outline bf-btn-icon bf-admin-topbar-bell'
					style={{ position: 'relative', flexShrink: 0 }}
				>
					{Icons.bell}
					<span style={{
						position: 'absolute', top: 7, right: 8,
						width: 7, height: 7, borderRadius: '50%',
						background: 'var(--bf-ember)',
						border: '1.5px solid var(--bf-paper)',
					}} />
				</button>
				<UserMenu />
				{cta && (
					<button
						className='bf-btn bf-btn-primary bf-btn-md bf-admin-topbar-cta'
						onClick={onCta}
						style={{ flexShrink: 0 }}
					>
						{Icons.plus}
						<span className='bf-admin-topbar-cta-label'>{cta}</span>
					</button>
				)}
			</div>
		</div>
	)
}
