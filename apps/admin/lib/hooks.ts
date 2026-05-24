import useSWR, { mutate as globalMutate } from 'swr'
import { apiClient } from './api-client'
import type { AdminProfile, Order, DashboardMetrics, Product, Deal, Category, SubCategory } from './types'

async function fetcher<T>(url: string): Promise<T> {
	const { data } = await apiClient.get<T>(url)
	return data
}

function extractArray<T>(
	payload: unknown,
	preferredKeys: string[] = [],
): T[] | null {
	if (Array.isArray(payload)) return payload as T[]
	if (!payload || typeof payload !== 'object') return null

	const record = payload as Record<string, unknown>
	const keys = [...preferredKeys, 'data', 'content', 'items', 'results']

	for (const key of keys) {
		if (!Object.prototype.hasOwnProperty.call(record, key)) continue

		const nested = extractArray<T>(record[key])
		if (nested) return nested
	}

	return null
}

async function fetchList<T>(
	url: string,
	preferredKeys: string[] = [],
): Promise<T[]> {
	const data = await fetcher<unknown>(url)
	return extractArray<T>(data, preferredKeys) ?? []
}

export function useAdminProfile() {
	return useSWR<AdminProfile>('/v1/admin/profile', fetcher)
}

export async function updateAdminProfile(data: { name?: string; avatarUrl?: string }): Promise<AdminProfile> {
	const { data: profile } = await apiClient.put<AdminProfile>('/v1/admin/profile', data)
	await globalMutate('/v1/admin/profile')
	return profile
}

export async function updateAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
	await apiClient.put('/v1/admin/password', { currentPassword, newPassword })
}

export function useDashboardMetrics() {
	return useSWR<DashboardMetrics>('/v1/admin/dashboard', fetcher, {
		refreshInterval: 30_000,
	})
}

export function useOrders() {
	return useSWR<Order[]>(
		'/v1/admin/orders',
		(url: string) => fetchList<Order>(url, ['orders']),
		{
			refreshInterval: 15_000,
		},
	)
}

export function useProducts() {
	return useSWR<Product[]>('/v1/products', (url: string) =>
		fetchList<Product>(url, ['products']),
	)
}

export function useCategories() {
	return useSWR<Category[]>('/v1/admin/categories', (url: string) =>
		fetchList<Category>(url, ['categories']),
	)
}

export function useDeals() {
	return useSWR<Deal[]>('/v1/admin/deals', (url: string) =>
		fetchList<Deal>(url, ['deals']),
	)
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

export function useSubCategories(categoryId: number | null) {
	return useSWR<SubCategory[]>(
		categoryId != null ? `/v1/admin/subcategories?categoryId=${categoryId}` : null,
		(url: string) => fetchList<SubCategory>(url),
	)
}

export async function createSubCategory(data: { categoryId: number; name: string; displayOrder?: number }): Promise<SubCategory> {
	const { data: sub } = await apiClient.post<SubCategory>('/v1/admin/subcategories', data)
	await globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/v1/admin/subcategories'), undefined, { revalidate: true })
	return sub
}

export async function updateSubCategory(id: number, data: { name?: string; displayOrder?: number; isActive?: boolean }): Promise<SubCategory> {
	const { data: sub } = await apiClient.put<SubCategory>(`/v1/admin/subcategories/${id}`, data)
	await globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/v1/admin/subcategories'), undefined, { revalidate: true })
	return sub
}

export async function deleteSubCategory(id: number): Promise<void> {
	await apiClient.delete(`/v1/admin/subcategories/${id}`)
	await globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/v1/admin/subcategories'), undefined, { revalidate: true })
}

export async function createCategory(data: { name: string; icon?: string; displayOrder?: number }): Promise<Category> {
	const { data: category } = await apiClient.post<Category>('/v1/admin/categories', { ...data, isActive: true })
	await globalMutate('/v1/admin/categories')
	return category
}

export async function updateCategory(id: number, data: { name?: string; icon?: string; displayOrder?: number; isActive?: boolean }): Promise<Category> {
	const { data: category } = await apiClient.put<Category>(`/v1/admin/categories/${id}`, data)
	await globalMutate('/v1/admin/categories')
	return category
}

export async function deleteCategory(id: number): Promise<void> {
	await apiClient.delete(`/v1/admin/categories/${id}`)
	await globalMutate('/v1/admin/categories')
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
			const name = item.itemName ?? item.product?.name ?? 'Unknown'
			counts[name] = (counts[name] ?? 0) + (item.quantity ?? 1)
		}
	}
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, count]) => ({ name, count }))
}
