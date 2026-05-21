import { create } from 'zustand'
import { CartItem } from '@shared/index'

interface CartStore {
	items: CartItem[]
	total: number
	addItem: (item: CartItem) => void
	removeItem: (productId: number, size?: string) => void
	updateQuantity: (productId: number, quantity: number, size?: string) => void
	clearCart: () => void
	calculateTotal: () => void
}

function matchItem(i: CartItem, productId: number, size?: string) {
	return i.productId === productId && (i.size ?? '') === (size ?? '')
}

export const useCartStore = create<CartStore>((set) => ({
	items: [],
	total: 0,
	addItem: (item) =>
		set((state) => {
			const existing = state.items.find((i) => matchItem(i, item.productId, item.size))
			if (existing) {
				existing.quantity += item.quantity
			} else {
				state.items.push(item)
			}
			const items = [...state.items]
			const total = items.reduce((sum, i) => sum + (i.sizePrice ?? i.price) * i.quantity, 0)
			return { items, total }
		}),
	removeItem: (productId, size) =>
		set((state) => {
			const items = state.items.filter((i) => !matchItem(i, productId, size))
			const total = items.reduce((sum, i) => sum + (i.sizePrice ?? i.price) * i.quantity, 0)
			return { items, total }
		}),
	updateQuantity: (productId, quantity, size) =>
		set((state) => {
			const item = state.items.find((i) => matchItem(i, productId, size))
			if (item) item.quantity = quantity
			const items = [...state.items]
			const total = items.reduce((sum, i) => sum + (i.sizePrice ?? i.price) * i.quantity, 0)
			return { items, total }
		}),
	clearCart: () => set({ items: [], total: 0 }),
	calculateTotal: () =>
		set((state) => ({
			total: state.items.reduce((sum, i) => sum + (i.sizePrice ?? i.price) * i.quantity, 0),
		})),
}))
