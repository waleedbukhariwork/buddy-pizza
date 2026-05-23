'use client'

import React from 'react'
import Link from 'next/link'
import { activeOrders, rs, type ActiveOrder } from '../lib/rider-data'

// ─── Icons ───────────────────────────────────────────────────────────────────
function Icon({
	size = 18,
	sw = 1.8,
	children,
}: {
	size?: number
	sw?: number
	children: React.ReactNode
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={sw}
			strokeLinecap='round'
			strokeLinejoin='round'
			style={{ flexShrink: 0 }}
		>
			{children}
		</svg>
	)
}

const Icons = {
	arrow: (
		<Icon>
			<path d='M5 12h14M13 6l6 6-6 6' />
		</Icon>
	),
	back: (
		<Icon>
			<path d='M19 12H5M11 6l-6 6 6 6' />
		</Icon>
	),
	phone: (
		<Icon>
			<path d='M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' />
		</Icon>
	),
	pin: (
		<Icon>
			<path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z' />
			<circle cx='12' cy='9' r='2.6' />
		</Icon>
	),
	clock: (
		<Icon>
			<circle cx='12' cy='12' r='9' />
			<path d='M12 7v5l3 2' />
		</Icon>
	),
	check: (
		<Icon sw={2.2}>
			<path d='M4 12l5 5L20 6' />
		</Icon>
	),
	list: (
		<Icon>
			<path d='M8 6h12M8 12h12M8 18h12' />
			<circle cx='4' cy='6' r='1' fill='currentColor' />
			<circle cx='4' cy='12' r='1' fill='currentColor' />
			<circle cx='4' cy='18' r='1' fill='currentColor' />
		</Icon>
	),
	map: (
		<Icon>
			<path d='M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z' />
			<path d='M9 3v15M15 6v15' />
		</Icon>
	),
	receipt: (
		<Icon>
			<path d='M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3z' />
			<path d='M9 8h6M9 12h6' />
		</Icon>
	),
	user: (
		<Icon>
			<circle cx='12' cy='8' r='3.5' />
			<path d='M4.5 20a7.5 7.5 0 0 1 15 0' />
		</Icon>
	),
	bell: (
		<Icon>
			<path d='M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16zM10 20a2 2 0 0 0 4 0' />
		</Icon>
	),
	bike: (
		<Icon>
			<circle cx='5.5' cy='17.5' r='3' />
			<circle cx='18.5' cy='17.5' r='3' />
			<path d='M5.5 17.5 9 9h5l3 6.5M14 9h3M9 9l2 5h6.5' />
		</Icon>
	),
}

// ─── Tone type ────────────────────────────────────────────────────────────────
type Tone = 'cream' | 'ember' | 'amber' | 'ink'

const TONE_CLASS: Record<Tone, string> = {
	cream: '',
	ember: 'bf-img-ember',
	amber: 'bf-img-amber',
	ink: 'bf-img-ink',
}

// ─── Food img placeholder ────────────────────────────────────────────────────
function FoodImg({
	tone = 'cream',
	style,
}: {
	tone?: Tone
	style?: React.CSSProperties
}) {
	return <div className={`bf-img ${TONE_CLASS[tone]}`} style={style} />
}

// ─── Tab bar item ─────────────────────────────────────────────────────────────
interface TabItem {
	icon: React.ReactElement
	label: string
	active: boolean
	href: string
}

const TAB_ITEMS: TabItem[] = [
	{ icon: Icons.list, label: 'Orders', active: true, href: '/' },
	{ icon: Icons.map, label: 'Map', active: false, href: '/' },
	{ icon: Icons.receipt, label: 'Earnings', active: false, href: '/' },
	{ icon: Icons.user, label: 'Me', active: false, href: '/' },
]

