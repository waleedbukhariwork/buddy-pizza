import useSWR from 'swr'
import { apiClient } from './api-client'
import type { User } from '@shared/index'

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
	items?: string | null
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

export function useMyOrders() {
	return useSWR<Order[]>('/v1/orders', fetcher)
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
	items: Array<{ productId: number; quantity: number; customizations?: string }>
	deliveryAddress: string
	customerPhone: string
	specialNotes?: string
}): Promise<PlacedOrder> {
	const { data } = await apiClient.post<PlacedOrder>('/v1/orders', payload)
	return data
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
