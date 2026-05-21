'use client'
import React from 'react'
import { CustomerShell } from '../../../components/layout/customer-shell'
import { ProfileView } from '../../../components/views/profile'

export default function ProfilePage() {
	return (
		<CustomerShell activePage='profile'>
			<ProfileView />
		</CustomerShell>
	)
}
