import { create } from 'zustand'

const AREAS = [
	'DHA Phase 5',
	'DHA Phase 6',
	'Gulberg',
	'Johar Town',
	'Model Town',
	'Bahria Town',
] as const

export type DeliveryArea = (typeof AREAS)[number]

interface DeliveryStore {
	area: DeliveryArea
	etaMinutes: number
	hydrate: () => void
	setArea: (area: DeliveryArea) => void
}

function loadArea(): DeliveryArea {
	if (typeof window === 'undefined') return AREAS[0]
	try {
		const saved = localStorage.getItem('bf_delivery_area')
		if (saved && (AREAS as readonly string[]).includes(saved)) return saved as DeliveryArea
	} catch { /* ignore */ }
	return AREAS[0]
}

export function formatEta(minutes: number): string {
	const d = new Date()
	d.setMinutes(d.getMinutes() + minutes)
	return d.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })
}

export const DELIVERY_AREAS = AREAS

export const useDeliveryStore = create<DeliveryStore>((set) => ({
	area: AREAS[0],
	etaMinutes: 28,
	hydrate: () => set({ area: loadArea() }),
	setArea: (area) => {
		localStorage.setItem('bf_delivery_area', area)
		set({ area, etaMinutes: 25 + (area.length % 8) })
	},
}))
