// Shared types used across all apps

export interface Restaurant {
	id: number
	name: string
	phone: string
	address: string
	city: string
	isOpen: boolean
}

export interface Category {
	id: number
	name: string
	icon: string
	displayOrder: number
}

export interface Product {
	id: number
	name: string
	description: string
	price: number
	category: string
	imageUrl?: string | null
	isAvailable: boolean
	isHot: boolean
	hasSizes: boolean
	priceSmall?: number | null
	priceMedium?: number | null
	priceLarge?: number | null
}

export interface Deal {
	id: number
	title: string
	description: string
	tag: string
	originalPrice: number
	discountPrice: number
	badge: string
	items?: string | null
	isActive: boolean
}

export interface User {
	id: number
	name: string
	phone: string
	email: string
	address: string
}

export interface OrderItem {
	productName: string
	quantity: number
	price: number
}

export interface Order {
	id: number
	orderNumber: string
	items: OrderItem[]
	total: number
	status:
		| 'NEW'
		| 'PREPARING'
		| 'READY'
		| 'WITH_RIDER'
		| 'DELIVERED'
		| 'CANCELLED'
	deliveryAddress: string
	createdAt: string
}

export interface Rider {
	id: number
	riderId: string
	phone: string
	status: 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY'
	completedOrders: number
	rating: number
}

export interface DashboardMetrics {
	activeOrders: number
	salesToday: number
	avgOrderValue: number
	deliveredToday: number
	sparklineData: number[]
}

export interface CartItem {
	productId: number
	dealId?: number
	productName: string
	price: number
	quantity: number
	size?: string
	sizePrice?: number
	customizations?: string
}

export interface CreateOrderRequest {
	items: Array<{
		productId: number
		quantity: number
		customizations?: string
	}>
	deliveryAddress: string
	customerPhone: string
	specialNotes?: string
}

export interface AuthResponse {
	token: string
	message: string
	user?: User
}

export interface LoginRequest {
	phoneOrEmail: string
	password: string
}

export interface RegisterRequest {
	name: string
	phone: string
	email: string
	password: string
	address: string
	city: string
}
