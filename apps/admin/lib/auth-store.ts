import { create } from 'zustand'

interface AdminAuthStore {
	adminToken: string | null
	isHydrated: boolean
	isLoading: boolean
	error: string | null
	setToken: (token: string) => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	logout: () => void
	hydrate: () => void
}

export const useAdminAuthStore = create<AdminAuthStore>((set) => ({
	adminToken: null,
	isHydrated: false,
	isLoading: false,
	error: null,
	setToken: (adminToken) => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('adminToken', adminToken)
		}
		set({ adminToken })
	},
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),
	logout: () => {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('adminToken')
		}
		set({ adminToken: null })
	},
	hydrate: () => {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('adminToken')
			set({ adminToken: token, isHydrated: true })
		}
	},
}))
