'use client'
import React, { useState, useRef, useEffect } from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'
import { useAdminProfile, updateAdminProfile, updateAdminPassword } from '../../lib/hooks'
import { uploadImage } from '../ui/image-uploader'
import { Icons } from '../ui/icon'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MOBILE_BP = 767

function useIsMobile(): boolean {
	const [m, setM] = React.useState(false)
	useEffect(() => {
		const q = window.matchMedia(`(max-width: ${MOBILE_BP}px)`)
		setM(q.matches)
		const h = (e: MediaQueryListEvent) => setM(e.matches)
		q.addEventListener('change', h)
		return () => q.removeEventListener('change', h)
	}, [])
	return m
}

const LBL: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 11.5, color: 'var(--bf-mute)', marginBottom: 5, fontFamily: 'var(--bf-mono)', letterSpacing: '0.07em' }

function ReadonlyField({ label, value, color }: { label: string; value?: string | null; color?: string }) {
	return (
		<div>
			<label style={LBL}>{label}</label>
			<div style={{ padding: '9px 13px', background: 'var(--bf-cream-2)', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: color || 'var(--bf-ink-2)', cursor: 'default' }}>
				{value || '—'}
			</div>
		</div>
	)
}

function AvatarUpload({ value, onChange, initials, size = 80 }: { value: string; onChange: (url: string) => void; initials: string; size?: number }) {
	const [uploading, setUploading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	async function handleFile(file: File) {
		if (!file.type.startsWith('image/')) return
		setUploading(true)
		try {
			onChange(await uploadImage(file, 'buddy-feast/admins'))
		} catch { /* ignore */ } finally {
			setUploading(false)
		}
	}

	function onInput(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (file) handleFile(file)
		e.target.value = ''
	}

	return (
		<div style={{ position: 'relative', flexShrink: 0 }}>
			{value ? (
				<img src={value} alt='' style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,.2)', boxShadow: '0 4px 20px rgba(0,0,0,.3)', display: 'block' }} />
			) : (
				<div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--bf-amber), #e89a0e)', display: 'grid', placeItems: 'center', font: `800 ${size * .35}px var(--bf-font)`, color: 'var(--bf-ink)', border: '3px solid rgba(255,255,255,.2)', boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
					{initials}
				</div>
			)}
			<button
				onClick={() => inputRef.current?.click()}
				disabled={uploading}
				style={{
					position: 'absolute', bottom: -4, right: -4,
					width: 32, height: 32, borderRadius: '50%',
					background: uploading ? 'var(--bf-line)' : 'var(--bf-paper)',
					border: '2px solid var(--bf-cream-2)',
					cursor: 'pointer', display: 'grid', placeItems: 'center',
					color: 'var(--bf-ink-2)',
				}}
				title='Upload photo'
			>
				{uploading ? (
					<div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--bf-line-2)', borderTopColor: 'var(--bf-amber)', animation: 'bf-spin .6s linear infinite' }} />
				) : (
					<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/></svg>
				)}
			</button>
			{value && (
				<button
					onClick={() => onChange('')}
					disabled={uploading}
					style={{
						position: 'absolute', top: -4, right: -4,
						width: 20, height: 20, borderRadius: '50%',
						background: 'var(--bf-ember)',
						border: '2px solid var(--bf-cream-2)',
						cursor: 'pointer', display: 'grid', placeItems: 'center',
						color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1, padding: 0,
					}}
					title='Remove photo'
				>×</button>
			)}
			<input ref={inputRef} type='file' accept={ACCEPT} style={{ display: 'none' }} onChange={onInput} />
		</div>
	)
}

