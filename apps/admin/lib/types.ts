export type OrderStatus =
	| 'NEW'
	| 'PREPARING'
	| 'READY'
	| 'WITH_RIDER'
	| 'DELIVERED'
	| 'CANCELLED'

export interface OrderItem {
	id: number
	product: { id: number; name: string; price: number } | null
	quantity: number
	price: number
	customizations?: string | null
}

export interface Order {
	id: number
	orderNumber: string
	user: { id: number; name: string; phone: string } | null
	items: OrderItem[]
	subtotal?: number
	deliveryFee?: number
	discount?: number
	total: number
	status: OrderStatus
	deliveryAddress: string
	customerPhone?: string
	specialNotes?: string | null
	rider?: { id: number; riderId: string } | null
	createdAt: string
	updatedAt?: string
}

export interface DashboardMetrics {
	activeOrders: number
	salesToday: number
	avgOrderValue: number
	deliveredToday: number
	sparklineData: number[]
}

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
	isFeatured?: boolean | null
}
