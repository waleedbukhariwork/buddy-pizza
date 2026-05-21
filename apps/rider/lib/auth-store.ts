import { create } from 'zustand'
import { Rider } from '@shared/index'

interface RiderAuthStore {
	rider: Rider | null
	riderToken: string | null
	isLoading: boolean
	error: string | null
	setRider: (rider: Rider | null) => void
	setToken: (token: string | null) => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	logout: () => void
	hydrate: () => void
}

export const useRiderAuthStore = create<RiderAuthStore>((set) => ({
	rider: null,
	riderToken: null,
	isLoading: false,
	error: null,
	setRider: (rider) => set({ rider }),
	setToken: (riderToken) => set({ riderToken }),
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),
	logout: () => {
		set({ rider: null, riderToken: null })
		if (typeof window !== 'undefined') {
			localStorage.removeItem('riderToken')
			localStorage.removeItem('rider')
		}
	},
	hydrate: () => {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('riderToken')
			const rider = localStorage.getItem('rider')
			if (token) set({ riderToken: token })
			if (rider) set({ rider: JSON.parse(rider) })
		}
	},
}))
