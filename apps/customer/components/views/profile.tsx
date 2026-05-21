'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../lib/auth-store'
import { useMyProfile, updateProfile, changePassword } from '../../lib/hooks'
import { Icons } from '../ui/icon'

// ─── Initials avatar ──────────────────────────────────────────────────────────
function Avatar({ name, size = 72 }: { name: string; size?: number }) {
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
				boxShadow: '0 4px 16px rgba(232,67,31,.35)',
			}}
		>
			<span
				style={{
					color: '#fff',
					fontWeight: 900,
					fontSize: size * 0.36,
					letterSpacing: '-0.02em',
					lineHeight: 1,
					fontFamily: 'var(--bf-font)',
				}}
			>
				{initials || '?'}
			</span>
		</div>
	)
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({
	message,
	type,
	onDismiss,
}: {
	message: string
	type: 'success' | 'error'
	onDismiss: () => void
}) {
	useEffect(() => {
		const t = setTimeout(onDismiss, 3500)
		return () => clearTimeout(t)
	}, [onDismiss])

	return (
		<div
			style={{
				position: 'fixed',
				bottom: 96,
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 100,
				background: type === 'success' ? 'var(--bf-leaf)' : 'var(--bf-ember)',
				color: '#fff',
				padding: '12px 20px',
				borderRadius: 12,
				fontWeight: 700,
				fontSize: 14,
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				boxShadow: '0 8px 28px rgba(0,0,0,.22)',
				whiteSpace: 'nowrap',
				animation: 'bf-fade-up .3s ease both',
			}}
		>
			{type === 'success' ? (
				<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
					<path d='M4 12l5 5L20 6' />
				</svg>
			) : (
				<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
					<circle cx='12' cy='12' r='10' /><path d='M12 8v4M12 16h.01' />
				</svg>
			)}
			{message}
		</div>
	)
}

