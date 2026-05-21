import useSWR from 'swr'
import { apiClient } from './api-client'

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

export interface Deal {
	id: number
	title: string
	description?: string | null
	tag?: string | null
	originalPrice?: number | null
	discountPrice?: number | null
	badge?: string | null
	isActive: boolean
}

export interface OrderItem {
	id: number
	product: { id: number; name: string; price: number } | null
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

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useProducts() {
	return useSWR<Product[]>('/v1/products', fetcher)
}

export function useCategories() {
	return useSWR<Category[]>('/v1/categories', fetcher)
}

export function useDeals() {
	return useSWR<Deal[]>('/v1/deals', fetcher)
}

export function useMyOrders() {
	return useSWR<Order[]>('/v1/orders', fetcher)
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
