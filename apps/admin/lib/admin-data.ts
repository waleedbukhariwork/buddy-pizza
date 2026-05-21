export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'WITH_RIDER' | 'DELIVERED'

export const orders: Array<{
	id: number
	code: string
	customer: string
	area: string
	items: number
	total: number
	status: OrderStatus
	time: string
}> = [
	{
		id: 2841,
		code: '#BF-2841',
		customer: 'Ayesha Khan',
		area: 'DHA Phase 5',
		items: 3,
		total: 2190,
		status: 'NEW',
		time: '2 min ago',
	},
	{
		id: 2840,
		code: '#BF-2840',
		customer: 'Hamza Iqbal',
		area: 'Gulberg III',
		items: 2,
		total: 1290,
		status: 'PREPARING',
		time: '8 min ago',
	},
	{
		id: 2838,
		code: '#BF-2838',
		customer: 'Bilal Ahmed',
		area: 'Model Town',
		items: 1,
		total: 690,
		status: 'READY',
		time: '15 min ago',
	},
	{
		id: 2837,
		code: '#BF-2837',
		customer: 'Zoya Sheikh',
		area: 'Johar Town',
		items: 4,
		total: 2890,
		status: 'WITH_RIDER',
		time: '22 min ago',
	},
]

export const products = [
	{ id: 1, name: 'Buddy Pepperoni', category: 'Pizza', price: 1290, stock: 'In stock' },
	{ id: 2, name: 'Smokehouse BBQ', category: 'Pizza', price: 1390, stock: 'In stock' },
	{ id: 3, name: 'Buddy Smash', category: 'Burgers', price: 690, stock: 'Low' },
	{ id: 4, name: 'Loaded Cheese Fries', category: 'Fries', price: 390, stock: 'In stock' },
]

export const riders = [
	{ id: 'BF-R-014', name: 'Usman K.', status: 'ONLINE', completed: 6, rating: 4.9 },
	{ id: 'BF-R-009', name: 'Danish A.', status: 'ON_DELIVERY', completed: 8, rating: 4.8 },
	{ id: 'BF-R-021', name: 'Maira S.', status: 'OFFLINE', completed: 4, rating: 4.7 },
]

export function rs(value: number) {
	return `Rs. ${value.toLocaleString('en-PK')}`
}
