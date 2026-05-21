import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem } from '@shared/index'

interface CartStore {
	items: CartItem[]
	total: number
	addItem: (item: CartItem) => void
	removeItem: (productId: number, size?: string, dealId?: number) => void
	updateQuantity: (productId: number, quantity: number, size?: string, dealId?: number) => void
	clearCart: () => void
	calculateTotal: () => void
}

function matchItem(i: CartItem, productId: number, size?: string, dealId?: number) {
	if (dealId != null) return i.dealId === dealId
	return i.productId === productId && (i.size ?? '') === (size ?? '')
}

function linePrice(i: CartItem) {
	return (i.sizePrice ?? i.price) * i.quantity
}

export const useCartStore = create<CartStore>()(
	persist(
		(set) => ({
			items: [],
			total: 0,
			addItem: (item) =>
				set((state) => {
					const existing = state.items.find((i) =>
						item.dealId != null
							? i.dealId === item.dealId
							: i.productId === item.productId && (i.size ?? '') === (item.size ?? ''),
					)
					if (existing) {
						existing.quantity += item.quantity
					} else {
						state.items.push(item)
					}
					const items = [...state.items]
					const total = items.reduce((sum, i) => sum + linePrice(i), 0)
					return { items, total }
				}),
			removeItem: (productId, size, dealId) =>
				set((state) => {
					const items = state.items.filter((i) => !matchItem(i, productId, size, dealId))
					const total = items.reduce((sum, i) => sum + linePrice(i), 0)
					return { items, total }
				}),
			updateQuantity: (productId, quantity, size, dealId) =>
				set((state) => {
					const item = state.items.find((i) => matchItem(i, productId, size, dealId))
					if (item) item.quantity = quantity
					const items = [...state.items]
					const total = items.reduce((sum, i) => sum + linePrice(i), 0)
					return { items, total }
				}),
			clearCart: () => set({ items: [], total: 0 }),
			calculateTotal: () =>
				set((state) => ({
					total: state.items.reduce((sum, i) => sum + linePrice(i), 0),
				})),
		}),
		{
			name: 'bf_cart',
			storage: createJSONStorage(() => localStorage),
			// Hydrate manually in CartSyncProvider to avoid SSR mismatch
			skipHydration: true,
		},
	),
)
