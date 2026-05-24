export * from './types'

// API client configuration
export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export const ROUTES = {
	// Auth
	AUTH_CUSTOMER_LOGIN: '/auth/customer/login',
	AUTH_CUSTOMER_REGISTER: '/auth/customer/register',
	AUTH_ADMIN_LOGIN: '/v1/auth/admin/login',
	AUTH_RIDER_LOGIN: '/auth/rider/login',

	// Products
	PRODUCTS: '/products',
	PRODUCT: (id: number) => `/products/${id}`,

	// Deals
	DEALS: '/deals',
	DEAL: (id: number) => `/deals/${id}`,

	// Orders
	ORDERS: '/orders',
	ORDER: (id: number) => `/orders/${id}`,
	USER_ORDERS: (userId: number) => `/orders/user/${userId}`,

	// Admin
	ADMIN_DASHBOARD: '/admin/dashboard',
	ADMIN_PRODUCTS: '/admin/products',
	ADMIN_PRODUCTS_CREATE: '/admin/products',
	ADMIN_PRODUCT_UPDATE: (id: number) => `/admin/products/${id}`,
	ADMIN_PRODUCT_DELETE: (id: number) => `/admin/products/${id}`,
	ADMIN_DEALS: '/admin/deals',
	ADMIN_ORDERS: '/admin/orders',
	ADMIN_ORDER_STATUS: (id: number) => `/admin/orders/${id}/status`,

	// Rider
	RIDER: (id: number) => `/rider/${id}`,
	RIDER_ORDERS: (riderId: number) => `/rider/${riderId}/orders`,
	RIDER_ORDER_STATUS: (orderId: number) => `/rider/orders/${orderId}/status`,
}

export const COLORS = {
	// Primary
	PRIMARY: '#E8431F',
	PRIMARY_DARK: '#C8330F',

	// Accent
	AMBER: '#FFB627',
	AMBER_DARK: '#E89A0E',
	LEAF: '#2F8F4E',

	// Neutral
	INK: '#231F20',
	INK_2: '#4A4244',
	MUTE: '#8C8487',
	CREAM: '#FFF7EE',
	CREAM_2: '#F9EDDB',
	PAPER: '#FFFFFF',
	LINE: '#ECE2D2',

	// Status
	STATUS_NEW: '#3B82F6',
	STATUS_PREP: '#FFB627',
	STATUS_READY: '#2F8F4E',
	STATUS_RIDER: '#8B5CF6',
	STATUS_DONE: '#8C8487',
}

export const STATUS_LABELS = {
	NEW: 'New',
	PREPARING: 'Preparing',
	READY: 'Ready',
	WITH_RIDER: 'With rider',
	DELIVERED: 'Delivered',
	CANCELLED: 'Cancelled',
}

export const STATUS_COLORS: Record<string, string> = {
	NEW: COLORS.STATUS_NEW,
	PREPARING: COLORS.STATUS_PREP,
	READY: COLORS.STATUS_READY,
	WITH_RIDER: COLORS.STATUS_RIDER,
	DELIVERED: COLORS.STATUS_DONE,
	CANCELLED: COLORS.MUTE,
}
