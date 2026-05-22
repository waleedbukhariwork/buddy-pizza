'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '../ui/logo'
import { apiClient } from '../../lib/api-client'
import { useAuthStore } from '../../lib/auth-store'
import type { AuthResponse, User } from '@shared/index'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InitiateResponse {
	identifier: string
	identifierType: string
	message: string
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(v: string) {
	return EMAIL_RE.test(v.trim())
}

function maskIdentifier(identifier: string) {
	const [local, domain] = identifier.split('@')
	return local.slice(0, 2) + '****@' + domain
}

// ─── Auth shell ───────────────────────────────────────────────────────────────

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

// ─── Decorative left panel ────────────────────────────────────────────────────

function AuthPanel() {
	const items = [
		{ icon: '🍕', label: 'Wood-fired pizzas', sub: 'Neapolitan style, under 90 seconds' },
		{ icon: '🚴', label: 'Delivery in 25 min', sub: '3.2 km avg — your food stays hot' },
		{ icon: '⭐', label: '4.9 · 2,400+ reviews', sub: "Multan's favourite pizza joint" },
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
					position: 'absolute', top: -60, right: -60,
					width: 200, height: 200, borderRadius: '50%',
					background: 'rgba(232,67,31,.18)', pointerEvents: 'none',
				}}
			/>
			<div
				style={{
					position: 'absolute', bottom: -40, left: -40,
					width: 160, height: 160, borderRadius: '50%',
					background: 'rgba(255,182,39,.14)', pointerEvents: 'none',
				}}
			/>
			<div>
				<p style={{
					fontFamily: 'var(--bf-mono)', fontSize: 11, fontWeight: 600,
					letterSpacing: '0.14em', textTransform: 'uppercase',
					color: 'var(--bf-ember)', marginBottom: 12,
				}}>
					Buddy Feast
				</p>
				<p style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.2 }}>
					Great pizza,<br />fast delivery.
				</p>
				<p style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.6 }}>
					Sign in to track your orders, save your address, and check out faster every time.
				</p>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
				{items.map((it) => (
					<div key={it.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
						<div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{it.icon}</div>
						<div>
							<p style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
								{it.label}
							</p>
							<p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{it.sub}</p>
						</div>
					</div>
				))}
			</div>
			<div style={{
				padding: '16px 18px', background: 'rgba(255,255,255,.07)',
				borderRadius: 12, border: '1px solid rgba(255,255,255,.1)',
			}}>
				<p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', fontStyle: 'italic', lineHeight: 1.5 }}>
					"Honestly the fastest delivery in Multan and the dough is perfect every time."
				</p>
				<p style={{
					fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.4)',
					marginTop: 8, fontFamily: 'var(--bf-mono)', letterSpacing: '0.06em',
				}}>
					— Ayesha M., Multan
				</p>
			</div>
		</div>
	)
}

// ─── Redirect context banner ──────────────────────────────────────────────────

function getRedirectContext(redirect: string | null): { message: string; sub: string } | null {
	if (!redirect) return null
	if (redirect === '/checkout' || redirect.startsWith('/checkout'))
		return { message: 'Sign in to place your order', sub: 'Your cart is ready — just one step away.' }
	if (redirect.startsWith('/menu') || redirect.startsWith('/product'))
		return { message: 'Sign in to add items to your cart', sub: 'Create an account to save favourites and order faster.' }
	if (redirect.startsWith('/account') || redirect.startsWith('/profile'))
		return { message: 'Sign in to view your account', sub: 'Access your orders, addresses, and preferences.' }
	if (redirect.startsWith('/deals'))
		return { message: 'Sign in to claim this deal', sub: 'Exclusive offers are waiting for you.' }
	return { message: 'Sign in to continue', sub: 'You need to be logged in to access that page.' }
}

