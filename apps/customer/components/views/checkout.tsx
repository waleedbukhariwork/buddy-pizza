'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { Logo } from '../ui/logo'
import { Icons } from '../ui/icon'
import { CartTotals } from '../ui/cart-totals'
import { FoodImg } from '../ui/food-img'
import { Stepper } from './confirmation'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'
import { rs, placeOrder, clearServerCart } from '../../lib/hooks'
import type { CartItem } from '@shared/index'

// ─── Compute clock arrival time ───────────────────────────────────────────────
function arrivalTime(minutesFromNow: number): string {
	const d = new Date(Date.now() + minutesFromNow * 60_000)
	return d.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ n, title }: { n: string; title: string }) {
	return (
		<div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
			<span className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', letterSpacing: '.08em' }}>{n}</span>
			<h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, letterSpacing: '-0.018em' }}>{title}</h3>
		</div>
	)
}

// ─── Form validation ──────────────────────────────────────────────────────────
function validateFields(phone: string, house: string, area: string) {
	const errs: Record<string, string> = {}
	if (!phone.trim()) {
		errs.phone = 'Phone number is required'
	} else if (!/^[\d\s+()\-]{10,16}$/.test(phone.trim())) {
		errs.phone = 'Enter a valid phone number'
	}
	if (!house.trim()) errs.house = 'House / flat # is required'
	if (!area.trim()) errs.area = 'Area is required'
	return errs
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, tone = 'error' }: { message: string; tone?: 'error' | 'info' }) {
	const isInfo = tone === 'info'
	return (
		<div role='alert' style={{
			padding: '11px 14px',
			borderRadius: 10,
			background: isInfo ? 'var(--bf-cream-2)' : 'rgba(232, 67, 31, 0.07)',
			border: isInfo ? '1px solid var(--bf-line-2)' : '1px solid rgba(232, 67, 31, 0.22)',
			font: '600 12.5px var(--bf-font)',
			color: isInfo ? 'var(--bf-ink-2)' : 'var(--bf-ember)',
			display: 'flex',
			alignItems: 'center',
			gap: 8,
		}}>
			<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' style={{ flexShrink: 0 }}>
				<circle cx='12' cy='12' r='10' /><line x1='12' y1='8' x2='12' y2='12' /><line x1='12' y1='16' x2='12.01' y2='16' />
			</svg>
			{message}
		</div>
	)
}

