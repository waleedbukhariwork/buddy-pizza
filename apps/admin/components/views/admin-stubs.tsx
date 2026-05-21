'use client'
import React from 'react'
import { AdminShell } from '../layout/admin-shell'
import { AdminTopbar } from '../layout/admin-topbar'

export function AdminReports() {
	return (
		<AdminShell active='reports'>
			<AdminTopbar title='Reports' sub='ANALYTICS & INSIGHTS' />
			<div style={{ padding: 28 }}>
				<p className='bf-eyebrow' style={{ marginBottom: 8 }}>Reports</p>
				<p style={{ color: 'var(--bf-mute)', fontSize: 14 }}>Coming soon</p>
			</div>
		</AdminShell>
	)
}

export function AdminRiders() {
	return (
		<AdminShell active='riders'>
			<AdminTopbar title='Riders' sub='FLEET MANAGEMENT' />
			<div style={{ padding: 28 }}>
				<p className='bf-eyebrow' style={{ marginBottom: 8 }}>Riders</p>
				<p style={{ color: 'var(--bf-mute)', fontSize: 14 }}>Coming soon</p>
			</div>
		</AdminShell>
	)
}