// ─── RIDER LOGIN ──────────────────────────────────────────────────────────────
export function RiderLogin() {
	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'var(--bf-ink)',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: 24,
				}}
			>
				<div style={{ width: '100%', maxWidth: 400 }}>
					<div className='bf-logo' style={{ color: '#fff', marginBottom: 48 }}>
						<span className='bf-logo-dot' style={{ background: '#fff' }} />
						Buddy Feast
						<small
							style={{
								fontSize: '0.5em',
								fontFamily: 'var(--bf-mono)',
								fontWeight: 600,
								letterSpacing: '0.18em',
								textTransform: 'uppercase',
								color: 'rgba(255,255,255,.6)',
								marginLeft: 4,
							}}
						>
							RIDER
						</small>
					</div>

					<div style={{ position: 'relative' }}>
						<div
							style={{
								position: 'absolute',
								right: -60,
								top: -20,
								width: 160,
								height: 160,
								borderRadius: '50%',
								background: 'var(--bf-ember)',
								opacity: 0.35,
								pointerEvents: 'none',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								left: -40,
								bottom: 60,
								width: 120,
								height: 120,
								borderRadius: '50%',
								background: 'var(--bf-amber)',
								opacity: 0.2,
								pointerEvents: 'none',
							}}
						/>
						<div style={{ position: 'relative' }}>
							<div className='bf-eyebrow' style={{ color: 'var(--bf-amber)' }}>
								RIDER APP
							</div>
							<h1
								style={{
									fontWeight: 900,
									fontSize: 42,
									color: '#fff',
									margin: '8px 0 6px',
									letterSpacing: '-0.035em',
									lineHeight: 0.92,
								}}
							>
								Sign in.
								<br />
								Start riding.
							</h1>
							<p
								style={{
									color: 'rgba(255,255,255,.65)',
									fontSize: 14,
									marginBottom: 28,
								}}
							>
								Track orders, pickups, and deliveries on the go.
							</p>

							<div
								style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
							>
								<div>
									<div
										style={{
											font: '600 11px var(--bf-font)',
											color: 'rgba(255,255,255,.5)',
											marginBottom: 6,
											letterSpacing: '.02em',
										}}
									>
										RIDER ID
									</div>
									<input
										className='bf-input'
										defaultValue='BF-R-014'
										style={{
											background: 'rgba(255,255,255,.05)',
											color: '#fff',
											border: '1px solid rgba(255,255,255,.12)',
										}}
									/>
								</div>
								<div>
									<div
										style={{
											font: '600 11px var(--bf-font)',
											color: 'rgba(255,255,255,.5)',
											marginBottom: 6,
											letterSpacing: '.02em',
										}}
									>
										PIN
									</div>
									<input
										className='bf-input'
										type='password'
										defaultValue='1234'
										style={{
											background: 'rgba(255,255,255,.05)',
											color: '#fff',
											border: '1px solid rgba(255,255,255,.12)',
											letterSpacing: '.3em',
											fontSize: 18,
										}}
									/>
								</div>
								<Link
									href='/'
									className='bf-btn bf-btn-primary bf-btn-lg'
									style={{
										width: '100%',
										marginTop: 8,
										justifyContent: 'space-between',
									}}
								>
									<span>Start shift</span>
									{Icons.arrow}
								</Link>
								<a
									href='#'
									onClick={(e) => e.preventDefault()}
									style={{
										color: 'var(--bf-amber)',
										textAlign: 'center',
										font: '600 12px var(--bf-font)',
										textDecoration: 'none',
										marginTop: 6,
									}}
								>
									Forgot PIN?
								</a>
							</div>
						</div>
					</div>

					<div
						style={{
							padding: 14,
							borderRadius: 12,
							background: 'rgba(255,255,255,.05)',
							display: 'flex',
							gap: 12,
							alignItems: 'center',
							marginTop: 48,
						}}
					>
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: 'var(--bf-amber)',
								color: 'var(--bf-ink)',
								display: 'grid',
								placeItems: 'center',
							}}
						>
							{Icons.phone}
						</div>
						<div style={{ flex: 1 }}>
							<div style={{ font: '700 13px var(--bf-font)', color: '#fff' }}>
								Dispatch line
							</div>
							<div
								className='bf-mono'
								style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}
							>
								+92 42 111 BUDDY
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Shift stat ───────────────────────────────────────────────────────────────
function ShiftStat({
	label,
	value,
	highlight,
}: {
	label: string
	value: string
	highlight?: boolean
}) {
	return (
		<div>
			<div
				className='bf-mono'
				style={{
					fontSize: 9.5,
					letterSpacing: '.08em',
					color: highlight ? 'var(--bf-amber)' : 'rgba(255,255,255,.5)',
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontWeight: 800,
					fontSize: 20,
					color: highlight ? 'var(--bf-amber)' : '#fff',
					marginTop: 2,
					letterSpacing: '-0.022em',
				}}
				className='bf-tabular'
			>
				{value}
			</div>
		</div>
	)
}

