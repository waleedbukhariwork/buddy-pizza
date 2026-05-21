export type OrderStage = 'ACCEPTED' | 'PICKED UP' | 'DELIVERED'

export interface ActiveOrder {
	id: number
	code: string
	customer: string
	area: string
	items: number
	total: number
	stage: OrderStage
	eta: string
	distance: string
	phone: string
	accent: boolean
}

export const activeOrders: ActiveOrder[] = [
	{
		id: 2837,
		code: '#BF-2837',
		customer: 'Zoya Sheikh',
		area: 'Johar Town, Block J3',
		items: 4,
		total: 2890,
		stage: 'PICKED UP',
		eta: '12 min',
		distance: '3.2 km',
		phone: '+92 304 5678901',
		accent: true,
	},
	{
		id: 2838,
		code: '#BF-2838',
		customer: 'Bilal Ahmed',
		area: 'Model Town, Block C',
		items: 1,
		total: 690,
		stage: 'ACCEPTED',
		eta: 'ready in 4 min',
		distance: '4.8 km',
		phone: '+92 303 4567890',
		accent: false,
	},
]

export function rs(value: number): string {
	return `Rs. ${value.toLocaleString('en-PK')}`
}