function RedirectBanner({ redirect }: { redirect: string | null }) {
	const ctx = getRedirectContext(redirect)
	if (!ctx) return null
	return (
		<div style={{
			display: 'flex', alignItems: 'flex-start', gap: 12,
			padding: '12px 14px', borderRadius: 12, marginBottom: 24,
			background: 'rgba(232,67,31,.06)',
			border: '1.5px solid rgba(232,67,31,.2)',
		}}>
			<div style={{
				width: 32, height: 32, borderRadius: 8, flexShrink: 0,
				background: 'rgba(232,67,31,.12)',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				marginTop: 1,
			}}>
				<svg width={15} height={15} viewBox='0 0 24 24' fill='none'
					stroke='var(--bf-ember)' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
					<rect x='3' y='11' width='18' height='11' rx='2' />
					<path d='M7 11V7a5 5 0 0 1 10 0v4' />
				</svg>
			</div>
			<div style={{ minWidth: 0 }}>
				<p style={{ fontSize: 13, fontWeight: 700, color: 'var(--bf-ember)', lineHeight: 1.3, marginBottom: 2 }}>
					{ctx.message}
				</p>
				<p style={{ fontSize: 12, color: 'var(--bf-mute)', lineHeight: 1.4 }}>
					{ctx.sub}
				</p>
			</div>
		</div>
	)
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
	return (
		<svg width={18} height={18} viewBox='0 0 24 24' fill='none'
			stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round'>
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

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label style={{
			display: 'block', fontSize: 11.5, fontWeight: 700,
			color: 'var(--bf-ink-2)', marginBottom: 6, letterSpacing: '-0.01em',
		}}>
			{children}
		</label>
	)
}

function ErrorBanner({ message }: { message: string }) {
	return (
		<div style={{
			padding: '10px 14px', borderRadius: 10,
			background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
			color: 'var(--bf-error)', fontSize: 13, fontWeight: 600,
		}}>
			{message}
		</div>
	)
}

function TabSwitcher({ active }: { active: 'signin' | 'signup' }) {
	return (
		<div style={{
			display: 'flex', background: 'var(--bf-cream)',
			borderRadius: 10, padding: 4, marginBottom: 32, gap: 4,
		}}>
			{(['signin', 'signup'] as const).map((tab) => {
				const isActive = tab === active
				const label = tab === 'signin' ? 'Sign in' : 'Create account'
				const href = tab === 'signin' ? '/auth/login' : '/auth/register'
				return isActive ? (
					<div key={tab} style={{
						flex: 1, background: 'var(--bf-paper)', borderRadius: 8,
						padding: '8px 0', textAlign: 'center', fontSize: 13,
						fontWeight: 700, color: 'var(--bf-ink)',
						boxShadow: '0 1px 4px rgba(35,31,32,.1)', cursor: 'default',
					}}>
						{label}
					</div>
				) : (
					<Link key={tab} href={href} style={{
						flex: 1, borderRadius: 8, padding: '8px 0', textAlign: 'center',
						fontSize: 13, fontWeight: 600, color: 'var(--bf-mute)', display: 'block',
					}}>
						{label}
					</Link>
				)
			})}
		</div>
	)
}

// ─── OTP step ─────────────────────────────────────────────────────────────────

interface OtpStepProps {
	identifier: string
	onBack: () => void
	onSuccess: (token: string, user: User | undefined) => void
}