export function AdminProfileView() {
	const { data: profile, isLoading, error, mutate } = useAdminProfile()
	const isMobile = useIsMobile()
	const [name, setName] = useState('')
	const [avatarUrl, setAvatarUrl] = useState('')
	const [dirty, setDirty] = useState(false)
	const [saving, setSaving] = useState(false)
	const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [changingPw, setChangingPw] = useState(false)
	const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
	const [pwErrors, setPwErrors] = useState<string[]>([])

	React.useEffect(() => {
		if (profile) {
			setName(profile.name || '')
			setAvatarUrl(profile.avatarUrl || '')
		}
	}, [profile])

	function handleNameChange(v: string) {
		setName(v)
		setDirty(true)
		setSaveMsg(null)
	}

	function handleAvatarChange(url: string) {
		setAvatarUrl(url)
		setDirty(true)
		setSaveMsg(null)
	}

	async function handleSaveProfile() {
		setSaving(true)
		setSaveMsg(null)
		try {
			const updated = await updateAdminProfile({ name: name.trim(), avatarUrl })
			setName(updated.name || '')
			setAvatarUrl(updated.avatarUrl || '')
			setDirty(false)
			setSaveMsg({ ok: true, text: 'Profile saved.' })
		} catch (err: unknown) {
			const axiosErr = err as { response?: { data?: { message?: string } }; message?: string; errorCode?: string }
			const msg = axiosErr.response?.data?.message || axiosErr.message || 'Failed to save profile.'
			setSaveMsg({ ok: false, text: msg })
		} finally {
			setSaving(false)
		}
	}

	async function handleChangePassword(e: React.FormEvent) {
		e.preventDefault()
		const errors: string[] = []
		if (!currentPassword) errors.push('Enter your current password.')
		if (!newPassword) errors.push('Enter a new password.')
		else if (newPassword.length < 8) errors.push('New password must be at least 8 characters.')
		if (newPassword !== confirmPassword) errors.push('Passwords do not match.')
		setPwErrors(errors)
		if (errors.length) return
		setChangingPw(true)
		setPwMsg(null)
		try {
			await updateAdminPassword(currentPassword, newPassword)
			setPwMsg({ ok: true, text: 'Password changed.' })
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string; errorCode?: string }
			const status = axiosErr.response?.status
			const errorCode = axiosErr.errorCode
			const msg = status === 401
				? 'Current password is incorrect.'
				: errorCode === 'ENDPOINT_NOT_FOUND'
					? 'Route not found.'
					: axiosErr.response?.data?.message || axiosErr.message || 'Failed to change password.'
			setPwMsg({ ok: false, text: msg })
		} finally {
			setChangingPw(false)
		}
	}

	if (isLoading) {
		return (
			<AdminShell>
				<AdminTopbar title='Account' sub='Manage your profile' />
				<div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
					{[1, 2, 3].map((i) => (
						<div key={i} className='bf-skeleton' style={{ height: 48, borderRadius: 10, marginBottom: 12 }} />
					))}
				</div>
			</AdminShell>
		)
	}

	if (error) {
		return (
			<AdminShell>
				<AdminTopbar title='Account' sub='Manage your profile' />
				<div style={{ padding: isMobile ? 24 : 40, textAlign: 'center', color: 'var(--bf-ember)' }}>Failed to load profile.{' '}
					<button onClick={() => mutate()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--bf-ember)', textDecoration: 'underline', fontFamily: 'var(--bf-font)' }}>
						Try again
					</button>
				</div>
			</AdminShell>
		)
	}

	const initials = (profile?.name || 'A')
		.trim().split(' ').filter(Boolean).slice(0, 2)
		.map((w) => w[0].toUpperCase()).join('')

	return (
		<AdminShell>
			<AdminTopbar title='Account' sub='Manage your profile' />

			<div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '16px 16px 96px' : '24px 24px 80px', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>

				{/* Profile header */}
				<div style={{
					background: 'linear-gradient(135deg, #2d1b00, #4a2a00)', borderRadius: 16,
					padding: isMobile ? 24 : 32,
					display: 'flex', flexDirection: isMobile ? 'column' : 'row',
					alignItems: isMobile ? 'center' : 'center', gap: isMobile ? 16 : 24,
				}}>
					<AvatarUpload value={avatarUrl} onChange={handleAvatarChange} initials={initials} size={isMobile ? 72 : 80} />
					<div style={{ minWidth: 0, textAlign: isMobile ? 'center' : 'left' }}>
						<div style={{ fontWeight: 800, fontSize: isMobile ? 18 : 22, letterSpacing: '-0.025em', color: '#fff' }}>{name || 'Admin'}</div>
						<div style={{ fontSize: isMobile ? 12.5 : 13, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>{profile?.email}</div>
						<div style={{
							marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
							padding: '3px 10px', borderRadius: 6, background: 'rgba(255,182,39,.15)',
							color: 'var(--bf-amber)', fontSize: 11, fontWeight: 800,
							fontFamily: 'var(--bf-mono)', letterSpacing: '0.06em',
						}}>{profile?.role}</div>
					</div>
				</div>

				{/* Profile details */}
				<div className='bf-admin-card' style={{ padding: isMobile ? 20 : 28 }}>
					<div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 15, letterSpacing: '-0.02em', marginBottom: isMobile ? 16 : 20 }}>Profile details</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14 }}>
						<div>
							<label style={LBL}>NAME</label>
							<input
								className='bf-input'
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder='Your name'
								style={{ width: '100%' }}
							/>
						</div>
						<ReadonlyField label='EMAIL' value={profile?.email} />
						<ReadonlyField label='ROLE' value={profile?.role} color='var(--bf-amber)' />
					</div>
					{saveMsg && (
						<div style={{ fontSize: 12.5, fontWeight: 600, color: saveMsg.ok ? 'var(--bf-leaf)' : 'var(--bf-ember)', marginTop: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
							{saveMsg.ok ? <>{Icons.check} </> : <span>⚠ </span>}
							{saveMsg.text}
						</div>
					)}
					<button
						className='bf-btn bf-btn-primary bf-btn-md'
						onClick={handleSaveProfile}
						disabled={saving || !dirty}
						style={{ marginTop: 16, width: isMobile ? '100%' : 'auto' }}
					>
						{saving ? 'Saving…' : 'Save changes'}
					</button>
				</div>

				{/* Change password */}
				<div className='bf-admin-card' style={{ padding: isMobile ? 20 : 28 }}>
					<div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 15, letterSpacing: '-0.02em', marginBottom: isMobile ? 16 : 20 }}>Change password</div>
					<form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14 }}>
						<div>
							<label style={LBL}>CURRENT PASSWORD</label>
							<input className='bf-input' type='password' value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPwMsg(null); setPwErrors([]) }} placeholder='Enter current password' style={{ width: '100%' }} />
						</div>
						<div>
							<label style={LBL}>NEW PASSWORD</label>
							<input className='bf-input' type='password' value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwMsg(null); setPwErrors([]) }} placeholder='At least 8 characters' style={{ width: '100%' }} />
						</div>
						<div>
							<label style={LBL}>CONFIRM NEW PASSWORD</label>
							<input className='bf-input' type='password' value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwMsg(null); setPwErrors([]) }} placeholder='Re-enter new password' style={{ width: '100%' }} />
						</div>
						{pwErrors.length > 0 && pwErrors.map((e, i) => (
							<div key={i} style={{ fontSize: 12, color: 'var(--bf-ember)', fontWeight: 600 }}>{e}</div>
						))}
						{pwMsg && (
							<div style={{ fontSize: 12.5, fontWeight: 600, color: pwMsg.ok ? 'var(--bf-leaf)' : 'var(--bf-ember)', display: 'flex', alignItems: 'center', gap: 5 }}>
								{pwMsg.ok ? <>{Icons.check} </> : <span>⚠ </span>}
								{pwMsg.text}
							</div>
						)}
						<button className='bf-btn bf-btn-primary bf-btn-md' type='submit' disabled={changingPw} style={{ alignSelf: isMobile ? 'stretch' : 'flex-start' }}>
							{changingPw ? 'Changing…' : 'Change password'}
						</button>
					</form>
				</div>

			</div>
		</AdminShell>
	)
}
