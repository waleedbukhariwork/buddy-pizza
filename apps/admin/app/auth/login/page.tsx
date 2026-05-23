'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '../../../components/ui/logo'
import { useAdminAuthStore } from '../../../lib/auth-store'
import { apiClient } from '../../../lib/api-client'

export default function AdminLoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const { setToken, setLoading, setError, isLoading, error } =
		useAdminAuthStore()
	const router = useRouter()

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const { data } = await apiClient.post<{
				token: string
				message: string
			}>('/v1/auth/admin/login', { phoneOrEmail: email.trim().toLowerCase(), password })
			setToken(data.token)
			router.push('/')
		} catch {
			setError('Invalid credentials. Please check your email and password.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'var(--bf-cream)',
				display: 'grid',
				placeItems: 'center',
				padding: 24,
			}}
		>
			<div style={{ width: '100%', maxWidth: 420 }}>
				<div className='bf-card' style={{ padding: 36 }}>
					<div style={{ marginBottom: 32, textAlign: 'center' }}>
						<Logo tag='ADMIN' />
						<p
							style={{
								marginTop: 10,
								fontSize: 13,
								color: 'var(--bf-mute)',
								lineHeight: 1.5,
							}}
						>
							Sign in to manage your restaurant
						</p>
					</div>

					<form
						onSubmit={handleSubmit}
						style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
					>
						<div>
							<label className='bf-label'>Email</label>
							<input
								className='bf-input'
								type='email'
								placeholder='admin@buddyfeast.com'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoComplete='email'
							/>
						</div>
						<div>
							<label className='bf-label'>Password</label>
							<input
								className='bf-input'
								type='password'
								placeholder='••••••••'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								autoComplete='current-password'
							/>
						</div>

						{error && (
							<div
								style={{
									padding: '10px 14px',
									borderRadius: 12,
									background: 'rgba(232,67,31,.1)',
									color: 'var(--bf-ember)',
									fontSize: 13,
									fontWeight: 600,
								}}
							>
								{error}
							</div>
						)}

						<button
							className='bf-btn bf-btn-primary bf-btn-lg'
							type='submit'
							disabled={isLoading}
							style={{ width: '100%', marginTop: 4 }}
						>
							{isLoading ? 'Signing in…' : 'Sign in'}
						</button>
					</form>
				</div>

				<p
					className='bf-mono'
					style={{
						textAlign: 'center',
						marginTop: 20,
						fontSize: 11,
						color: 'var(--bf-mute)',
					}}
				>
					BUDDY FEAST · ADMIN PANEL
				</p>
			</div>
		</div>
	)
}