// ─── Rider order card ─────────────────────────────────────────────────────────
function RiderOrderCard({ order }: { order: ActiveOrder }) {
	const isPickedUp = order.stage === 'PICKED UP'
	const stageLabel = isPickedUp ? 'En route' : 'Pickup pending'
	const stageColor = isPickedUp ? 'var(--bf-ember)' : 'var(--bf-amber)'
	return (
		<div
			className='bf-card'
			style={{
				padding: 14,
				marginBottom: 10,
				border: order.accent
					? '1.5px solid var(--bf-ember)'
					: '1px solid var(--bf-line)',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}
			>
				<div>
					<span className='bf-mono' style={{ fontSize: 11, fontWeight: 700 }}>
						{order.code}
					</span>
					<div style={{ font: '800 16px var(--bf-font)', marginTop: 2 }}>
						{order.customer}
					</div>
				</div>
				<span
					className='bf-pill'
					style={{
						background: stageColor,
						color: isPickedUp ? '#fff' : 'var(--bf-ink)',
						boxShadow: 'none',
					}}
				>
					{stageLabel}
				</span>
			</div>
			<div
				style={{
					display: 'flex',
					gap: 6,
					marginTop: 10,
					alignItems: 'flex-start',
					color: 'var(--bf-ink-2)',
					fontSize: 12.5,
				}}
			>
				<span style={{ width: 14, color: 'var(--bf-mute)', marginTop: 1 }}>
					{Icons.pin}
				</span>
				<span style={{ flex: 1 }}>{order.area}</span>
			</div>
			<div
				style={{
					display: 'flex',
					gap: 14,
					marginTop: 8,
					fontSize: 11.5,
					color: 'var(--bf-mute)',
				}}
			>
				<span className='bf-mono'>
					{order.items} ITEM{order.items === 1 ? '' : 'S'}
				</span>
				<span className='bf-mono'>{rs(order.total)} · COD</span>
				<span className='bf-mono'>{order.distance}</span>
			</div>
			<hr className='bf-rule' style={{ margin: '12px 0 10px' }} />
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<span
					style={{
						font: '700 12px var(--bf-font)',
						color: 'var(--bf-ink-2)',
						display: 'flex',
						alignItems: 'center',
						gap: 4,
					}}
				>
					{Icons.clock} {order.eta}
				</span>
				<Link
					href={`/orders/${order.id}`}
					className='bf-btn bf-btn-ink bf-btn-sm'
					style={{ flex: 1, maxWidth: 180, justifyContent: 'space-between' }}
				>
					<span>Open</span>
					{Icons.arrow}
				</Link>
			</div>
		</div>
	)
}

// ─── RIDER DASHBOARD ──────────────────────────────────────────────────────────
export function RiderDashboard() {
	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'var(--bf-cream)',
				paddingBottom: 100,
			}}
		>
			<div style={{ padding: '16px 20px 0' }}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div>
						<div
							className='bf-mono'
							style={{ fontSize: 10, color: 'var(--bf-mute)' }}
						>
							GOOD EVENING
						</div>
						<div style={{ font: '800 18px var(--bf-font)' }}>Usman K.</div>
					</div>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 6,
							padding: '6px 12px',
							borderRadius: 999,
							background: 'var(--bf-leaf)',
							color: '#fff',
							font: '700 11px var(--bf-font)',
						}}
					>
						<span
							style={{
								width: 7,
								height: 7,
								borderRadius: '50%',
								background: '#fff',
							}}
						/>
						ONLINE
					</div>
				</div>

				<div
					style={{
						marginTop: 14,
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: 8,
						padding: 14,
						borderRadius: 14,
						background: 'var(--bf-ink)',
						color: '#fff',
					}}
				>
					<ShiftStat label='DELIVERED' value='6' />
					<ShiftStat label='ACTIVE' value='2' highlight />
					<ShiftStat label='EARNINGS' value='Rs. 480' />
				</div>
			</div>

			<div style={{ padding: '20px 20px 0' }}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'baseline',
						marginBottom: 12,
					}}
				>
					<h2 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>
						Active orders
					</h2>
					<div style={{ display: 'flex', gap: 4 }}>
						<button
							className='bf-btn bf-btn-sm'
							style={{
								background: 'var(--bf-ink)',
								color: '#fff',
								padding: '5px 11px',
							}}
						>
							Active 2
						</button>
						<button
							className='bf-btn bf-btn-ghost bf-btn-sm'
							style={{ padding: '5px 11px', color: 'var(--bf-ink-2)' }}
						>
							Done 6
						</button>
					</div>
				</div>

				{activeOrders.map((o) => (
					<RiderOrderCard key={o.id} order={o} />
				))}

				<div
					style={{
						marginTop: 18,
						padding: 14,
						borderRadius: 14,
						background: 'var(--bf-amber)',
						display: 'flex',
						alignItems: 'center',
						gap: 12,
					}}
				>
					<div
						style={{
							width: 38,
							height: 38,
							borderRadius: 10,
							background: 'var(--bf-ink)',
							color: '#fff',
							display: 'grid',
							placeItems: 'center',
						}}
					>
						{Icons.bell}
					</div>
					<div style={{ flex: 1 }}>
						<div className='bf-eyebrow' style={{ color: 'var(--bf-ink)' }}>
							NEW · 30 SEC LEFT
						</div>
						<div style={{ font: '800 14px var(--bf-font)', marginTop: 1 }}>
							Pickup in Gulberg
						</div>
						<div
							style={{ fontSize: 11.5, color: 'var(--bf-ink-2)', marginTop: 1 }}
						>
							2.1 km · Rs. 80 earnings
						</div>
					</div>
					<button className='bf-btn bf-btn-ink bf-btn-sm'>Accept</button>
				</div>
			</div>

			<div
				style={{
					position: 'fixed',
					bottom: 22,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					pointerEvents: 'none',
					zIndex: 10,
				}}
			>
				<div
					style={{
						display: 'flex',
						gap: 4,
						background: 'var(--bf-ink)',
						borderRadius: 999,
						padding: 6,
						boxShadow: '0 8px 24px rgba(0,0,0,.18)',
						pointerEvents: 'auto',
					}}
				>
					{TAB_ITEMS.map((t) => (
						<Link
							key={t.label}
							href={t.href}
							className='bf-btn bf-btn-sm'
							style={{
								background: t.active ? 'var(--bf-ember)' : 'transparent',
								color: '#fff',
								padding: '8px 14px',
								font: '700 12px var(--bf-font)',
							}}
						>
							{t.icon}
							{t.active ? ` ${t.label}` : ''}
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}

// ─── RIDER ORDER DETAIL ───────────────────────────────────────────────────────
interface OrderItem {
	name: string
	tone: Tone
}

const ORDER_ITEMS: OrderItem[] = [
	{ name: 'Family Feast Box', tone: 'ember' },
	{ name: 'Cola 1.5L', tone: 'ink' },
	{ name: 'Loaded Cheese Fries', tone: 'amber' },
	{ name: 'Garlic Bread', tone: 'cream' },
]

const STAGES = ['Accepted', 'Picked up', 'Delivered'] as const
type Stage = (typeof STAGES)[number]

export function RiderOrderDetail() {
	const order = activeOrders[0]
	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'var(--bf-cream)',
				paddingBottom: 100,
			}}
		>
			<div
				style={{
					padding: '12px 16px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Link
					href='/'
					className='bf-btn bf-btn-outline bf-btn-icon'
					style={{ background: 'var(--bf-paper)', width: 36, height: 36 }}
				>
					{Icons.back}
				</Link>
				<div className='bf-mono' style={{ font: '700 12px var(--bf-mono)' }}>
					{order.code}
				</div>
				<button
					className='bf-btn bf-btn-outline bf-btn-icon'
					style={{ background: 'var(--bf-paper)', width: 36, height: 36 }}
				>
					{Icons.phone}
				</button>
			</div>

			{/* Mini map */}
			<div
				style={{
					margin: '0 16px',
					borderRadius: 16,
					height: 130,
					background: '#E4DFD3',
					position: 'relative',
					overflow: 'hidden',
					border: '1px solid var(--bf-line)',
				}}
			>
				<svg
					width='100%'
					height='100%'
					viewBox='0 0 340 130'
					preserveAspectRatio='none'
					style={{ position: 'absolute', inset: 0 }}
				>
					<path
						d='M-20 100 Q 60 60, 130 90 T 280 50 L 360 35'
						stroke='var(--bf-paper)'
						strokeWidth='14'
						fill='none'
						strokeLinecap='round'
					/>
					<path
						d='M40 130 L 90 90 L 90 50 L 200 50 L 200 -10'
						stroke='var(--bf-paper)'
						strokeWidth='7'
						fill='none'
					/>
					<path
						d='M-20 100 Q 60 60, 130 90 T 280 50 L 360 35'
						stroke='var(--bf-ember)'
						strokeWidth='3'
						fill='none'
						strokeLinecap='round'
						strokeDasharray='6 5'
					/>
				</svg>
				<div
					style={{
						position: 'absolute',
						left: 12,
						top: 84,
						width: 22,
						height: 22,
						borderRadius: '50%',
						background: 'var(--bf-ink)',
						color: '#fff',
						display: 'grid',
						placeItems: 'center',
						boxShadow: '0 0 0 3px rgba(35,31,32,.15)',
					}}
				>
					<svg
						width='10'
						height='10'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='3'
					>
						<path d='M4 12l5 5L20 6' />
					</svg>
				</div>
				<div
					style={{
						position: 'absolute',
						left: 165,
						top: 70,
						width: 14,
						height: 14,
						borderRadius: '50%',
						background: '#3B82F6',
						boxShadow: '0 0 0 6px rgba(59,130,246,.25)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						right: 14,
						top: 26,
						width: 28,
						height: 28,
						borderRadius: '50% 50% 50% 0',
						background: 'var(--bf-ember)',
						transform: 'rotate(-45deg)',
						boxShadow: '0 4px 8px rgba(232,67,31,.4)',
					}}
				>
					<div
						style={{
							width: 10,
							height: 10,
							background: '#fff',
							borderRadius: '50%',
							position: 'absolute',
							top: 8,
							left: 8,
							transform: 'rotate(45deg)',
						}}
					/>
				</div>
				<div
					style={{
						position: 'absolute',
						left: 12,
						bottom: 8,
						background: 'var(--bf-paper)',
						borderRadius: 8,
						padding: '4px 9px',
						font: '700 11px var(--bf-mono)',
						color: 'var(--bf-ink)',
						boxShadow: 'var(--bf-shadow-sm)',
					}}
				>
					3.2 KM · 12 MIN
				</div>
			</div>

			{/* Customer block */}
			<div style={{ margin: '14px 16px 0' }} className='bf-card'>
				<div
					style={{
						padding: 14,
						display: 'flex',
						gap: 12,
						alignItems: 'center',
					}}
				>
					<div
						style={{
							width: 44,
							height: 44,
							borderRadius: '50%',
							background: 'var(--bf-cream-2)',
							display: 'grid',
							placeItems: 'center',
							font: '800 14px var(--bf-font)',
						}}
					>
						ZS
					</div>
					<div style={{ flex: 1 }}>
						<div style={{ font: '800 15px var(--bf-font)' }}>
							{order.customer}
						</div>
						<div
							className='bf-mono'
							style={{ fontSize: 11, color: 'var(--bf-mute)' }}
						>
							{order.phone}
						</div>
					</div>
					<button
						className='bf-btn bf-btn-outline bf-btn-icon'
						style={{ width: 36, height: 36 }}
					>
						{Icons.phone}
					</button>
				</div>
				<hr className='bf-rule' style={{ margin: '0 14px' }} />
				<div
					style={{
						padding: 14,
						display: 'flex',
						gap: 10,
						alignItems: 'flex-start',
					}}
				>
					<span
						style={{
							width: 18,
							height: 18,
							borderRadius: '50%',
							background: 'var(--bf-ember)',
							color: '#fff',
							display: 'grid',
							placeItems: 'center',
							flexShrink: 0,
							marginTop: 1,
						}}
					>
						<svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z' />
						</svg>
					</span>
					<div style={{ flex: 1 }}>
						<div style={{ font: '700 14px var(--bf-font)' }}>
							House 218, Block J3
						</div>
						<div
							style={{ fontSize: 12.5, color: 'var(--bf-ink-2)', marginTop: 2 }}
						>
							{order.area}, Multan · MDA Chowk
						</div>
						<div
							className='bf-mono'
							style={{
								fontSize: 10,
								color: 'var(--bf-mute)',
								marginTop: 4,
								padding: '6px 8px',
								background: 'var(--bf-cream-2)',
								borderRadius: 6,
							}}
						>
							"GATE CODE 0742 · CALL ON ARRIVAL"
						</div>
					</div>
				</div>
			</div>

			{/* Items */}
			<div style={{ margin: '12px 16px 0' }} className='bf-card'>
				<div style={{ padding: 14 }}>
					<div className='bf-eyebrow'>{order.items} ITEMS</div>
					<div style={{ marginTop: 8 }}>
						{ORDER_ITEMS.map((it, i) => (
							<div
								key={it.name}
								style={{
									display: 'flex',
									gap: 10,
									padding: '8px 0',
									alignItems: 'center',
									borderBottom:
										i < ORDER_ITEMS.length - 1
											? '1px solid var(--bf-line)'
											: 'none',
								}}
							>
								<FoodImg tone={it.tone} style={{ width: 32, height: 32 }} />
								<span style={{ flex: 1, font: '600 13px var(--bf-font)' }}>
									{it.name}
								</span>
								<span
									className='bf-mono'
									style={{ fontSize: 11, color: 'var(--bf-mute)' }}
								>
									×1
								</span>
							</div>
						))}
					</div>
					<hr className='bf-rule' />
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<span
							className='bf-pill'
							style={{
								background: '#FFF1D6',
								color: '#92580E',
								boxShadow: 'none',
							}}
						>
							COLLECT CASH
						</span>
						<span
							style={{ fontWeight: 800, fontSize: 20 }}
							className='bf-tabular'
						>
							{rs(order.total)}
						</span>
					</div>
				</div>
			</div>

			{/* Stage flow */}
			<div style={{ margin: '14px 16px 0' }}>
				<div className='bf-eyebrow' style={{ marginBottom: 8 }}>
					STAGE
				</div>
				<div style={{ display: 'flex', gap: 6 }}>
					{STAGES.map((label: Stage, i) => {
						const done = i < 2
						const active = i === 1
						return (
							<div
								key={label}
								style={{
									flex: 1,
									padding: '10px 8px',
									borderRadius: 10,
									border:
										'1.5px solid ' +
										(active ? 'var(--bf-ember)' : 'var(--bf-line-2)'),
									background:
										done && !active ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
									textAlign: 'center',
								}}
							>
								<div
									style={{
										font: '700 12px var(--bf-font)',
										color: done ? 'var(--bf-ink)' : 'var(--bf-mute)',
									}}
								>
									{label}
								</div>
								<div
									style={{
										marginTop: 4,
										display: 'flex',
										justifyContent: 'center',
									}}
								>
									{done ? (
										<span
											style={{
												width: 14,
												height: 14,
												borderRadius: '50%',
												background: active
													? 'var(--bf-ember)'
													: 'var(--bf-leaf)',
												color: '#fff',
												display: 'grid',
												placeItems: 'center',
											}}
										>
											<svg
												width='8'
												height='8'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='3.5'
											>
												<path d='M4 12l5 5L20 6' />
											</svg>
										</span>
									) : (
										<span
											style={{
												width: 14,
												height: 14,
												borderRadius: '50%',
												boxShadow: 'inset 0 0 0 1.5px var(--bf-line-2)',
											}}
										/>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* Bottom action */}
			<div style={{ position: 'fixed', bottom: 22, left: 16, right: 16 }}>
				<button
					className='bf-btn bf-btn-primary bf-btn-lg'
					style={{
						width: '100%',
						justifyContent: 'space-between',
						padding: '16px 20px',
					}}
				>
					<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						{Icons.check} Mark as delivered
					</span>
					<span className='bf-mono' style={{ fontSize: 11, opacity: 0.85 }}>
						SWIPE →
					</span>
				</button>
			</div>
		</div>
	)
}