function OtpStep({ identifier, onBack, onSuccess }: OtpStepProps) {
	const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
	const [timeLeft, setTimeLeft] = useState(120)
	const [canResend, setCanResend] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isResending, setIsResending] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [resendCount, setResendCount] = useState(0)
	const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null])

	// Countdown timer
	useEffect(() => {
		if (timeLeft <= 0) { setCanResend(true); return }
		const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000)
		return () => clearTimeout(t)
	}, [timeLeft])

	function formatTime(s: number) {
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
	}

	function handleDigitInput(index: number, value: string) {
		const digit = value.replace(/\D/g, '').slice(-1)
		const next = [...digits]
		next[index] = digit
		setDigits(next)
		setError(null)
		if (digit && index < 5) inputRefs.current[index + 1]?.focus()
		if (digit && index === 5 && next.every((d) => d)) {
			submitOtp(next.join(''))
		}
	}

	function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Backspace') {
			if (digits[index]) {
				const next = [...digits]
				next[index] = ''
				setDigits(next)
			} else if (index > 0) {
				inputRefs.current[index - 1]?.focus()
			}
		} else if (e.key === 'ArrowLeft' && index > 0) {
			inputRefs.current[index - 1]?.focus()
		} else if (e.key === 'ArrowRight' && index < 5) {
			inputRefs.current[index + 1]?.focus()
		}
	}

	function handlePaste(e: React.ClipboardEvent) {
		e.preventDefault()
		const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
		if (pasted.length === 6) {
			setDigits(pasted.split(''))
			inputRefs.current[5]?.focus()
			submitOtp(pasted)
		}
	}

	async function submitOtp(code: string) {
		setIsLoading(true)
		setError(null)
		try {
			const { data } = await apiClient.post<AuthResponse>('/v1/auth/customer/verify-otp', {
				identifier,
				code,
			})
			if (data.token) {
				localStorage.setItem('token', data.token)
				if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
				onSuccess(data.token, data.user)
			}
		} catch (err: unknown) {
			const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
			setError(msg || 'Invalid code. Please try again.')
			setDigits(Array(6).fill(''))
			setTimeout(() => inputRefs.current[0]?.focus(), 50)
		} finally {
			setIsLoading(false)
		}
	}

	async function handleResend() {
		if (!canResend || resendCount >= 3 || isResending) return
		setIsResending(true)
		setError(null)
		try {
			await apiClient.post('/v1/auth/customer/resend-otp', { identifier })
			setTimeLeft(120)
			setCanResend(false)
			setResendCount((c) => c + 1)
			setDigits(Array(6).fill(''))
			setTimeout(() => inputRefs.current[0]?.focus(), 50)
		} catch (err: unknown) {
			const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
			setError(msg || 'Failed to resend code. Please try again.')
		} finally {
			setIsResending(false)
		}
	}

	const allFilled = digits.every((d) => d !== '')
	const masked = maskIdentifier(identifier)

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
			{/* Back */}
			<button
				type='button'
				onClick={onBack}
				style={{
					display: 'flex', alignItems: 'center', gap: 6,
					background: 'none', border: 'none', cursor: 'pointer',
					color: 'var(--bf-mute)', fontSize: 13, fontWeight: 600,
					padding: 0, marginBottom: 28,
				}}
			>
				<svg width={16} height={16} viewBox='0 0 24 24' fill='none'
					stroke='currentColor' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
					<path d='M19 12H5M11 6l-6 6 6 6' />
				</svg>
				Back
			</button>

			{/* Heading */}
			<p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--bf-ink)', marginBottom: 6 }}>
				Verify your account
			</p>
			<p style={{ fontSize: 13.5, color: 'var(--bf-mute)', marginBottom: 28, lineHeight: 1.5 }}>
				We sent a 6-digit code to{' '}
				<span style={{ fontWeight: 700, color: 'var(--bf-ink-2)' }}>{masked}</span>
			</p>

			{/* OTP digit boxes — flex:1 so they fill width on any phone size */}
			<div
				onPaste={handlePaste}
				style={{ display: 'flex', gap: 8, marginBottom: 8 }}
			>
				{digits.map((digit, i) => (
					<input
						key={i}
						ref={(el) => { inputRefs.current[i] = el }}
						type='text'
						inputMode='numeric'
						maxLength={1}
						value={digit}
						autoFocus={i === 0}
						disabled={isLoading}
						onChange={(e) => handleDigitInput(i, e.target.value)}
						onKeyDown={(e) => handleKeyDown(i, e)}
						style={{
							flex: 1,
							minWidth: 0,
							maxWidth: 54,
							height: 56,
							textAlign: 'center',
							fontSize: 20, fontWeight: 800,
							fontFamily: 'var(--bf-mono)',
							borderRadius: 12,
							border: `2px solid ${
								error
									? 'var(--bf-error)'
									: digit
									? 'var(--bf-ember)'
									: 'var(--bf-line-2)'
							}`,
							background: digit ? 'rgba(232,67,31,.04)' : 'var(--bf-paper)',
							color: 'var(--bf-ink)',
							outline: 'none',
							transition: 'border-color .15s, background .15s',
							caretColor: 'var(--bf-ember)',
							cursor: isLoading ? 'not-allowed' : 'text',
						}}
						onFocus={(e) => { e.target.style.borderColor = error ? 'var(--bf-error)' : 'var(--bf-ember)' }}
						onBlur={(e) => {
							if (!e.target.value) e.target.style.borderColor = 'var(--bf-line-2)'
						}}
					/>
				))}
			</div>

			{/* Error */}
			{error && (
				<div style={{ marginBottom: 16 }}>
					<ErrorBanner message={error} />
				</div>
			)}

			{/* Verify button (shown when digits filled but not auto-submitted) */}
			{allFilled && !isLoading && (
				<button
					className='bf-btn bf-btn-primary bf-btn-lg'
					onClick={() => submitOtp(digits.join(''))}
					style={{ width: '100%', marginBottom: 16, fontSize: 15, padding: '14px 0', borderRadius: 12 }}
				>
					Verify code
					<svg width={18} height={18} viewBox='0 0 24 24' fill='none'
						stroke='currentColor' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
						<path d='M5 12h14M13 6l6 6-6 6' />
					</svg>
				</button>
			)}

			{isLoading && (
				<div style={{
					padding: '14px 0', borderRadius: 12, marginBottom: 16,
					background: 'var(--bf-cream)', textAlign: 'center',
					fontSize: 13.5, color: 'var(--bf-mute)', fontWeight: 600,
				}}>
					Verifying…
				</div>
			)}

			{/* Resend */}
			<div style={{ textAlign: 'center', marginTop: 4 }}>
				{!canResend ? (
					<p style={{ fontSize: 13, color: 'var(--bf-mute)' }}>
						Resend code in{' '}
						<span style={{ fontFamily: 'var(--bf-mono)', fontWeight: 700, color: 'var(--bf-ink-2)' }}>
							{formatTime(timeLeft)}
						</span>
					</p>
				) : resendCount >= 3 ? (
					<p style={{ fontSize: 13, color: 'var(--bf-mute)' }}>
						Max resends reached. Please{' '}
						<button type='button' onClick={onBack}
							style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bf-ember)', fontWeight: 700, fontSize: 13, padding: 0 }}>
							start over
						</button>
					</p>
				) : (
					<button
						type='button'
						onClick={handleResend}
						disabled={isResending}
						style={{
							background: 'none', border: 'none', cursor: isResending ? 'not-allowed' : 'pointer',
							color: 'var(--bf-ember)', fontWeight: 700, fontSize: 13, padding: 0,
							opacity: isResending ? 0.6 : 1,
						}}
					>
						{isResending ? 'Sending…' : 'Resend code'}
					</button>
				)}
			</div>
		</div>
	)
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