// ─── Place order button content ───────────────────────────────────────────────
function PlaceOrderBtn({ submitting, subtotal, itemCount, mobile }: { submitting: boolean; subtotal: number; itemCount: number; mobile?: boolean }) {
	return submitting ? (
		<>
			<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<span className='bf-spinner' aria-hidden='true' />
				Placing order...
			</span>
			<span>{rs(subtotal)}</span>
		</>
	) : (
		<>
			<span>{mobile ? `Place order · ${itemCount} items` : 'Place order'}</span>
			<span>{rs(subtotal)} {Icons.arrow}</span>
		</>
	)
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────
function CheckoutExperience() {
	const router = useRouter()
	const { user, token, hydrate } = useAuthStore()
	const items = useCartStore((s) => s.items)
	const removeItem = useCartStore((s) => s.removeItem)
	const clearCart = useCartStore((s) => s.clearCart)
	const subtotal = items.reduce((s, i) => s + (i.sizePrice ?? i.price) * i.quantity, 0)
	const itemCount = items.reduce((s, i) => s + i.quantity, 0)

	const [hydrated, setHydrated] = useState(false)
	const [gpsLoading, setGpsLoading] = useState(false)
	const [area, setArea] = useState('')
	const [house, setHouse] = useState('')
	const [fullName, setFullName] = useState('')
	const [phone, setPhone] = useState('')

	useEffect(() => {
		hydrate()
		setHydrated(true)
	}, [hydrate])

	useEffect(() => {
		if (!hydrated) return
		if (!token) {
			router.replace('/auth/login?redirect=/checkout')
			return
		}
		if (user) {
			if (user.name) setFullName(user.name)
			if (user.phone) setPhone(user.phone)
		}
	}, [hydrated, token, user, router])
	const [showLandmark, setShowLandmark] = useState(false)
	const [landmark, setLandmark] = useState('')
	const [notifPref, setNotifPref] = useState('SMS')
	const [deliveryMode, setDeliveryMode] = useState<'asap' | 'schedule'>('asap')

	// Submission state
	const [submitting, setSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [validationError, setValidationError] = useState<string | null>(null)
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
	const [touched, setTouched] = useState<Record<string, boolean>>({})
	const [lockedCheckout, setLockedCheckout] = useState<{ subtotal: number; itemCount: number } | null>(null)
	const phoneRef = useRef<HTMLInputElement>(null)
	const houseRef = useRef<HTMLInputElement>(null)
	const areaRef = useRef<HTMLInputElement>(null)
	const validationRef = useRef<HTMLDivElement>(null)

	const displaySubtotal = submitting && lockedCheckout ? lockedCheckout.subtotal : subtotal
	const displayItemCount = submitting && lockedCheckout ? lockedCheckout.itemCount : itemCount

	const ETA_MIN = 28
	const ETA_MAX = 34

	function handleGPS() {
		setSubmitError(null)
		if (!navigator.geolocation) {
			setValidationError('Location is not available in this browser. Please enter your address manually.')
			return
		}
		setGpsLoading(true)
		navigator.geolocation.getCurrentPosition(
			() => {
				setArea('Current location')
				setValidationError(null)
				setFieldErrors((e) => ({ ...e, area: '' }))
				setGpsLoading(false)
			},
			() => {
				setGpsLoading(false)
				setValidationError('We could not get your location. Please enter your address manually.')
			},
			{ timeout: 8000 },
		)
	}

	function handleBlur(field: string) {
		setTouched((t) => ({ ...t, [field]: true }))
		const errs = validateFields(phone, house, area)
		setFieldErrors((e) => ({ ...e, [field]: errs[field] ?? '' }))
	}

	function clearFieldError(field: string) {
		if (touched[field]) setFieldErrors((e) => ({ ...e, [field]: '' }))
		setValidationError(null)
	}

	async function handlePlaceOrder() {
		if (submitting) return
		if (items.length === 0) {
			setSubmitError('Your cart is empty. Add an item before placing an order.')
			return
		}

		const errs = validateFields(phone, house, area)
		setFieldErrors(errs)
		setTouched({ phone: true, house: true, area: true })
		setSubmitError(null)

		if (Object.keys(errs).length > 0) {
			setValidationError('Please complete the required delivery details before placing your order.')
			window.requestAnimationFrame(() => {
				validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
				if (errs.phone) phoneRef.current?.focus()
				else if (errs.house) houseRef.current?.focus()
				else if (errs.area) areaRef.current?.focus()
			})
			return
		}

		const orderItems = items.map((it) => {
			const customizations = [it.size, it.customizations].filter(Boolean).join(', ') || undefined
			if (it.dealId != null) {
				return { dealId: it.dealId, itemName: it.productName, price: it.price, quantity: it.quantity, customizations }
			}
			return { productId: it.productId, quantity: it.quantity, customizations }
		})

		if (orderItems.length === 0) {
			setSubmitError('Your cart is empty. Add an item before placing an order.')
			return
		}

		setLockedCheckout({ subtotal, itemCount })
		setSubmitting(true)
		setSubmitError(null)
		setValidationError(null)

		try {
			const addressParts = [fullName.trim(), house.trim(), area.trim(), landmark.trim()].filter(Boolean)
			const deliveryAddress = addressParts.join(', ')

			const order = await placeOrder({
				items: orderItems,
				deliveryAddress,
				customerPhone: phone.trim(),
			})

			// Persist order + cart snapshot for confirmation page
			const snapshot: CartItem[] = items.map((it) => ({ ...it }))
			sessionStorage.setItem('bf_last_order', JSON.stringify({ order, cartSnapshot: snapshot }))

			clearCart()
			clearServerCart().catch(() => {})
			router.push('/confirmation')
		} catch {
			setSubmitError("We couldn't place your order. Please check your connection and try again.")
			setSubmitting(false)
			setLockedCheckout(null)
		}
	}

	// ─── Field error helper ───────────────────────────────────────────────────
	function FieldErr({ field }: { field: string }) {
		if (!touched[field] || !fieldErrors[field]) return null
		return <span className='bf-field-error'>{fieldErrors[field]}</span>
	}

	function inputCls(field: string) {
		return `bf-input${touched[field] && fieldErrors[field] ? ' bf-input-error' : ''}`
	}

	if (!hydrated || !token) return null

	return (
		<div style={{ minHeight: '100vh', background: 'var(--bf-cream)' }}>
			{/* ── Header ── */}
			<header className='bf-checkout-header' style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '18px 56px',
				borderBottom: '1px solid var(--bf-line)',
			}}>
				<Logo size={22} />
				<div className='bf-checkout-stepper'>
					<Stepper active={1} />
				</div>
				<div className='bf-checkout-eta' style={{ display: 'flex', gap: 6, alignItems: 'center', font: '500 13px var(--bf-font)', color: 'var(--bf-ink-2)' }}>
					{Icons.clock} ETA {ETA_MIN}–{ETA_MAX} min
				</div>
			</header>

			{/* ── Body ── */}
			<div
				className='bf-checkout-wrap bf-checkout-grid'
				style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 0, padding: '32px 56px 56px', maxWidth: 1280, margin: '0 auto' }}
			>
				{/* ── Form column ── */}
				<div className='bf-checkout-form-col' style={{ paddingRight: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
					<h1 style={{ fontWeight: 800, fontSize: 40, margin: 0, letterSpacing: '-0.028em' }}>Checkout</h1>

					{validationError && (
						<div ref={validationRef}>
							<ErrorBanner message={validationError} />
						</div>
					)}

					{/* 01 — Delivery address */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='01' title='Delivery address' />

						{/* GPS button */}
						<button
							onClick={handleGPS}
							disabled={gpsLoading}
							style={{
								width: '100%',
								padding: '12px 16px',
								borderRadius: 12,
								border: '1.5px solid var(--bf-line-2)',
								background: 'var(--bf-paper)',
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								cursor: 'pointer',
								font: '600 14px var(--bf-font)',
								color: 'var(--bf-ink)',
								marginBottom: 14,
								transition: 'border-color 0.15s',
							}}
							onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bf-ink)')}
							onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bf-line-2)')}
						>
							{Icons.pin}
							{gpsLoading ? 'Getting location…' : 'Use my current location'}
						</button>

						<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
							<div style={{ flex: 1, height: 1, background: 'var(--bf-line)' }} />
							<span style={{ fontSize: 11, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)', letterSpacing: '0.08em' }}>or enter address</span>
							<div style={{ flex: 1, height: 1, background: 'var(--bf-line)' }} />
						</div>

						<div className='bf-checkout-address-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
							<div>
								<label className='bf-label'>Full name</label>
								<input className='bf-input' value={fullName} onChange={e => setFullName(e.target.value)} placeholder='Ayesha Khan' />
							</div>
							<div>
								<label className='bf-label'>Phone *</label>
								<input
									ref={phoneRef}
									className={inputCls('phone')}
									value={phone}
									onChange={e => { setPhone(e.target.value); clearFieldError('phone') }}
									onBlur={() => handleBlur('phone')}
									placeholder='+92 300 0000000'
								/>
								<FieldErr field='phone' />
							</div>
							<div className='bf-checkout-wide-field' style={{ gridColumn: 'span 2' }}>
								<label className='bf-label'>House / flat # *</label>
								<input
									ref={houseRef}
									className={inputCls('house')}
									value={house}
									onChange={e => { setHouse(e.target.value); clearFieldError('house') }}
									onBlur={() => handleBlur('house')}
								/>
								<FieldErr field='house' />
							</div>
							<div className='bf-checkout-wide-field' style={{ gridColumn: 'span 2' }}>
								<label className='bf-label'>Area *</label>
								<input
									ref={areaRef}
									className={inputCls('area')}
									value={area}
									onChange={e => { setArea(e.target.value); clearFieldError('area') }}
									onBlur={() => handleBlur('area')}
								/>
								<FieldErr field='area' />
							</div>

							{showLandmark ? (
								<div className='bf-checkout-wide-field' style={{ gridColumn: 'span 2' }}>
									<label className='bf-label'>Landmark (optional)</label>
									<input className='bf-input' placeholder='Near Khaadi / opposite X bank' value={landmark} onChange={e => setLandmark(e.target.value)} autoFocus />
								</div>
							) : (
								<div className='bf-checkout-wide-field' style={{ gridColumn: 'span 2' }}>
									<button
										onClick={() => setShowLandmark(true)}
										style={{ background: 'none', border: 'none', cursor: 'pointer', font: '600 12.5px var(--bf-font)', color: 'var(--bf-ink-2)', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
									>
										+ Add landmark
									</button>
								</div>
							)}
						</div>

						<div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--bf-cream-2)', display: 'flex', alignItems: 'center', gap: 10, font: '500 13px var(--bf-font)' }}>
							{Icons.pin}
							<span><strong>Inside delivery zone.</strong> Free delivery, ETA {ETA_MIN}–{ETA_MAX} min.</span>
						</div>
					</section>

					{/* 02 — Payment */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='02' title='Payment' />
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							padding: '16px 18px',
							borderRadius: 12,
							border: '2px solid var(--bf-ink)',
							background: 'var(--bf-cream-2)',
							cursor: 'pointer',
						}}>
							<span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bf-ink)', color: '#fff', display: 'grid', placeItems: 'center' }}>
								{Icons.cash}
							</span>
							<div style={{ flex: 1 }}>
								<div style={{ font: '700 14.5px var(--bf-font)' }}>Cash on delivery</div>
								<div style={{ fontSize: 12, color: 'var(--bf-ink-2)', marginTop: 2 }}>Pay the rider when your order arrives</div>
							</div>
							<span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bf-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
								<span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />
							</span>
						</label>
						<div style={{ marginTop: 10, font: '500 12px var(--bf-font)', color: 'var(--bf-mute)' }}>
							Card & EasyPaisa coming soon
						</div>
					</section>

					{/* 03 — Notification preference */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='03' title='Order updates' />
						<div style={{ display: 'flex', gap: 10 }}>
							{(['SMS', 'WhatsApp', 'Call only'] as const).map((l) => (
								<button
									key={l}
									onClick={() => setNotifPref(l)}
									style={{
										flex: 1,
										padding: '12px 8px',
										borderRadius: 12,
										border: '1.5px solid ' + (notifPref === l ? 'var(--bf-ink)' : 'var(--bf-line-2)'),
										background: notifPref === l ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
										cursor: 'pointer',
										font: '700 13.5px var(--bf-font)',
										color: 'var(--bf-ink)',
										transition: 'border-color 0.15s, background 0.15s',
									}}
								>
									{l}
								</button>
							))}
						</div>
					</section>

					{/* 04 — Delivery time */}
					<section className='bf-card' style={{ padding: 22 }}>
						<SectionHeader n='04' title='Delivery time' />
						<div style={{ display: 'flex', gap: 10 }}>
							<button
								onClick={() => setDeliveryMode('asap')}
								style={{
									flex: 1,
									padding: '14px 12px',
									borderRadius: 12,
									border: '1.5px solid ' + (deliveryMode === 'asap' ? 'var(--bf-ink)' : 'var(--bf-line-2)'),
									background: deliveryMode === 'asap' ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
									cursor: 'pointer',
									fontFamily: 'var(--bf-font)',
									transition: 'border-color 0.15s, background 0.15s',
									textAlign: 'left',
								}}
							>
								<div style={{ fontWeight: 700, fontSize: 14 }}>Get it ASAP</div>
								<div style={{ fontWeight: 800, fontSize: 18, marginTop: 4, color: 'var(--bf-ember)', fontFamily: 'var(--bf-mono)' }}>
									~{arrivalTime(ETA_MAX)}
								</div>
								<div className='bf-mono' style={{ fontSize: 10.5, color: 'var(--bf-mute)', marginTop: 3 }}>
									{ETA_MIN}–{ETA_MAX} min from now
								</div>
							</button>
							<button
								onClick={() => setDeliveryMode('schedule')}
								style={{
									flex: 1,
									padding: '14px 12px',
									borderRadius: 12,
									border: '1.5px solid ' + (deliveryMode === 'schedule' ? 'var(--bf-ink)' : 'var(--bf-line-2)'),
									background: deliveryMode === 'schedule' ? 'var(--bf-cream-2)' : 'var(--bf-paper)',
									cursor: 'pointer',
									fontFamily: 'var(--bf-font)',
									transition: 'border-color 0.15s, background 0.15s',
									textAlign: 'left',
								}}
							>
								<div style={{ fontWeight: 700, fontSize: 14 }}>Schedule</div>
								<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 6 }}>Pick a time slot</div>
							</button>
						</div>
					</section>
				</div>

				{/* ── Desktop order summary sidebar ── */}
				<aside className='bf-checkout-sidebar'>
					<div className='bf-card' style={{ padding: 22, position: 'sticky', top: 20 }}>
						<h3 style={{ fontWeight: 700, fontSize: 18, margin: '0 0 14px' }}>Order summary</h3>
						{items.length === 0 ? (
							<p style={{ fontSize: 13, color: 'var(--bf-ink-2)' }}>Your cart is empty.</p>
						) : (
							items.map((it) => (
								<div key={`${it.productId}-${it.size ?? ''}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bf-line)' }}>
									<FoodImg tone='ember' style={{ width: 36, height: 36, flexShrink: 0 }} />
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ font: '700 13px var(--bf-font)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{it.productName}{it.size ? ` · ${it.size}` : ''}
										</div>
										<div className='bf-mono' style={{ fontSize: 11, color: 'var(--bf-mute)' }}>QTY {it.quantity}</div>
									</div>
									<span style={{ fontWeight: 800, fontSize: 14 }}>{rs((it.sizePrice ?? it.price) * it.quantity)}</span>
									<button
										disabled={submitting}
										className='bf-btn bf-btn-ghost bf-btn-icon'
										onClick={() => removeItem(it.productId, it.size, it.dealId)}
										style={{ width: 24, height: 24, color: 'var(--bf-mute)' }}
									>
										{Icons.x}
									</button>
								</div>
							))
						)}
						<hr className='bf-rule' />
						<CartTotals subtotal={displaySubtotal} />

						{submitError && (
							<div style={{ marginTop: 14 }}>
								<ErrorBanner message={submitError} />
							</div>
						)}
						{!submitError && items.length === 0 && (
							<div style={{ marginTop: 14 }}>
								<ErrorBanner tone='info' message='Your cart is empty. Add something tasty from the menu to continue.' />
							</div>
						)}
						{submitting && (
							<div style={{ marginTop: 14 }}>
								<ErrorBanner tone='info' message='Hold tight. We are sending your order to the kitchen.' />
							</div>
						)}

						<button
							onClick={handlePlaceOrder}
							disabled={submitting || items.length === 0}
							aria-busy={submitting}
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{ width: '100%', marginTop: 14, justifyContent: 'space-between' }}
						>
							<PlaceOrderBtn submitting={submitting} subtotal={displaySubtotal} itemCount={displayItemCount} />
						</button>

						<div style={{ marginTop: 12, font: '500 11.5px var(--bf-font)', color: 'var(--bf-mute)', textAlign: 'center', lineHeight: 1.5 }}>
							By placing this order you agree to our terms.<br />
							Cash payable to rider on arrival.
						</div>
					</div>
				</aside>
			</div>

			{/* ── Mobile fixed bottom bar ── */}
			<div className='bf-checkout-mobile-bar'>
				{submitError && (
					<div style={{ marginBottom: 8 }}>
						<ErrorBanner message={submitError} />
					</div>
				)}
				{validationError && (
					<div style={{ marginBottom: 8 }}>
						<ErrorBanner message={validationError} />
					</div>
				)}
				{!submitError && !validationError && items.length === 0 && (
					<div style={{ marginBottom: 8 }}>
						<ErrorBanner tone='info' message='Your cart is empty. Add items from the menu to continue.' />
					</div>
				)}
				<button
					onClick={handlePlaceOrder}
					disabled={submitting || items.length === 0}
					aria-busy={submitting}
					className='bf-btn bf-btn-primary bf-btn-lg'
					style={{ width: '100%', justifyContent: 'space-between' }}
				>
					<PlaceOrderBtn submitting={submitting} subtotal={displaySubtotal} itemCount={displayItemCount} mobile />
				</button>
			</div>
		</div>
	)
}

export { CheckoutExperience }
