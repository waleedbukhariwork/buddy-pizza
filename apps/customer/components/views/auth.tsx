'use client'
import React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '../ui/logo'
import { apiClient } from '../../lib/api-client'
import { useAuthStore } from '../../lib/auth-store'
import type { AuthResponse } from '@shared/index'

// ─── Auth shell (minimal, focused) ───────────────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'var(--bf-cream)',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<header
				style={{
					padding: '20px 32px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					borderBottom: '1px solid var(--bf-line)',
				}}
			>
				<Logo size={20} />
				<span
					style={{
						fontSize: 12,
						fontFamily: 'var(--bf-mono)',
						fontWeight: 600,
						letterSpacing: '0.1em',
						textTransform: 'uppercase',
						color: 'var(--bf-mute)',
					}}
				>
					Multan · Open now
				</span>
			</header>
			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '32px 16px',
				}}
			>
				{children}
			</div>
			<footer
				style={{
					padding: '16px 32px',
					borderTop: '1px solid var(--bf-line)',
					display: 'flex',
					justifyContent: 'center',
				}}
			>
				<span
					style={{
						fontSize: 12,
						color: 'var(--bf-mute)',
						fontFamily: 'var(--bf-mono)',
						letterSpacing: '0.06em',
					}}
				>
					© 2024 Buddy Feast · Multan, PK
				</span>
			</footer>
		</div>
	)
}