// ─── Logout confirmation modal ────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				background: 'rgba(35,31,32,.55)',
				backdropFilter: 'blur(3px)',
				zIndex: 80,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 20,
			}}
			onClick={onCancel}
		>
			<div
				style={{
					background: 'var(--bf-paper)',
					borderRadius: 20,
					padding: '32px 28px',
					maxWidth: 380,
					width: '100%',
					boxShadow: '0 24px 60px rgba(35,31,32,.22)',
					animation: 'bf-fade-up .25s ease both',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					style={{
						width: 52,
						height: 52,
						borderRadius: '50%',
						background: 'rgba(232,67,31,.1)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 18,
					}}
				>
					<svg width={24} height={24} viewBox='0 0 24 24' fill='none' stroke='var(--bf-ember)' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
						<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9' />
					</svg>
				</div>
				<h3 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.025em', marginBottom: 8 }}>
					Sign out?
				</h3>
				<p style={{ fontSize: 14, color: 'var(--bf-ink-2)', lineHeight: 1.6, marginBottom: 24 }}>
					You'll need to sign back in to track orders or check out faster.
				</p>
				<div style={{ display: 'flex', gap: 10 }}>
					<button
						className='bf-btn bf-btn-outline bf-btn-md'
						style={{ flex: 1 }}
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						className='bf-btn bf-btn-primary bf-btn-md'
						style={{ flex: 1 }}
						onClick={onConfirm}
					>
						Sign out
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Field row helper ─────────────────────────────────────────────────────────
function FieldRow({
	label,
	value,
	inputValue,
	onChange,
	editing,
	type = 'text',
	placeholder,
	icon,
	readOnly,
}: {
	label: string
	value: string
	inputValue: string
	onChange: (v: string) => void
	editing: boolean
	type?: string
	placeholder?: string
	icon?: React.ReactNode
	readOnly?: boolean
}) {
	return (
		<div>
			<label
				style={{
					display: 'block',
					fontSize: 11.5,
					fontWeight: 700,
					color: 'var(--bf-ink-2)',
					marginBottom: 6,
					letterSpacing: '-0.01em',
				}}
			>
				{label}
			</label>
			{editing && !readOnly ? (
				<div style={{ position: 'relative' }}>
					{icon && (
						<span
							style={{
								position: 'absolute',
								left: 14,
								top: '50%',
								transform: 'translateY(-50%)',
								color: 'var(--bf-mute)',
								display: 'flex',
								pointerEvents: 'none',
							}}
						>
							{icon}
						</span>
					)}
					<input
						className='bf-input'
						style={{ paddingLeft: icon ? 40 : undefined }}
						type={type}
						value={inputValue}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
					/>
				</div>
			) : (
				<div
					style={{
						fontSize: 15,
						fontWeight: 600,
						color: value ? 'var(--bf-ink)' : 'var(--bf-mute)',
						padding: '11px 0',
						borderBottom: '1px solid var(--bf-line)',
					}}
				>
					{value || <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{placeholder ?? 'Not set'}</span>}
				</div>
			)}
		</div>
	)
}

// ─── Eye toggle icon ──────────────────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
	return (
		<svg width={17} height={17} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round'>
			{visible ? (
				<>
					<path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
					<path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
					<line x1='1' y1='1' x2='23' y2='23' />
				</>
			) : (
				<>
					<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
					<circle cx='12' cy='12' r='3' />
				</>
			)}
		</svg>
	)
}

// ─── Profile view ─────────────────────────────────────────────────────────────
export function ProfileView() {
	const router = useRouter()
	const { user: storeUser, token, logout, setUser } = useAuthStore()
	const { data: profileData, mutate } = useMyProfile(!!token)

	const user = profileData ?? storeUser

	// personal info edit state
	const [editing, setEditing] = useState(false)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [address, setAddress] = useState('')
	const [saving, setSaving] = useState(false)

	// password change state
	const [pwOpen, setPwOpen] = useState(false)
	const [currentPw, setCurrentPw] = useState('')
	const [newPw, setNewPw] = useState('')
	const [confirmPw, setConfirmPw] = useState('')
	const [showCurrentPw, setShowCurrentPw] = useState(false)
	const [showNewPw, setShowNewPw] = useState(false)
	const [pwSaving, setPwSaving] = useState(false)
	const [pwError, setPwError] = useState<string | null>(null)

	// toast
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
	const showToast = useCallback((msg: string, type: 'success' | 'error') => {
		setToast({ msg, type })
	}, [])

	// logout confirmation
	const [logoutOpen, setLogoutOpen] = useState(false)

	// sync form when user loads
	useEffect(() => {
		if (user) {
			setName(user.name ?? '')
			setEmail(user.email ?? '')
			setAddress(user.address ?? '')
		}
	}, [user])

	function startEdit() {
		setName(user?.name ?? '')
		setEmail(user?.email ?? '')
		setAddress(user?.address ?? '')
		setEditing(true)
	}

	function cancelEdit() {
		setEditing(false)
	}

	async function saveProfile() {
		setSaving(true)
		try {
			const updated = await updateProfile({ name, email, address })
			if (updated) {
				setUser(updated)
				localStorage.setItem('user', JSON.stringify(updated))
				mutate(updated, false)
			}
			setEditing(false)
			showToast('Profile saved', 'success')
		} catch {
			showToast('Failed to save. Try again.', 'error')
		} finally {
			setSaving(false)
		}
	}

	async function submitPasswordChange() {
		setPwError(null)
		if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
		if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
		setPwSaving(true)
		try {
			await changePassword(currentPw, newPw)
			setCurrentPw(''); setNewPw(''); setConfirmPw('')
			setPwOpen(false)
			showToast('Password updated', 'success')
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				setPwError('Current password is incorrect.')
			} else {
				setPwError('Something went wrong. Try again.')
			}
		} finally {
			setPwSaving(false)
		}
	}

	function handleLogout() {
		logout()
		router.push('/')
	}

	// password strength
	type StrengthLevel = 0 | 1 | 2 | 3
	const STRENGTH_COLORS: Record<StrengthLevel, string> = { 0: 'transparent', 1: '#ef4444', 2: 'var(--bf-amber)', 3: 'var(--bf-leaf)' }
	const STRENGTH_LABELS: Record<StrengthLevel, string> = { 0: '', 1: 'Weak', 2: 'Good', 3: 'Strong' }
	const pwStrength: StrengthLevel = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3

	if (!user) {
		return (
			<main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 56px', textAlign: 'center' }}>
				<div className='bf-card' style={{ padding: '60px 24px' }}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
					<div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.025em' }}>Sign in to view your profile</div>
					<div style={{ color: 'var(--bf-ink-2)', fontSize: 15, marginTop: 8, marginBottom: 24 }}>
						Your profile, orders and saved addresses are here.
					</div>
					<Link href='/auth/login' className='bf-btn bf-btn-primary bf-btn-lg' style={{ display: 'inline-flex' }}>
						Sign in {Icons.arrow}
					</Link>
				</div>
			</main>
		)
	}

	const memberSince = (() => {
		try {
			const now = new Date()
			return now.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
		} catch { return 'Recently' }
	})()

	return (
		<main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px 80px' }}>
			{/* ── Page title ── */}
			<div className='bf-eyebrow'>ACCOUNT</div>
			<h1 style={{ fontWeight: 900, fontSize: 38, letterSpacing: '-0.03em', margin: '8px 0 32px' }}>
				My Profile
			</h1>

			{/* ── Hero card ── */}
			<div
				className='bf-card'
				style={{
					padding: '28px 32px',
					marginBottom: 24,
					display: 'flex',
					alignItems: 'center',
					gap: 24,
					flexWrap: 'wrap',
				}}
			>
				<Avatar name={user.name || '?'} size={72} />
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ fontWeight: 900, fontSize: 24, letterSpacing: '-0.025em', marginBottom: 4 }}>
						{user.name || 'Your account'}
					</div>
					<div
						style={{
							fontSize: 14,
							color: 'var(--bf-ink-2)',
							display: 'flex',
							gap: 12,
							flexWrap: 'wrap',
							alignItems: 'center',
						}}
					>
						{user.phone && (
							<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
								<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
									<path d='M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' />
								</svg>
								{user.phone}
							</span>
						)}
						{user.email && (
							<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
								<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
									<rect x='2' y='4' width='20' height='16' rx='2' /><path d='M2 8l10 7 10-7' />
								</svg>
								{user.email}
							</span>
						)}
					</div>
					<div
						style={{
							marginTop: 10,
							display: 'inline-flex',
							alignItems: 'center',
							gap: 5,
							background: 'var(--bf-amber-08)',
							border: '1px solid rgba(255,182,39,.3)',
							borderRadius: 999,
							padding: '3px 10px',
							fontSize: 11.5,
							fontWeight: 700,
							color: 'var(--bf-amber-d)',
							fontFamily: 'var(--bf-mono)',
							letterSpacing: '0.04em',
						}}
					>
						<span style={{ fontSize: 13 }}>★</span>
						Member since {memberSince}
					</div>
				</div>
			</div>

			{/* ── Two-column layout ── */}
			<div className='bf-profile-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
				{/* ── Left: Personal info + Password ── */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

					{/* ── Personal information card ── */}
					<div className='bf-card' style={{ padding: '24px 28px' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
							<h2 style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
								Personal information
							</h2>
							{!editing && (
								<button
									className='bf-btn bf-btn-outline bf-btn-sm'
									style={{ display: 'flex', gap: 6 }}
									onClick={startEdit}
								>
									<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
										<path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
									</svg>
									Edit
								</button>
							)}
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
							<FieldRow
								label='Full name'
								value={user.name ?? ''}
								inputValue={name}
								onChange={setName}
								editing={editing}
								placeholder='Your name'
								icon={
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<circle cx='12' cy='8' r='4' /><path d='M4 20a8 8 0 0 1 16 0' />
									</svg>
								}
							/>
							<FieldRow
								label='Phone number'
								value={user.phone ?? ''}
								inputValue={user.phone ?? ''}
								onChange={() => {}}
								editing={editing}
								readOnly
								placeholder='Not set'
								icon={
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<path d='M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' />
									</svg>
								}
							/>
							<FieldRow
								label='Email address'
								value={user.email ?? ''}
								inputValue={email}
								onChange={setEmail}
								editing={editing}
								type='email'
								placeholder='your@email.com'
								icon={
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<rect x='2' y='4' width='20' height='16' rx='2' /><path d='M2 8l10 7 10-7' />
									</svg>
								}
							/>
							<FieldRow
								label='Delivery address'
								value={user.address ?? ''}
								inputValue={address}
								onChange={setAddress}
								editing={editing}
								placeholder='Add your delivery address'
								icon={
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z' /><circle cx='12' cy='9' r='2.6' />
									</svg>
								}
							/>
						</div>

						{editing && (
							<div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--bf-line)' }}>
								<button
									className='bf-btn bf-btn-outline bf-btn-md'
									style={{ flex: 1 }}
									onClick={cancelEdit}
									disabled={saving}
								>
									Cancel
								</button>
								<button
									className='bf-btn bf-btn-primary bf-btn-md'
									style={{ flex: 1, opacity: saving ? 0.7 : 1 }}
									onClick={saveProfile}
									disabled={saving}
								>
									{saving ? 'Saving…' : 'Save changes'}
								</button>
							</div>
						)}

						{editing && (
							<p style={{ marginTop: 10, fontSize: 12, color: 'var(--bf-mute)' }}>
								Phone number cannot be changed. Contact support if needed.
							</p>
						)}
					</div>

					{/* ── Change password card ── */}
					<div className='bf-card' style={{ overflow: 'hidden' }}>
						<button
							style={{
								width: '100%',
								padding: '20px 28px',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								fontFamily: 'var(--bf-font)',
								textAlign: 'left',
							}}
							onClick={() => { setPwOpen(!pwOpen); setPwError(null) }}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: 10,
										background: 'var(--bf-cream-2)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='var(--bf-ink-2)' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<rect x='3' y='11' width='18' height='11' rx='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' />
									</svg>
								</div>
								<div>
									<div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.015em' }}>Change password</div>
									<div style={{ fontSize: 12, color: 'var(--bf-mute)', marginTop: 1 }}>Keep your account secure</div>
								</div>
							</div>
							<svg
								width={18}
								height={18}
								viewBox='0 0 24 24'
								fill='none'
								stroke='var(--bf-mute)'
								strokeWidth={2}
								strokeLinecap='round'
								strokeLinejoin='round'
								style={{ transform: pwOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
							>
								<path d='M6 9l6 6 6-6' />
							</svg>
						</button>

						{pwOpen && (
							<div style={{ padding: '0 28px 24px', borderTop: '1px solid var(--bf-line)' }}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
									{/* current password */}
									<div>
										<label className='bf-label'>Current password</label>
										<div style={{ position: 'relative' }}>
											<input
												className='bf-input'
												style={{ paddingRight: 44 }}
												type={showCurrentPw ? 'text' : 'password'}
												value={currentPw}
												onChange={(e) => setCurrentPw(e.target.value)}
												placeholder='Enter current password'
												autoComplete='current-password'
											/>
											<button
												type='button'
												onClick={() => setShowCurrentPw(!showCurrentPw)}
												style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bf-mute)', padding: 4, display: 'flex' }}
											>
												<EyeIcon visible={showCurrentPw} />
											</button>
										</div>
									</div>

									{/* new password */}
									<div>
										<label className='bf-label'>New password</label>
										<div style={{ position: 'relative' }}>
											<input
												className='bf-input'
												style={{ paddingRight: 44 }}
												type={showNewPw ? 'text' : 'password'}
												value={newPw}
												onChange={(e) => setNewPw(e.target.value)}
												placeholder='Min. 8 characters'
												autoComplete='new-password'
											/>
											<button
												type='button'
												onClick={() => setShowNewPw(!showNewPw)}
												style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bf-mute)', padding: 4, display: 'flex' }}
											>
												<EyeIcon visible={showNewPw} />
											</button>
										</div>
										{newPw.length > 0 && (
											<div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
												<div style={{ display: 'flex', gap: 4, flex: 1 }}>
													{[1, 2, 3].map((n) => (
														<div key={n} style={{ height: 3, flex: 1, borderRadius: 99, background: pwStrength >= n ? STRENGTH_COLORS[pwStrength] : 'var(--bf-line-2)', transition: 'background .2s' }} />
													))}
												</div>
												<span style={{ fontSize: 11, fontWeight: 700, color: STRENGTH_COLORS[pwStrength], fontFamily: 'var(--bf-mono)', letterSpacing: '0.06em' }}>
													{STRENGTH_LABELS[pwStrength]}
												</span>
											</div>
										)}
									</div>

									{/* confirm */}
									<div>
										<label className='bf-label'>Confirm new password</label>
										<input
											className='bf-input'
											type='password'
											value={confirmPw}
											onChange={(e) => setConfirmPw(e.target.value)}
											placeholder='Repeat new password'
											autoComplete='new-password'
											style={{ borderColor: confirmPw && confirmPw !== newPw ? 'var(--bf-error)' : undefined }}
										/>
									</div>

									{pwError && (
										<div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--bf-error)', fontSize: 13, fontWeight: 600 }}>
											{pwError}
										</div>
									)}

									<button
										className='bf-btn bf-btn-ink bf-btn-md'
										style={{ marginTop: 4, opacity: pwSaving ? 0.7 : 1 }}
										onClick={submitPasswordChange}
										disabled={pwSaving || !currentPw || !newPw || !confirmPw}
									>
										{pwSaving ? 'Updating…' : 'Update password'}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* ── Right: Quick links + Sign out ── */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

					{/* Quick links */}
					<div className='bf-card' style={{ padding: '8px 0', overflow: 'hidden' }}>
						<div style={{ padding: '14px 20px 10px', fontSize: 11, fontWeight: 700, color: 'var(--bf-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--bf-mono)' }}>
							Account
						</div>
						{[
							{ href: '/account/orders', label: 'My orders', icon: <svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'><path d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' /></svg> },
							{ href: '/menu', label: 'Browse menu', icon: <svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='3' width='7' height='7' /><rect x='14' y='3' width='7' height='7' /><rect x='14' y='14' width='7' height='7' /><rect x='3' y='14' width='7' height='7' /></svg> },
							{ href: '/deals', label: 'Deals', icon: <svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'><path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01' /></svg> },
						].map((link) => (
							<Link
								key={link.href}
								href={link.href}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '13px 20px',
									color: 'var(--bf-ink)',
									fontWeight: 600,
									fontSize: 14,
									borderTop: '1px solid var(--bf-line)',
									transition: 'background .12s',
								}}
								className='bf-profile-link'
							>
								<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
									<span style={{ color: 'var(--bf-ink-2)' }}>{link.icon}</span>
									{link.label}
								</span>
								<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='var(--bf-mute)' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
									<path d='M9 18l6-6-6-6' />
								</svg>
							</Link>
						))}
					</div>

					{/* Sign out */}
					<div className='bf-card' style={{ padding: '20px' }}>
						<div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--bf-mono)', marginBottom: 12 }}>
							Session
						</div>
						<button
							className='bf-btn bf-btn-outline bf-btn-md'
							style={{ width: '100%', color: 'var(--bf-ember)', borderColor: 'rgba(232,67,31,.25)', background: 'rgba(232,67,31,.04)' }}
							onClick={() => setLogoutOpen(true)}
						>
							<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
								<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9' />
							</svg>
							Sign out
						</button>
					</div>
				</div>
			</div>

			{/* ── Modals / overlays ── */}
			{logoutOpen && (
				<LogoutModal onConfirm={handleLogout} onCancel={() => setLogoutOpen(false)} />
			)}
			{toast && (
				<Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
			)}

			{/* ── Inline styles (hover states for profile links) ── */}
			<style>{`
				.bf-profile-link:hover { background: var(--bf-cream); }
				@media (max-width: 767px) {
					.bf-profile-grid { grid-template-columns: 1fr !important; }
				}
			`}</style>
		</main>
	)
}
