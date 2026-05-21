import useSWR, { mutate as globalMutate } from 'swr'
import { apiClient } from './api-client'
import type { Order, DashboardMetrics, Product, Deal, Category } from './types'

async function fetcher<T>(url: string): Promise<T> {
	const { data } = await apiClient.get<T>(url)
	return data
}

export function useDashboardMetrics() {
	return useSWR<DashboardMetrics>('/v1/admin/dashboard', fetcher, {
		refreshInterval: 30_000,
	})
}

export function useOrders() {
	return useSWR<Order[]>('/v1/admin/orders', fetcher, {
		refreshInterval: 15_000,
	})
}

export function useProducts() {
	return useSWR<Product[]>('/v1/products', fetcher)
}

export function useCategories() {
	return useSWR<Category[]>('/v1/admin/categories', fetcher)
}

export function useDeals() {
	return useSWR<Deal[]>('/v1/admin/deals', fetcher)
}

export async function updateOrderStatus(id: number, status: string) {
	await apiClient.put(`/v1/admin/orders/${id}/status`, {}, { params: { status } })
	await globalMutate('/v1/admin/orders')
}

export async function createProduct(data: Omit<Product, 'id'>) {
	await apiClient.post('/v1/admin/products', data)
	await globalMutate('/v1/products')
}

export async function updateProduct(id: number, data: Partial<Product>) {
	await apiClient.put(`/v1/admin/products/${id}`, data)
	await globalMutate('/v1/products')
}

export async function deleteProduct(id: number) {
	await apiClient.delete(`/v1/admin/products/${id}`)
	await globalMutate('/v1/products')
}

export async function createCategory(data: Pick<Category, 'name'>) {
	const { data: category } = await apiClient.post<Category>('/v1/admin/categories', {
		name: data.name,
		isActive: true,
	})
	await globalMutate('/v1/admin/categories')
	return category
}

export async function saveDeal(id: number | null, data: Omit<Deal, 'id'>) {
	if (id) {
		await apiClient.put(`/v1/admin/deals/${id}`, data)
	} else {
		await apiClient.post('/v1/admin/deals', data)
	}
	await globalMutate('/v1/admin/deals')
}

export async function deleteDeal(id: number) {
	await apiClient.delete(`/v1/admin/deals/${id}`)
	await globalMutate('/v1/admin/deals')
}

export function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime()
	const mins = Math.floor(diff / 60_000)
	if (mins < 1) return 'just now'
	if (mins < 60) return `${mins} min ago`
	const hrs = Math.floor(mins / 60)
	return `${hrs}h ago`
}

export function rs(value: number): string {
	return `Rs. ${value.toLocaleString('en-PK')}`
}

export function shortAddress(address: string): string {
	if (!address) return '—'
	const parts = address.split(',')
	return parts[0].trim()
}

export function topItems(
	orders: Order[],
): { name: string; count: number }[] {
	const counts: Record<string, number> = {}
	for (const order of orders) {
		for (const item of order.items ?? []) {
			const name = item.product?.name ?? 'Unknown'
			counts[name] = (counts[name] ?? 0) + (item.quantity ?? 1)
		}
	}
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, count]) => ({ name, count }))
}