// ─── Auth panel (left decorative side) ───────────────────────────────────────
function AuthPanel() {
	const items = [
		{
			icon: '🍕',
			label: 'Wood-fired pizzas',
			sub: 'Neapolitan style, under 90 seconds',
		},
		{
			icon: '🚴',
			label: 'Delivery in 25 min',
			sub: '3.2 km avg — your food stays hot',
		},
		{
			icon: '⭐',
			label: '4.9 · 2,400+ reviews',
			sub: "Multan's favourite pizza joint",
		},
	]
	return (
		<div
			style={{
				background: 'var(--bf-ink)',
				borderRadius: 'var(--bf-radius)',
				padding: '48px 40px',
				display: 'flex',
				flexDirection: 'column',
				gap: 40,
				height: '100%',
				minHeight: 480,
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: -60,
					right: -60,
					width: 200,
					height: 200,
					borderRadius: '50%',
					background: 'rgba(232,67,31,.18)',
					pointerEvents: 'none',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					bottom: -40,
					left: -40,
					width: 160,
					height: 160,
					borderRadius: '50%',
					background: 'rgba(255,182,39,.14)',
					pointerEvents: 'none',
				}}
			/>
			<div>
				<p
					style={{
						fontFamily: 'var(--bf-mono)',
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: '0.14em',
						textTransform: 'uppercase',
						color: 'var(--bf-ember)',
						marginBottom: 12,
					}}
				>
					Buddy Feast
				</p>
				<p
					style={{
						fontSize: 28,
						fontWeight: 900,
						letterSpacing: '-0.03em',
						color: '#fff',
						lineHeight: 1.2,
					}}
				>
					Great pizza,
					<br />
					fast delivery.
				</p>
				<p
					style={{
						marginTop: 12,
						fontSize: 14,
						color: 'rgba(255,255,255,.55)',
						lineHeight: 1.6,
					}}
				>
					Sign in to track your orders, save your address, and check out faster
					every time.
				</p>
			</div>
			<div
				style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}
			>
				{items.map((it) => (
					<div
						key={it.label}
						style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
					>
						<div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>
							{it.icon}
						</div>
						<div>
							<p
								style={{
									fontSize: 13.5,
									fontWeight: 700,
									color: '#fff',
									letterSpacing: '-0.01em',
								}}
							>
								{it.label}
							</p>
							<p
								style={{
									fontSize: 12,
									color: 'rgba(255,255,255,.5)',
									marginTop: 2,
								}}
							>
								{it.sub}
							</p>
						</div>
					</div>
				))}
			</div>
			<div
				style={{
					padding: '16px 18px',
					background: 'rgba(255,255,255,.07)',
					borderRadius: 12,
					border: '1px solid rgba(255,255,255,.1)',
				}}
			>
				<p
					style={{
						fontSize: 13,
						color: 'rgba(255,255,255,.75)',
						fontStyle: 'italic',
						lineHeight: 1.5,
					}}
				>
					"Honestly the fastest delivery in Multan and the dough is perfect
					every time."
				</p>
				<p
					style={{
						fontSize: 11.5,
						fontWeight: 700,
						color: 'rgba(255,255,255,.4)',
						marginTop: 8,
						fontFamily: 'var(--bf-mono)',
						letterSpacing: '0.06em',
					}}
				>
					— Ayesha M., Multan
				</p>
			</div>
		</div>
	)
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
function AuthSignIn() {
	const router = useRouter()
	const { setToken, setUser } = useAuthStore()

	const [phoneOrEmail, setPhoneOrEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPw, setShowPw] = useState(false)
	const [remember, setRemember] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [fieldError, setFieldError] = useState<string | null>(null)

	function validateIdentifier() {
		if (!phoneOrEmail.trim()) {
			setFieldError('Please enter your phone or email')
		} else {
			setFieldError(null)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setIsLoading(true)
		try {
			const { data } = await apiClient.post<AuthResponse>('/v1/auth/customer/login', {
				phoneOrEmail,
				password,
			})
			if (data.token) {
				localStorage.setItem('token', data.token)
				if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
				setToken(data.token)
				if (data.user) setUser(data.user)
				router.push('/')
			}
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401 || status === 403) {
				setError('Incorrect phone/email or password.')
			} else {
				setError('Something went wrong. Please try again.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	const EyeIcon = () => (
		<svg
			width={18}
			height={18}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={1.8}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			{showPw ? (
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

	return (
		<AuthShell>
			<div
				style={{
					width: '100%',
					maxWidth: 900,
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: 0,
					background: 'var(--bf-paper)',
					borderRadius: 20,
					overflow: 'hidden',
					boxShadow: '0 24px 60px rgba(35,31,32,.14)',
				}}
			>
				<div style={{ padding: 40 }}>
					<AuthPanel />
				</div>
				<form
					onSubmit={handleSubmit}
					style={{
						padding: '48px 48px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						borderLeft: '1px solid var(--bf-line)',
					}}
				>
					<div
						style={{
							display: 'flex',
							background: 'var(--bf-cream)',
							borderRadius: 10,
							padding: 4,
							marginBottom: 36,
							gap: 4,
						}}
					>
						<div
							style={{
								flex: 1,
								background: 'var(--bf-paper)',
								borderRadius: 8,
								padding: '8px 0',
								textAlign: 'center',
								fontSize: 13,
								fontWeight: 700,
								color: 'var(--bf-ink)',
								boxShadow: '0 1px 4px rgba(35,31,32,.1)',
								cursor: 'default',
							}}
						>
							Sign in
						</div>
						<Link
							href='/auth/register'
							style={{
								flex: 1,
								borderRadius: 8,
								padding: '8px 0',
								textAlign: 'center',
								fontSize: 13,
								fontWeight: 600,
								color: 'var(--bf-mute)',
								display: 'block',
							}}
						>
							Create account
						</Link>
					</div>
					<p
						style={{
							fontSize: 22,
							fontWeight: 900,
							letterSpacing: '-0.03em',
							color: 'var(--bf-ink)',
							marginBottom: 4,
						}}
					>
						Welcome back
					</p>
					<p
						style={{
							fontSize: 13.5,
							color: 'var(--bf-mute)',
							marginBottom: 28,
							lineHeight: 1.5,
						}}
					>
						Good to see you again. Let's get your order going.
					</p>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
								Phone or email
							</label>
							<div style={{ position: 'relative' }}>
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
									<svg
										width={16}
										height={16}
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth={2}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<path d='M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' />
									</svg>
								</span>
								<input
									className='bf-input'
									style={{ paddingLeft: 40, borderColor: fieldError ? 'var(--bf-error)' : undefined }}
									placeholder='923000000000'
									value={phoneOrEmail}
									onChange={(e) => { setPhoneOrEmail(e.target.value); setFieldError(null) }}
									onBlur={validateIdentifier}
									required
									autoComplete='username'
								/>
								{fieldError && (
									<div style={{ marginTop: 5, fontSize: 12, color: 'var(--bf-error)', fontWeight: 600 }}>
										{fieldError}
									</div>
								)}
							</div>
						</div>
						<div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: 6,
								}}
							>
								<label
									style={{
										fontSize: 11.5,
										fontWeight: 700,
										color: 'var(--bf-ink-2)',
										letterSpacing: '-0.01em',
									}}
								>
									Password
								</label>
								<Link
									href='#'
									style={{
										fontSize: 12,
										fontWeight: 600,
										color: 'var(--bf-ember)',
									}}
								>
									Forgot?
								</Link>
							</div>
							<div style={{ position: 'relative' }}>
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
									<svg
										width={16}
										height={16}
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth={2}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<rect x='3' y='11' width='18' height='11' rx='2' />
										<path d='M7 11V7a5 5 0 0 1 10 0v4' />
									</svg>
								</span>
								<input
									className='bf-input'
									style={{ paddingLeft: 40, paddingRight: 46 }}
									type={showPw ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoComplete='current-password'
								/>
								<button
									type='button'
									onClick={() => setShowPw(!showPw)}
									style={{
										position: 'absolute',
										right: 12,
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										color: 'var(--bf-mute)',
										padding: 4,
										display: 'flex',
									}}
								>
									<EyeIcon />
								</button>
							</div>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
							<button
								type='button'
								onClick={() => setRemember(!remember)}
								style={{
									width: 18,
									height: 18,
									borderRadius: 5,
									border: `2px solid ${remember ? 'var(--bf-ember)' : 'var(--bf-line-2)'}`,
									background: remember ? 'var(--bf-ember)' : 'transparent',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									transition: 'all .15s',
									flexShrink: 0,
								}}
							>
								{remember && (
									<svg
										width={10}
										height={10}
										viewBox='0 0 24 24'
										fill='none'
										stroke='#fff'
										strokeWidth={3}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<path d='M4 12l5 5L20 6' />
									</svg>
								)}
							</button>
							<span style={{ fontSize: 13, color: 'var(--bf-ink-2)' }}>
								Remember me for 30 days
							</span>
						</div>

						{error && (
							<div
								style={{
									padding: '10px 14px',
									borderRadius: 10,
									background: 'rgba(239,68,68,.08)',
									border: '1px solid rgba(239,68,68,.2)',
									color: 'var(--bf-error)',
									fontSize: 13,
									fontWeight: 600,
								}}
							>
								{error}
							</div>
						)}

						<button
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{
								width: '100%',
								marginTop: 4,
								fontSize: 15,
								padding: '14px 0',
								borderRadius: 12,
								opacity: isLoading ? 0.7 : 1,
							}}
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? 'Signing in…' : (
								<>
									Sign in
									<svg
										width={18}
										height={18}
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth={2.2}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<path d='M5 12h14M13 6l6 6-6 6' />
									</svg>
								</>
							)}
						</button>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
							<div
								style={{ flex: 1, height: 1, background: 'var(--bf-line)' }}
							/>
							<span
								style={{
									fontSize: 11.5,
									color: 'var(--bf-mute)',
									fontFamily: 'var(--bf-mono)',
									letterSpacing: '0.08em',
								}}
							>
								or
							</span>
							<div
								style={{ flex: 1, height: 1, background: 'var(--bf-line)' }}
							/>
						</div>
						<p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--bf-ink-2)' }}>
							New to Buddy Feast?{' '}
							<Link href='/auth/register' style={{ fontWeight: 700, color: 'var(--bf-ember)' }}>
								Create your account →
							</Link>
						</p>
						<p style={{ textAlign: 'center', fontSize: 13, color: 'var(--bf-mute)' }}>
							or{' '}
							<Link href='/' style={{ fontWeight: 600, color: 'var(--bf-ink-2)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
								Continue as guest
							</Link>
						</p>
					</div>
				</form>
			</div>
		</AuthShell>
	)
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
function AuthSignUp() {
	const router = useRouter()
	const { setToken, setUser } = useAuthStore()

	const [name, setName] = useState('')
	const [phone, setPhone] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [address, setAddress] = useState('')
	const [showPw, setShowPw] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	type StrengthLevel = 0 | 1 | 2 | 3
	const STRENGTH_COLORS: Record<StrengthLevel, string> = {
		0: 'transparent',
		1: '#ef4444',
		2: 'var(--bf-amber)',
		3: 'var(--bf-leaf)',
	}
	const STRENGTH_LABELS: Record<StrengthLevel, string> = {
		0: '',
		1: 'Weak',
		2: 'Good',
		3: 'Strong',
	}
	const strength: StrengthLevel =
		password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
	const strengthColor = STRENGTH_COLORS[strength]
	const strengthLabel = STRENGTH_LABELS[strength]

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setIsLoading(true)
		try {
			const { data } = await apiClient.post<AuthResponse>('/v1/auth/customer/register', {
				name,
				phone,
				email,
				password,
				address,
				city: 'Multan',
			})
			if (data.token) {
				localStorage.setItem('token', data.token)
				if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
				setToken(data.token)
				if (data.user) setUser(data.user)
				router.push('/')
			}
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
			if (status === 409 || (msg && msg.toLowerCase().includes('exist'))) {
				setError('An account with this phone or email already exists.')
			} else if (msg) {
				setError(msg)
			} else {
				setError('Registration failed. Please try again.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	const EyeIcon = () => (
		<svg
			width={18}
			height={18}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={1.8}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			{showPw ? (
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

	function FieldIcon({ d }: { d: React.ReactNode }) {
		return (
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
				<svg
					width={16}
					height={16}
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth={2}
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					{d}
				</svg>
			</span>
		)
	}

	return (
		<AuthShell>
			<div
				style={{
					width: '100%',
					maxWidth: 960,
					display: 'grid',
					gridTemplateColumns: '5fr 7fr',
					gap: 0,
					background: 'var(--bf-paper)',
					borderRadius: 20,
					overflow: 'hidden',
					boxShadow: '0 24px 60px rgba(35,31,32,.14)',
				}}
			>
				<div style={{ padding: 40 }}>
					<AuthPanel />
				</div>
				<form
					onSubmit={handleSubmit}
					style={{
						padding: '40px 48px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						borderLeft: '1px solid var(--bf-line)',
					}}
				>
					<div
						style={{
							display: 'flex',
							background: 'var(--bf-cream)',
							borderRadius: 10,
							padding: 4,
							marginBottom: 32,
							gap: 4,
						}}
					>
						<Link
							href='/auth/login'
							style={{
								flex: 1,
								borderRadius: 8,
								padding: '8px 0',
								textAlign: 'center',
								fontSize: 13,
								fontWeight: 600,
								color: 'var(--bf-mute)',
								display: 'block',
							}}
						>
							Sign in
						</Link>
						<div
							style={{
								flex: 1,
								background: 'var(--bf-paper)',
								borderRadius: 8,
								padding: '8px 0',
								textAlign: 'center',
								fontSize: 13,
								fontWeight: 700,
								color: 'var(--bf-ink)',
								boxShadow: '0 1px 4px rgba(35,31,32,.1)',
								cursor: 'default',
							}}
						>
							Create account
						</div>
					</div>
					<p
						style={{
							fontSize: 21,
							fontWeight: 900,
							letterSpacing: '-0.03em',
							color: 'var(--bf-ink)',
							marginBottom: 4,
						}}
					>
						Create your account
					</p>
					<p
						style={{
							fontSize: 13,
							color: 'var(--bf-mute)',
							marginBottom: 24,
							lineHeight: 1.5,
						}}
					>
						Join thousands of happy customers. Checkout 3× faster next time.
					</p>
					<div
						style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
					>
						<div style={{ gridColumn: '1 / -1' }}>
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
								Full name
							</label>
							<div style={{ position: 'relative' }}>
								<FieldIcon
									d={
										<>
											<circle cx='12' cy='8' r='4' />
											<path d='M4 20a8 8 0 0 1 16 0' />
										</>
									}
								/>
								<input
									className='bf-input'
									style={{ paddingLeft: 40 }}
									placeholder='Ayesha Khan'
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									autoComplete='name'
								/>
							</div>
						</div>
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
								Phone
							</label>
							<div style={{ position: 'relative' }}>
								<FieldIcon
									d={
										<path d='M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' />
									}
								/>
								<input
									className='bf-input'
									style={{ paddingLeft: 40 }}
									placeholder='923000000000'
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									required
									autoComplete='tel'
								/>
							</div>
						</div>
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
								Email
							</label>
							<div style={{ position: 'relative' }}>
								<FieldIcon
									d={
										<>
											<rect x='2' y='4' width='20' height='16' rx='2' />
											<path d='M2 8l10 7 10-7' />
										</>
									}
								/>
								<input
									className='bf-input'
									style={{ paddingLeft: 40 }}
									placeholder='ayesha@email.com'
									type='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									autoComplete='email'
								/>
							</div>
						</div>
						<div style={{ gridColumn: '1 / -1' }}>
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
								Password
							</label>
							<div style={{ position: 'relative' }}>
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
									<svg
										width={16}
										height={16}
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth={2}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<rect x='3' y='11' width='18' height='11' rx='2' />
										<path d='M7 11V7a5 5 0 0 1 10 0v4' />
									</svg>
								</span>
								<input
									className='bf-input'
									style={{ paddingLeft: 40, paddingRight: 46 }}
									type={showPw ? 'text' : 'password'}
									placeholder='Min. 8 characters'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={8}
									autoComplete='new-password'
								/>
								<button
									type='button'
									onClick={() => setShowPw(!showPw)}
									style={{
										position: 'absolute',
										right: 12,
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										color: 'var(--bf-mute)',
										padding: 4,
										display: 'flex',
									}}
								>
									<EyeIcon />
								</button>
							</div>
							{password.length > 0 && (
								<div
									style={{
										marginTop: 8,
										display: 'flex',
										alignItems: 'center',
										gap: 8,
									}}
								>
									<div style={{ display: 'flex', gap: 4, flex: 1 }}>
										{[1, 2, 3].map((n) => (
											<div
												key={n}
												style={{
													height: 3,
													flex: 1,
													borderRadius: 99,
													background:
														strength >= n ? strengthColor : 'var(--bf-line-2)',
													transition: 'background .2s',
												}}
											/>
										))}
									</div>
									<span
										style={{
											fontSize: 11,
											fontWeight: 700,
											color: strengthColor,
											fontFamily: 'var(--bf-mono)',
											letterSpacing: '0.06em',
										}}
									>
										{strengthLabel}
									</span>
								</div>
							)}
						</div>
						<div style={{ gridColumn: '1 / -1' }}>
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
								Default delivery address{' '}
								<span style={{ color: 'var(--bf-mute)', fontWeight: 500 }}>
									(optional)
								</span>
							</label>
							<div style={{ position: 'relative' }}>
								<FieldIcon
									d={
										<>
											<path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z' />
											<circle cx='12' cy='9' r='2.6' />
										</>
									}
								/>
								<input
									className='bf-input'
									style={{ paddingLeft: 40 }}
									placeholder='House 14, Gulgasht Colony, Multan'
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									autoComplete='street-address'
								/>
							</div>
						</div>

						{error && (
							<div
								style={{
									gridColumn: '1 / -1',
									padding: '10px 14px',
									borderRadius: 10,
									background: 'rgba(239,68,68,.08)',
									border: '1px solid rgba(239,68,68,.2)',
									color: 'var(--bf-error)',
									fontSize: 13,
									fontWeight: 600,
								}}
							>
								{error}
							</div>
						)}

						<div
							style={{
								gridColumn: '1 / -1',
								fontSize: 12,
								color: 'var(--bf-mute)',
								lineHeight: 1.5,
							}}
						>
							By creating an account you agree to our{' '}
							<Link
								href='#'
								style={{
									color: 'var(--bf-ink-2)',
									fontWeight: 600,
									textDecoration: 'underline',
									textUnderlineOffset: 2,
								}}
							>
								Terms of Service
							</Link>
							{' & '}
							<Link
								href='#'
								style={{
									color: 'var(--bf-ink-2)',
									fontWeight: 600,
									textDecoration: 'underline',
									textUnderlineOffset: 2,
								}}
							>
								Privacy Policy
							</Link>
							.
						</div>
						<button
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{
								gridColumn: '1 / -1',
								width: '100%',
								marginTop: 4,
								fontSize: 15,
								padding: '14px 0',
								borderRadius: 12,
								opacity: isLoading ? 0.7 : 1,
							}}
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? 'Creating account…' : (
								<>
									Create account
									<svg
										width={18}
										height={18}
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth={2.2}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<path d='M5 12h14M13 6l6 6-6 6' />
									</svg>
								</>
							)}
						</button>
						<p
							style={{
								gridColumn: '1 / -1',
								textAlign: 'center',
								fontSize: 13.5,
								color: 'var(--bf-ink-2)',
								marginTop: 4,
							}}
						>
							Already have an account?{' '}
							<Link
								href='/auth/login'
								style={{ fontWeight: 700, color: 'var(--bf-ember)' }}
							>
								Sign in →
							</Link>
						</p>
					</div>
				</form>
			</div>
		</AuthShell>
	)
}

export { AuthSignIn, AuthSignUp }
