import { create } from 'zustand'
import { User } from '@shared/index'

interface AuthStore {
	user: User | null
	token: string | null
	isLoading: boolean
	error: string | null
	setUser: (user: User | null) => void
	setToken: (token: string | null) => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	logout: () => void
	hydrate: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
	user: null,
	token: null,
	isLoading: false,
	error: null,
	setUser: (user) => set({ user }),
	setToken: (token) => set({ token }),
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),
	logout: () => {
		set({ user: null, token: null })
		if (typeof window !== 'undefined') {
			localStorage.removeItem('token')
			localStorage.removeItem('user')
		}
	},
	hydrate: () => {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('token')
			const user = localStorage.getItem('user')
			if (token) set({ token })
			if (user) set({ user: JSON.parse(user) })
		}
	},
}))
