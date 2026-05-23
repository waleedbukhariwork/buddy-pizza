import useSWR from 'swr'
import { apiClient } from './api-client'
import type { User, CartItem } from '@shared/index'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Product {
	id: number
	name: string
	description?: string | null
	price: number
	categoryId?: number | null
	category: string
	imageUrl?: string | null
	isAvailable: boolean
	isHot?: boolean
	hasSizes?: boolean
	priceSmall?: number | null
	priceMedium?: number | null
	priceLarge?: number | null
}

export interface Category {
	id: number
	name: string
	icon?: string | null
	displayOrder?: number | null
	isActive: boolean
}

export interface OptionGroup {
	label: string
	type: 'single' | 'multi'
	required: boolean
	choices: string[]
}

export interface DealItem {
	productId?: number | null
	name: string
	qty: number
	unitPrice: number
	options?: OptionGroup[]
	// Legacy fields kept for backward compat with old deal items
	size?: string | null
	availableFlavors?: string[]
}

export interface Deal {
	id: number
	title: string
	description?: string | null
	tag?: string | null
	originalPrice?: number | null
	discountPrice?: number | null
	badge?: string | null
	items?: string | null
	isActive: boolean
	imageUrl?: string | null
	termsText?: string | null
	startsAt?: string | null
	expiresAt?: string | null
	maxOrders?: number | null
	ordersCount?: number | null
	displayOrder?: number | null
}

export function parseDealItems(raw: string | null | undefined): DealItem[] {
	if (!raw?.trim()) return []
	if (raw.trim().startsWith('[')) {
		try {
			return JSON.parse(raw) as DealItem[]
		} catch {
			// fall through to legacy format
		}
	}
	return raw.split('\n').filter(Boolean).map(line => {
		const m = line.match(/^(\d+)×\s*(.+)$/)
		return { name: m ? m[2] : line, qty: m ? parseInt(m[1]) : 1, unitPrice: 0, availableFlavors: [] }
	})
}

export function getDealExpiryBadge(expiresAt: string | null | undefined): { text: string; urgent: boolean } | null {
	if (!expiresAt) return null
	const diff = new Date(expiresAt).getTime() - Date.now()
	if (diff < 0) return null
	const hours = Math.floor(diff / 3_600_000)
	if (hours < 2) return { text: 'Ending soon!', urgent: true }
	if (hours < 24) return { text: `Ends in ${hours}h`, urgent: true }
	const days = Math.floor(hours / 24)
	if (days <= 7) return { text: `Ends in ${days} day${days > 1 ? 's' : ''}`, urgent: false }
	return null
}

export interface OrderItem {
	id: number
	productId: number | null
	dealId: number | null
	productName: string | null
	itemName: string | null
	quantity: number
	price: number
}

export interface Order {
	id: number
	orderNumber: string
	items: OrderItem[]
	total: number
	status: string
	deliveryAddress: string
	createdAt: string
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────
async function fetcher<T>(url: string): Promise<T> {
	const { data } = await apiClient.get<T>(url)
	return data
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PageResponse<T> {
	content: T[]
	page: number
	size: number
	totalElements: number
	totalPages: number
	last: boolean
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useProducts() {
	return useSWR<Product[]>('/v1/products', fetcher)
}

export function useProductSearch(q: string, categoryId: number | null, page: number, size = 12) {
	const params = new URLSearchParams({ q, page: String(page), size: String(size) })
	if (categoryId !== null) params.set('categoryId', String(categoryId))
	const key = q.trim().length > 0 ? `/v1/products/search?${params}` : null
	return useSWR<PageResponse<Product>>(key, fetcher)
}

export function useCategories() {
	return useSWR<Category[]>('/v1/categories', fetcher)
}

export function useDeals() {
	return useSWR<Deal[]>('/v1/deals', fetcher)
}

export function useMyOrders(enabled = true) {
	return useSWR<Order[]>(enabled ? '/v1/orders' : null, fetcher)
}

export function useMyProfile(enabled = true) {
	return useSWR<User>(enabled ? '/v1/users/me' : null, fetcher)
}

// ─── Profile mutations ────────────────────────────────────────────────────────
export async function updateProfile(data: { name?: string; email?: string; address?: string }): Promise<User> {
	const res = await apiClient.put<User>('/v1/users/me', data)
	return res.data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
	await apiClient.put('/v1/users/me/password', { currentPassword, newPassword })
}

// ─── Order placement ──────────────────────────────────────────────────────────
export interface PlacedOrder {
	id: number
	orderNumber: string
	total: number
	status: string
	deliveryAddress: string
	createdAt: string
	items: Array<{ productName: string; quantity: number; price: number }>
}

export async function placeOrder(payload: {
	items: Array<{ productId?: number; dealId?: number; itemName?: string; price?: number; quantity: number; customizations?: string }>
	deliveryAddress: string
	customerPhone: string
	specialNotes?: string
}): Promise<PlacedOrder> {
	const { data } = await apiClient.post<PlacedOrder>('/v1/orders', payload)
	return data
}

// ─── Server cart ──────────────────────────────────────────────────────────────
export interface ServerCartDTO {
	userId: number
	items: CartItem[]
	total: number
	updatedAt: string | null
}

export function useServerCart() {
	return useSWR<ServerCartDTO>('/v1/cart', fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	})
}

export async function syncCartToServer(items: CartItem[]): Promise<ServerCartDTO> {
	const { data } = await apiClient.put<ServerCartDTO>('/v1/cart', items)
	return data
}

export async function clearServerCart(): Promise<void> {
	await apiClient.delete('/v1/cart')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function rs(value: number): string {
	return `Rs. ${value.toLocaleString('en-PK')}`
}

export function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime()
	const mins = Math.floor(diff / 60_000)
	if (mins < 1) return 'just now'
	if (mins < 60) return `${mins} min ago`
	const hrs = Math.floor(mins / 60)
	if (hrs < 24) return `${hrs}h ago`
	return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}