function AuthSignIn() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { setToken, setUser } = useAuthStore()

	const redirect = searchParams.get('redirect')

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPw, setShowPw] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setIsLoading(true)
		try {
			const { data } = await apiClient.post<AuthResponse>('/v1/auth/customer/login', {
				phoneOrEmail: email.trim(),
				password,
			})
			if (data.token) {
				localStorage.setItem('token', data.token)
				if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
				setToken(data.token)
				if (data.user) setUser(data.user)
				router.push(redirect ?? '/')
			}
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
			if (msg === 'UNVERIFIED') {
				setError('Your account is not verified yet. Please sign up again to complete verification.')
			} else if (status === 401) {
				setError('Incorrect password.')
			} else if (status === 404) {
				setError('No account found with that email.')
			} else {
				setError(msg || 'Something went wrong. Please try again.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<AuthShell>
			<div className='bf-auth-grid' style={{
				width: '100%', maxWidth: 900,
				display: 'grid', gridTemplateColumns: '1fr 1fr',
				background: 'var(--bf-paper)', borderRadius: 20, overflow: 'hidden',
				boxShadow: '0 24px 60px rgba(35,31,32,.14)',
			}}>
				<div className='bf-auth-panel-col' style={{ padding: 40 }}>
					<AuthPanel />
				</div>
				<form
					onSubmit={handleSubmit}
					className='bf-auth-form-col'
					style={{
						padding: '48px 48px', display: 'flex', flexDirection: 'column',
						justifyContent: 'center', borderLeft: '1px solid var(--bf-line)',
					}}
				>
					<RedirectBanner redirect={redirect} />

					<p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--bf-ink)', marginBottom: 4 }}>
						Welcome back
					</p>
					<p style={{ fontSize: 13.5, color: 'var(--bf-mute)', marginBottom: 28, lineHeight: 1.5 }}>
						{redirect ? 'Sign in and we\'ll take you right back.' : 'Good to see you again. Let\'s get your order going.'}
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{/* Email */}
						<div>
							<FieldLabel>Email</FieldLabel>
							<div style={{ position: 'relative' }}>
								<span style={{
									position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
									color: 'var(--bf-mute)', display: 'flex', pointerEvents: 'none',
								}}>
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none'
										stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<rect x='2' y='4' width='20' height='16' rx='2' />
										<path d='M2 8l10 7 10-7' />
									</svg>
								</span>
								<input
									className='bf-input'
									style={{ paddingLeft: 40 }}
									type='email'
									placeholder='email@example.com'
									value={email}
									onChange={(e) => { setEmail(e.target.value); setError(null) }}
									required
									autoComplete='email'
									autoFocus
								/>
							</div>
						</div>

						{/* Password */}
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
								<FieldLabel>Password</FieldLabel>
								<Link href='#' style={{ fontSize: 12, fontWeight: 600, color: 'var(--bf-ember)' }}>
									Forgot?
								</Link>
							</div>
							<div style={{ position: 'relative' }}>
								<span style={{
									position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
									color: 'var(--bf-mute)', display: 'flex', pointerEvents: 'none',
								}}>
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none'
										stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<rect x='3' y='11' width='18' height='11' rx='2' />
										<path d='M7 11V7a5 5 0 0 1 10 0v4' />
									</svg>
								</span>
								<input
									className='bf-input'
									style={{ paddingLeft: 40, paddingRight: 46 }}
									type={showPw ? 'text' : 'password'}
									placeholder='Your password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoComplete='current-password'
								/>
								<button
									type='button'
									onClick={() => setShowPw(!showPw)}
									style={{
										position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
										background: 'none', border: 'none', cursor: 'pointer',
										color: 'var(--bf-mute)', padding: 4, display: 'flex',
									}}
								>
									<EyeIcon visible={showPw} />
								</button>
							</div>
						</div>

						{error && <ErrorBanner message={error} />}

						<button
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{
								width: '100%', marginTop: 4, fontSize: 15,
								padding: '14px 0', borderRadius: 12, opacity: isLoading ? 0.7 : 1,
							}}
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? 'Signing in…' : (
								<>
									Sign in
									<svg width={18} height={18} viewBox='0 0 24 24' fill='none'
										stroke='currentColor' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
										<path d='M5 12h14M13 6l6 6-6 6' />
									</svg>
								</>
							)}
						</button>

						<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
							<div style={{ flex: 1, height: 1, background: 'var(--bf-line)' }} />
							<span style={{ fontSize: 11.5, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', letterSpacing: '0.08em' }}>
								or
							</span>
							<div style={{ flex: 1, height: 1, background: 'var(--bf-line)' }} />
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

type SignUpStep = 'form' | 'otp'

function AuthSignUp() {
	const router = useRouter()
	const { setToken, setUser } = useAuthStore()

	// Step management
	const [step, setStep] = useState<SignUpStep>('form')
	const [otpData, setOtpData] = useState<{ identifier: string } | null>(null)

	// Form fields
	const [name, setName] = useState('')
	const [identifier, setIdentifier] = useState('')
	const [password, setPassword] = useState('')
	const [showPw, setShowPw] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [identifierTouched, setIdentifierTouched] = useState(false)

	// Identifier validation state
	const identifierValid = isValidEmail(identifier)
	const identifierHasContent = identifier.trim().length > 0
	const showIdentifierFeedback = identifierHasContent && identifierTouched

	// Password strength
	type Strength = 0 | 1 | 2 | 3
	const strength: Strength =
		password.length === 0 ? 0
		: password.length < 6 ? 1
		: password.length < 10 ? 2
		: 3
	const STRENGTH_COLOR: Record<Strength, string> = {
		0: 'transparent', 1: '#ef4444', 2: 'var(--bf-amber)', 3: 'var(--bf-leaf)',
	}
	const STRENGTH_LABEL: Record<Strength, string> = {
		0: '', 1: 'Weak', 2: 'Good', 3: 'Strong',
	}

	async function handleFormSubmit(e: React.FormEvent) {
		e.preventDefault()
		setIdentifierTouched(true)
		if (!identifierValid) return
		setError(null)
		setIsLoading(true)
		try {
			const { data } = await apiClient.post<InitiateResponse>('/v1/auth/customer/register', {
				name: name.trim(),
				identifier: identifier.trim().replace(/[\s\-]/g, ''),
				password,
			})
			setOtpData({ identifier: data.identifier })
			setStep('otp')
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
			if (status === 409) {
				setError(msg || 'An account with this contact already exists.')
			} else {
				setError(msg || 'Registration failed. Please try again.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	function handleOtpSuccess(token: string, user: User | undefined) {
		setToken(token)
		if (user) setUser(user)
		router.push('/')
	}

	function IdentifierHint() {
		if (!showIdentifierFeedback) return null
		if (identifierValid) {
			return (
				<p style={{ marginTop: 5, fontSize: 12, color: 'var(--bf-leaf)', fontWeight: 600 }}>
					Valid email address
				</p>
			)
		}
		return (
			<p style={{ marginTop: 5, fontSize: 12, color: 'var(--bf-error)', fontWeight: 600 }}>
				Invalid email — check format (e.g. name@example.com)
			</p>
		)
	}

	// Render OTP step
	if (step === 'otp' && otpData) {
		return (
			<AuthShell>
				<div className='bf-auth-grid' style={{
					width: '100%', maxWidth: 900,
					display: 'grid', gridTemplateColumns: '1fr 1fr',
					background: 'var(--bf-paper)', borderRadius: 20, overflow: 'hidden',
					boxShadow: '0 24px 60px rgba(35,31,32,.14)',
				}}>
					<div className='bf-auth-panel-col' style={{ padding: 40 }}>
						<AuthPanel />
					</div>
					<div className='bf-auth-form-col' style={{
						padding: '48px 48px', display: 'flex', flexDirection: 'column',
						justifyContent: 'center', borderLeft: '1px solid var(--bf-line)',
					}}>
						<OtpStep
							identifier={otpData.identifier}
							onBack={() => { setStep('form'); setError(null) }}
							onSuccess={handleOtpSuccess}
						/>
					</div>
				</div>
			</AuthShell>
		)
	}

	// Render form step
	return (
		<AuthShell>
			<div className='bf-auth-grid' style={{
				width: '100%', maxWidth: 960,
				display: 'grid', gridTemplateColumns: '5fr 7fr',
				background: 'var(--bf-paper)', borderRadius: 20, overflow: 'hidden',
				boxShadow: '0 24px 60px rgba(35,31,32,.14)',
			}}>
				<div className='bf-auth-panel-col' style={{ padding: 40 }}>
					<AuthPanel />
				</div>
				<form
					onSubmit={handleFormSubmit}
					className='bf-auth-form-col'
					style={{
						padding: '40px 48px', display: 'flex', flexDirection: 'column',
						justifyContent: 'center', borderLeft: '1px solid var(--bf-line)',
					}}
				>
					<p style={{ fontSize: 21, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--bf-ink)', marginBottom: 4 }}>
						Create your account
					</p>
					<p style={{ fontSize: 13, color: 'var(--bf-mute)', marginBottom: 24, lineHeight: 1.5 }}>
						Join thousands of happy customers. Checkout 3× faster next time.
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{/* Full name */}
						<div>
							<FieldLabel>Full name</FieldLabel>
							<div style={{ position: 'relative' }}>
								<span style={{
									position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
									color: 'var(--bf-mute)', display: 'flex', pointerEvents: 'none',
								}}>
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none'
										stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<circle cx='12' cy='8' r='4' />
										<path d='M4 20a8 8 0 0 1 16 0' />
									</svg>
								</span>
								<input
									className='bf-input'
									style={{ paddingLeft: 40 }}
									placeholder='Ayesha Khan'
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									autoComplete='name'
									autoFocus
								/>
							</div>
						</div>

						{/* Email */}
						<div>
							<FieldLabel>Email</FieldLabel>
							<div style={{ position: 'relative' }}>
								<span style={{
									position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
									color: 'var(--bf-mute)', display: 'flex', pointerEvents: 'none',
								}}>
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none'
										stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
										<rect x='2' y='4' width='20' height='16' rx='2' />
										<path d='M2 8l10 7 10-7' />
									</svg>
								</span>
								<input
									className='bf-input'
									style={{
										paddingLeft: 40,
										borderColor: showIdentifierFeedback && !identifierValid
											? 'var(--bf-error)'
											: showIdentifierFeedback && identifierValid
											? 'var(--bf-leaf)'
											: undefined,
									}}
									type='email'
									placeholder='name@example.com'
									value={identifier}
									onChange={(e) => { setIdentifier(e.target.value); setError(null) }}
									onBlur={() => setIdentifierTouched(true)}
									required
									autoComplete='email'
									inputMode='email'
								/>
							</div>
							<IdentifierHint />
						</div>

						{/* Password */}
						<div>
							<FieldLabel>Password</FieldLabel>
							<div style={{ position: 'relative' }}>
								<span style={{
									position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
									color: 'var(--bf-mute)', display: 'flex', pointerEvents: 'none',
								}}>
									<svg width={16} height={16} viewBox='0 0 24 24' fill='none'
										stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
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
										position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
										background: 'none', border: 'none', cursor: 'pointer',
										color: 'var(--bf-mute)', padding: 4, display: 'flex',
									}}
								>
									<EyeIcon visible={showPw} />
								</button>
							</div>
							{password.length > 0 && (
								<div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
									<div style={{ display: 'flex', gap: 4, flex: 1 }}>
										{[1, 2, 3].map((n) => (
											<div key={n} style={{
												height: 3, flex: 1, borderRadius: 99,
												background: strength >= n ? STRENGTH_COLOR[strength] : 'var(--bf-line-2)',
												transition: 'background .2s',
											}} />
										))}
									</div>
									<span style={{
										fontSize: 11, fontWeight: 700, color: STRENGTH_COLOR[strength],
										fontFamily: 'var(--bf-mono)', letterSpacing: '0.06em',
									}}>
										{STRENGTH_LABEL[strength]}
									</span>
								</div>
							)}
						</div>

						{error && <ErrorBanner message={error} />}

						<p style={{ fontSize: 12, color: 'var(--bf-mute)', lineHeight: 1.5 }}>
							By continuing you agree to our{' '}
							<Link href='#' style={{ color: 'var(--bf-ink-2)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
								Terms of Service
							</Link>
							{' & '}
							<Link href='#' style={{ color: 'var(--bf-ink-2)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
								Privacy Policy
							</Link>
						</p>

						<button
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{
								width: '100%', marginTop: 4, fontSize: 15,
								padding: '14px 0', borderRadius: 12, opacity: isLoading ? 0.7 : 1,
							}}
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? 'Sending code…' : (
								<>
									Continue
									<svg width={18} height={18} viewBox='0 0 24 24' fill='none'
										stroke='currentColor' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'>
										<path d='M5 12h14M13 6l6 6-6 6' />
									</svg>
								</>
							)}
						</button>

						<p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--bf-ink-2)' }}>
							Already have an account?{' '}
							<Link href='/auth/login' style={{ fontWeight: 700, color: 'var(--bf-ember)' }}>
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
