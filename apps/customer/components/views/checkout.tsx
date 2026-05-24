'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '../ui/logo'
import { FoodImg } from '../ui/food-img'
import { CartTotals } from '../ui/cart-totals'
import { Stepper } from './confirmation'
import { useCartStore } from '../../lib/cart-store'
import { useAuthStore } from '../../lib/auth-store'
import { rs, placeOrder, clearServerCart, validatePromoCode } from '../../lib/hooks'
import config from '../../lib/config'
import type { CartItem } from '@shared/index'

// ─── Google Maps loader ───────────────────────────────────────────────────────
const GMAPS_KEY = config.googleMapsKey
let gmapsLoaded = false
let gmapsLoading = false
const gmapsCallbacks: Array<() => void> = []

function loadGoogleMaps(cb: () => void) {
	if (gmapsLoaded) { cb(); return }
	gmapsCallbacks.push(cb)
	if (gmapsLoading) return
	gmapsLoading = true
	const script = document.createElement('script')
	script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`
	script.async = true
	script.onload = () => {
		gmapsLoaded = true
		gmapsLoading = false
		gmapsCallbacks.forEach(fn => fn())
		gmapsCallbacks.length = 0
	}
	document.head.appendChild(script)
}

// Minimal Google Maps type shims (avoids requiring @types/google.maps)
interface GACComponent { types: string[]; long_name: string }

// Parse Google address_components into our fields
interface ParsedAddress {
	street: string
	area: string
	city: string
	postalCode: string
	formattedAddress: string
}

function parseAddressComponents(components: GACComponent[], formatted: string): ParsedAddress {
	const get = (type: string) => components.find(c => c.types.includes(type))?.long_name ?? ''
	const streetNum = get('street_number')
	const route = get('route')
	const sublocality = get('sublocality_level_1') || get('sublocality') || get('neighborhood')
	const locality = get('locality') || get('administrative_area_level_2')
	const postal = get('postal_code')
	return {
		street: [streetNum, route].filter(Boolean).join(' '),
		area: sublocality,
		city: locality,
		postalCode: postal,
		formattedAddress: formatted,
	}
}

// ─── Reverse geocode via fetch (no Maps JS required) ─────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<ParsedAddress | null> {
	if (!GMAPS_KEY) return null
	try {
		const res = await fetch(
			`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GMAPS_KEY}`
		)
		const data = await res.json()
		if (data.status !== 'OK' || !data.results?.[0]) return null
		const r = data.results[0]
		return parseAddressComponents(r.address_components, r.formatted_address)
	} catch {
		return null
	}
}

// ─── Address autocomplete input ───────────────────────────────────────────────
interface AutocompleteProps {
	value: string
	onChange: (v: string) => void
	onPlaceSelect: (p: ParsedAddress) => void
	placeholder?: string
	disabled?: boolean
	hasError?: boolean
}

function AddressAutocomplete({ value, onChange, onPlaceSelect, placeholder, disabled, hasError }: AutocompleteProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const acRef = useRef<any>(null)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		if (!GMAPS_KEY) return
		loadGoogleMaps(() => {
			setReady(true)
		})
	}, [])

	useEffect(() => {
		if (!ready || !inputRef.current || acRef.current) return
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g = (window as any).google
		if (!g?.maps?.places?.Autocomplete) return
		const ac = new g.maps.places.Autocomplete(inputRef.current, {
			fields: ['address_components', 'formatted_address', 'geometry'],
			componentRestrictions: { country: 'pk' },
		})
		ac.addListener('place_changed', () => {
			const place = ac.getPlace()
			if (!place.address_components) return
			const parsed = parseAddressComponents(
				place.address_components,
				place.formatted_address ?? ''
			)
			onChange(place.formatted_address ?? '')
			onPlaceSelect(parsed)
		})
		acRef.current = ac
	}, [ready, onChange, onPlaceSelect])

	const cls = `bf-input${hasError ? ' bf-input-error' : ''}`

	if (!GMAPS_KEY) {
		return (
			<input
				ref={inputRef}
				className={cls}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				disabled={disabled}
			/>
		)
	}

	return (
		<div style={{ position: 'relative' }}>
			<div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bf-mute)', pointerEvents: 'none' }}>
				<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
					<circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' />
				</svg>
			</div>
			<input
				ref={inputRef}
				className={cls}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder ?? 'Search your delivery address…'}
				disabled={disabled}
				style={{ paddingLeft: 40 }}
			/>
		</div>
	)
}

// ─── Address label selector ───────────────────────────────────────────────────
type AddressLabel = 'home' | 'work' | 'other'
const LABELS: Array<{ key: AddressLabel; icon: string; text: string }> = [
	{ key: 'home', icon: '🏠', text: 'Home' },
	{ key: 'work', icon: '💼', text: 'Work' },
	{ key: 'other', icon: '📍', text: 'Other' },
]

function AddressLabelSelector({ value, onChange }: { value: AddressLabel; onChange: (v: AddressLabel) => void }) {
	return (
		<div className='bf-addr-label-group'>
			{LABELS.map(l => (
				<button
					key={l.key}
					type='button'
					onClick={() => onChange(l.key)}
					className={`bf-addr-label-btn${value === l.key ? ' active' : ''}`}
				>
					<span>{l.icon}</span>
					<span>{l.text}</span>
				</button>
			))}
		</div>
	)
}

// ─── Promo code input ─────────────────────────────────────────────────────────
interface PromoCodeInputProps {
	cartTotal: number
	onApply: (discount: number, code: string) => void
	onClear: () => void
	appliedCode: string | null
}

function PromoCodeInput({ cartTotal, onApply, onClear, appliedCode }: PromoCodeInputProps) {
	const [code, setCode] = useState(appliedCode ?? '')
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
	const [message, setMessage] = useState('')

	async function handleApply() {
		if (!code.trim()) return
		setStatus('loading')
		setMessage('')
		try {
			const result = await validatePromoCode(code.trim(), cartTotal)
			if (result.valid) {
				setStatus('success')
				setMessage(result.message)
				onApply(result.discount, code.trim().toUpperCase())
			} else {
				setStatus('error')
				setMessage(result.message || 'Invalid promo code')
			}
		} catch {
			setStatus('error')
			setMessage('Could not verify code. Try again.')
		}
	}

	function handleClear() {
		setCode('')
		setStatus('idle')
		setMessage('')
		onClear()
	}

	if (appliedCode && status === 'success') {
		return (
			<div className='bf-promo-applied'>
				<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
					<span className='bf-promo-check'>
						<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
							<path d='M4 12l5 5L20 6' />
						</svg>
					</span>
					<div>
						<div style={{ fontWeight: 700, fontSize: 13 }}>
							<span style={{ fontFamily: 'var(--bf-mono)', letterSpacing: '0.05em' }}>{appliedCode}</span> applied
						</div>
						<div style={{ fontSize: 12, color: 'var(--bf-leaf)', marginTop: 2 }}>{message}</div>
					</div>
				</div>
				<button onClick={handleClear} className='bf-promo-clear'>Remove</button>
			</div>
		)
	}

	return (
		<div>
			<div className='bf-promo-input-group'>
				<input
					className={`bf-input bf-promo-input${status === 'error' ? ' bf-input-error' : ''}`}
					value={code}
					onChange={e => { setCode(e.target.value.toUpperCase()); setStatus('idle'); setMessage('') }}
					onKeyDown={e => e.key === 'Enter' && handleApply()}
					placeholder='Enter promo code'
					disabled={status === 'loading'}
					style={{ fontFamily: 'var(--bf-mono)', letterSpacing: '0.06em', fontSize: 14 }}
				/>
				<button
					onClick={handleApply}
					disabled={!code.trim() || status === 'loading'}
					className='bf-btn bf-btn-ink bf-btn-md bf-promo-btn'
				>
					{status === 'loading' ? <span className='bf-spinner' style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> : 'Apply'}
				</button>
			</div>
			{message && (
				<div className={`bf-promo-msg${status === 'error' ? ' bf-promo-msg-error' : ' bf-promo-msg-success'}`}>
					{status === 'error' && (
						<svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
							<circle cx='12' cy='12' r='10' /><line x1='12' y1='8' x2='12' y2='12' /><line x1='12' y1='16' x2='12.01' y2='16' />
						</svg>
					)}
					{message}
				</div>
			)}
		</div>
	)
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ n, title, complete, children }: {
	n: string; title: string; complete?: boolean; children: React.ReactNode
}) {
	return (
		<section className={`bf-card bf-checkout-section${complete ? ' bf-checkout-section-done' : ''}`} style={{ padding: 24 }}>
			<div className='bf-section-header'>
				<div className='bf-section-step'>
					{complete ? (
						<svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.8' strokeLinecap='round' strokeLinejoin='round'>
							<path d='M4 12l5 5L20 6' />
						</svg>
					) : n}
				</div>
				<h3 className='bf-section-title'>{title}</h3>
			</div>
			{children}
		</section>
	)
}

// ─── Field error display ──────────────────────────────────────────────────────
function FieldErr({ msg }: { msg?: string }) {
	if (!msg) return null
	return <span className='bf-field-error'>{msg}</span>
}

// ─── Cart item row with qty controls ─────────────────────────────────────────
function CartRow({ item, onQty, onRemove, disabled }: {
	item: CartItem
	onQty: (qty: number) => void
	onRemove: () => void
	disabled?: boolean
}) {
	const linePrice = (item.sizePrice ?? item.price) * item.quantity
	return (
		<div className='bf-co-item'>
			<FoodImg tone='ember' style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10 }} />
			<div className='bf-co-item-body'>
				<div className='bf-co-item-name'>
					{item.productName}{item.size ? <span style={{ color: 'var(--bf-mute)', fontWeight: 500 }}> · {item.size}</span> : null}
				</div>
				{item.customizations && (
					<div className='bf-co-item-custom'>{item.customizations}</div>
				)}
				<div className='bf-co-item-row'>
					<div className='bf-co-qty'>
						<button
							className='bf-co-qty-btn'
							onClick={() => item.quantity > 1 ? onQty(item.quantity - 1) : onRemove()}
							disabled={disabled}
							aria-label='Decrease quantity'
						>
							{item.quantity === 1 ? (
								<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
									<polyline points='3 6 5 6 21 6' /><path d='M19 6l-1 14H6L5 6' /><path d='M10 11v6M14 11v6' /><path d='M9 6V4h6v2' />
								</svg>
							) : (
								<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
									<line x1='5' y1='12' x2='19' y2='12' />
								</svg>
							)}
						</button>
						<span className='bf-co-qty-val'>{item.quantity}</span>
						<button
							className='bf-co-qty-btn'
							onClick={() => onQty(item.quantity + 1)}
							disabled={disabled}
							aria-label='Increase quantity'
						>
							<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
								<line x1='12' y1='5' x2='12' y2='19' /><line x1='5' y1='12' x2='19' y2='12' />
							</svg>
						</button>
					</div>
					<span className='bf-co-item-price'>{rs(linePrice)}</span>
				</div>
			</div>
		</div>
	)
}

// ─── Mobile collapsible cart ──────────────────────────────────────────────────
function MobileCartSummary({ items, subtotal, discount, updateQty, removeItem, disabled }: {
	items: CartItem[]
	subtotal: number
	discount: number
	updateQty: (productId: number, qty: number, size?: string, dealId?: number) => void
	removeItem: (productId: number, size?: string, dealId?: number) => void
	disabled?: boolean
}) {
	const [open, setOpen] = useState(false)
	const itemCount = items.reduce((s, i) => s + i.quantity, 0)

	return (
		<div className='bf-mobile-cart'>
			<button className='bf-mobile-cart-toggle' onClick={() => setOpen(o => !o)} aria-expanded={open}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
					<span className='bf-mobile-cart-badge'>{itemCount}</span>
					<span style={{ fontWeight: 700, fontSize: 14 }}>Order summary</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<span style={{ fontWeight: 800, fontSize: 15 }}>{rs(subtotal - discount)}</span>
					<svg
						width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'
						style={{ transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
					>
						<polyline points='6 9 12 15 18 9' />
					</svg>
				</div>
			</button>

			{open && (
				<div className='bf-mobile-cart-body'>
					{items.map(item => (
						<CartRow
							key={`${item.productId}-${item.size ?? ''}-${item.dealId ?? ''}`}
							item={item}
							onQty={qty => updateQty(item.productId, qty, item.size, item.dealId)}
							onRemove={() => removeItem(item.productId, item.size, item.dealId)}
							disabled={disabled}
						/>
					))}
					<hr className='bf-rule' style={{ margin: '10px 0' }} />
					<CartTotals subtotal={subtotal} discount={discount} />
				</div>
			)}
		</div>
	)
}

// ─── Loading overlay ──────────────────────────────────────────────────────────
function LoadingOverlay() {
	return (
		<div className='bf-loading-overlay'>
			<div className='bf-loading-card'>
				<div className='bf-loading-icon'>
					<span className='bf-spinner' style={{ width: 24, height: 24, borderWidth: 3 }} />
				</div>
				<div className='bf-loading-text'>
					<div style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>Placing your order</div>
					<div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>Sending to the kitchen…</div>
				</div>
			</div>
		</div>
	)
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, tone = 'error' }: { message: string; tone?: 'error' | 'info' }) {
	const isInfo = tone === 'info'
	return (
		<div role='alert' className={`bf-error-banner${isInfo ? ' bf-error-banner-info' : ''}`}>
			<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' style={{ flexShrink: 0 }}>
				<circle cx='12' cy='12' r='10' /><line x1='12' y1='8' x2='12' y2='12' /><line x1='12' y1='16' x2='12.01' y2='16' />
			</svg>
			{message}
		</div>
	)
}

// ─── Place order button ───────────────────────────────────────────────────────
function PlaceOrderBtn({ submitting, total, itemCount, mobile }: {
	submitting: boolean; total: number; itemCount: number; mobile?: boolean
}) {
	if (submitting) {
		return (
			<>
				<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<span className='bf-spinner' aria-hidden='true' />
					Placing order…
				</span>
				<span>{rs(total)}</span>
			</>
		)
	}
	return (
		<>
			<span>{mobile ? `Place order · ${itemCount} item${itemCount !== 1 ? 's' : ''}` : 'Place order'}</span>
			<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
				{rs(total)}
				<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
					<line x1='5' y1='12' x2='19' y2='12' /><polyline points='12 5 19 12 12 19' />
				</svg>
			</span>
		</>
	)
}

// ─── COD time estimate ────────────────────────────────────────────────────────
function etaTime(minutesFromNow: number): string {
	const d = new Date(Date.now() + minutesFromNow * 60_000)
	return d.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── MAIN CHECKOUT EXPERIENCE ─────────────────────────────────────────────────
function CheckoutExperience() {
	const router = useRouter()
	const { user, token, hydrate } = useAuthStore()
	const items = useCartStore(s => s.items)
	const removeItem = useCartStore(s => s.removeItem)
	const updateQuantity = useCartStore(s => s.updateQuantity)
	const clearCart = useCartStore(s => s.clearCart)

	const itemCount = items.reduce((s, i) => s + i.quantity, 0)
	const subtotal = items.reduce((s, i) => s + (i.sizePrice ?? i.price) * i.quantity, 0)

	// Hydration
	const [hydrated, setHydrated] = useState(false)
	useEffect(() => { hydrate(); setHydrated(true) }, [hydrate])
	useEffect(() => {
		if (!hydrated) return
		if (!token) router.replace('/auth/login?redirect=/checkout')
	}, [hydrated, token, router])

	// Pre-fill user data
	useEffect(() => {
		if (user?.phone && !phone) setPhone(user.phone)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user])

	// ── Address state ─────────────────────────────────────────────────────────
	const [addressLabel, setAddressLabel] = useState<AddressLabel>('home')
	const [searchQuery, setSearchQuery] = useState('')
	const [flat, setFlat] = useState('')
	const [street, setStreet] = useState('')
	const [area, setArea] = useState('')
	const [city, setCity] = useState('')
	const [deliveryNotes, setDeliveryNotes] = useState('')
	const [showDeliveryNotes, setShowDeliveryNotes] = useState(false)
	const [gpsLoading, setGpsLoading] = useState(false)

	// ── Contact state ─────────────────────────────────────────────────────────
	const [phone, setPhone] = useState('')

	// ── Promo state ───────────────────────────────────────────────────────────
	const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
	const discount = appliedPromo?.discount ?? 0

	// ── Delivery time ─────────────────────────────────────────────────────────
	const [deliveryMode, setDeliveryMode] = useState<'asap' | 'schedule'>('asap')
	const ETA_MIN = 28
	const ETA_MAX = 34

	// ── Submission state ──────────────────────────────────────────────────────
	const submittingRef = useRef(false)
	const [submitting, setSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
	const [touched, setTouched] = useState<Record<string, boolean>>({})
	const [lockedTotal, setLockedTotal] = useState<{ subtotal: number; discount: number; itemCount: number } | null>(null)
	const validationRef = useRef<HTMLDivElement>(null)
	const flatRef = useRef<HTMLInputElement>(null)
	const phoneRef = useRef<HTMLInputElement>(null)

	const displaySubtotal = submitting && lockedTotal ? lockedTotal.subtotal : subtotal
	const displayDiscount = submitting && lockedTotal ? lockedTotal.discount : discount
	const displayItemCount = submitting && lockedTotal ? lockedTotal.itemCount : itemCount
	const displayTotal = displaySubtotal - displayDiscount

	// ── Section completion ────────────────────────────────────────────────────
	const addressComplete = !!(flat.trim() && area.trim() && phone.trim())
	const paymentComplete = true // COD always selected

	// ── GPS handler ───────────────────────────────────────────────────────────
	async function handleGPS() {
		if (!navigator.geolocation) {
			setFieldErrors(e => ({ ...e, area: 'Location is not available in this browser' }))
			return
		}
		setGpsLoading(true)
		navigator.geolocation.getCurrentPosition(
			async pos => {
				const { latitude, longitude } = pos.coords
				const parsed = await reverseGeocode(latitude, longitude)
				if (parsed) {
					setStreet(parsed.street)
					setArea(parsed.area || parsed.city)
					setCity(parsed.city)
					setSearchQuery(parsed.formattedAddress)
				} else {
					setArea('Current location')
				}
				setFieldErrors(e => ({ ...e, area: '' }))
				setGpsLoading(false)
			},
			() => {
				setGpsLoading(false)
				setFieldErrors(e => ({ ...e, area: 'Could not get location. Enter your address manually.' }))
			},
			{ timeout: 9000 },
		)
	}

	// ── Places autocomplete handler ───────────────────────────────────────────
	const handlePlaceSelect = useCallback((parsed: ParsedAddress) => {
		setStreet(parsed.street)
		setArea(parsed.area || parsed.city)
		setCity(parsed.city)
		setFieldErrors(e => ({ ...e, area: '' }))
		// Focus flat field after autocomplete
		setTimeout(() => flatRef.current?.focus(), 100)
	}, [])

	// ── Field validation ──────────────────────────────────────────────────────
	function validate() {
		const errs: Record<string, string> = {}
		const cleanPhone = phone.replace(/[\s\-()]/g, '')
		if (!cleanPhone) errs.phone = 'Phone number is required'
		else if (!/^(?:\+92\d{10}|03\d{9})$/.test(cleanPhone)) errs.phone = 'Enter a valid Pakistani phone (e.g. 03112345678)'
		if (!flat.trim()) errs.flat = 'House / flat # is required'
		if (!area.trim()) errs.area = 'Area is required'
		return errs
	}

	function handleBlur(field: string) {
		setTouched(t => ({ ...t, [field]: true }))
		const errs = validate()
		setFieldErrors(e => ({ ...e, [field]: errs[field] ?? '' }))
	}

	// ── Place order ───────────────────────────────────────────────────────────
	async function handlePlaceOrder() {
		if (submittingRef.current) return
		if (items.length === 0) { setSubmitError('Your cart is empty. Add items before placing an order.'); return }

		const errs = validate()
		setFieldErrors(errs)
		setTouched({ phone: true, flat: true, area: true })

		if (Object.keys(errs).length > 0) {
			setSubmitError('Please complete the required delivery details before placing your order.')
			requestAnimationFrame(() => {
				validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
				if (errs.phone) phoneRef.current?.focus()
				else if (errs.flat) flatRef.current?.focus()
			})
			return
		}

		const orderItems = items.map(it => {
			const customizations = it.customizations?.trim() || undefined
			if (it.dealId != null) return { dealId: it.dealId, itemName: it.productName, price: it.price, quantity: it.quantity, customizations }
			return { productId: it.productId, price: it.sizePrice ?? it.price, quantity: it.quantity, customizations }
		})

		submittingRef.current = true
		setLockedTotal({ subtotal, discount, itemCount })
		setSubmitting(true)
		setSubmitError(null)

		try {
			const addressParts = [flat.trim(), street.trim(), area.trim(), city.trim()].filter(Boolean)
			const deliveryAddress = [addressParts.join(', '), deliveryNotes.trim()].filter(Boolean).join(' — ')

			const order = await placeOrder({
				items: orderItems,
				deliveryAddress,
				customerPhone: phone.trim(),
				specialNotes: deliveryNotes.trim() || undefined,
				promoCode: appliedPromo?.code,
			})

			const snapshot: CartItem[] = items.map(it => ({ ...it }))
			sessionStorage.setItem('bf_last_order', JSON.stringify({ order, cartSnapshot: snapshot }))

			clearCart()
			clearServerCart().catch(() => {})
			router.push('/confirmation')
		} catch {
			setSubmitError("We couldn't place your order. Please check your connection and try again.")
			setSubmitting(false)
			submittingRef.current = false
			setLockedTotal(null)
		}
	}

	function inputCls(field: string) {
		return `bf-input${touched[field] && fieldErrors[field] ? ' bf-input-error' : ''}`
	}

	if (!hydrated || !token) return null

	return (
		<div style={{ minHeight: '100vh', background: 'var(--bf-cream)' }}>

			{/* ── Header ── */}
			<header className='bf-checkout-header'>
				<Logo size={22} />
				<div className='bf-checkout-stepper'>
					<Stepper active={1} />
				</div>
				<div className='bf-checkout-eta'>
					<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<circle cx='12' cy='12' r='10' /><polyline points='12 6 12 12 16 14' />
					</svg>
					ETA {ETA_MIN}–{ETA_MAX} min
				</div>
			</header>

			{/* ── Body ── */}
			<div className='bf-checkout-wrap bf-checkout-grid'>

				{/* ── Form column ── */}
				<div className='bf-checkout-form-col'>
					<h1 className='bf-checkout-title'>Checkout</h1>

					{/* Mobile cart summary */}
					<div className='bf-checkout-mobile-only'>
						<MobileCartSummary
							items={items}
							subtotal={subtotal}
							discount={discount}
							updateQty={updateQuantity}
							removeItem={removeItem}
							disabled={submitting}
						/>
					</div>

					{/* Validation error */}
					{submitError && (
						<div ref={validationRef}>
							<ErrorBanner message={submitError} />
						</div>
					)}

					{/* 01 — Delivery Address */}
					<SectionCard n='01' title='Delivery address' complete={addressComplete}>
						{/* GPS button */}
						<button
							onClick={handleGPS}
							disabled={gpsLoading || submitting}
							className='bf-gps-btn'
						>
							{gpsLoading ? (
								<span className='bf-spinner' style={{ borderColor: 'rgba(35,31,32,.2)', borderTopColor: 'var(--bf-ink)', width: 14, height: 14 }} />
							) : (
								<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
									<circle cx='12' cy='12' r='3' /><path d='M12 2v3M12 19v3M2 12h3M19 12h3' /><circle cx='12' cy='12' r='9' />
								</svg>
							)}
							{gpsLoading ? 'Detecting location…' : 'Use my current location'}
						</button>

						{/* Places autocomplete (or manual search) */}
						{GMAPS_KEY && (
							<>
								<div className='bf-divider-or'>
									<div className='bf-divider-line' /><span>or search address</span><div className='bf-divider-line' />
								</div>
								<div style={{ marginBottom: 16 }}>
									<AddressAutocomplete
										value={searchQuery}
										onChange={setSearchQuery}
										onPlaceSelect={handlePlaceSelect}
										placeholder='Search your delivery address…'
										disabled={submitting}
									/>
								</div>
							</>
						)}

						{!GMAPS_KEY && (
							<div className='bf-divider-or'>
								<div className='bf-divider-line' /><span>or enter address</span><div className='bf-divider-line' />
							</div>
						)}

						{/* Address label */}
						<AddressLabelSelector value={addressLabel} onChange={setAddressLabel} />

						{/* Address fields */}
						<div className='bf-checkout-address-grid'>
							<div>
								<label className='bf-label'>Phone *</label>
								<input
									ref={phoneRef}
									className={inputCls('phone')}
									value={phone}
									onChange={e => { setPhone(e.target.value); setFieldErrors(er => ({ ...er, phone: '' })) }}
									onBlur={() => handleBlur('phone')}
									placeholder='03112345678'
									type='tel'
									disabled={submitting}
								/>
								<FieldErr msg={touched.phone ? fieldErrors.phone : undefined} />
							</div>
							<div className='bf-checkout-wide-field'>
								<label className='bf-label'>House / flat / apartment # *</label>
								<input
									ref={flatRef}
									className={inputCls('flat')}
									value={flat}
									onChange={e => { setFlat(e.target.value); setFieldErrors(er => ({ ...er, flat: '' })) }}
									onBlur={() => handleBlur('flat')}
									placeholder='e.g. Flat 4B, House 12'
									disabled={submitting}
								/>
								<FieldErr msg={touched.flat ? fieldErrors.flat : undefined} />
							</div>
							<div>
								<label className='bf-label'>Area / street *</label>
								<input
									className={inputCls('area')}
									value={area}
									onChange={e => { setArea(e.target.value); setFieldErrors(er => ({ ...er, area: '' })) }}
									onBlur={() => handleBlur('area')}
									placeholder='e.g. DHA Phase 5, Gulshan'
									disabled={submitting}
								/>
								<FieldErr msg={touched.area ? fieldErrors.area : undefined} />
							</div>
							<div>
								<label className='bf-label'>City</label>
								<input
									className='bf-input'
									value={city}
									onChange={e => setCity(e.target.value)}
									placeholder='e.g. Karachi'
									disabled={submitting}
								/>
							</div>

							<div className='bf-checkout-wide-field'>
								{showDeliveryNotes ? (
									<>
										<label className='bf-label'>Delivery instructions (optional)</label>
										<input
											className='bf-input'
											value={deliveryNotes}
											onChange={e => setDeliveryNotes(e.target.value)}
											placeholder='e.g. Ring bell, leave at door, call on arrival'
											disabled={submitting}
											autoFocus
										/>
									</>
								) : (
									<button
										type='button'
										onClick={() => setShowDeliveryNotes(true)}
										className='bf-add-link'
									>
										+ Add delivery instructions
									</button>
								)}
							</div>
						</div>

						{/* Delivery zone badge */}
						<div className='bf-zone-badge'>
							<svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
								<path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' /><circle cx='12' cy='10' r='3' />
							</svg>
							<span><strong>Inside delivery zone.</strong> Free delivery · ETA {ETA_MIN}–{ETA_MAX} min.</span>
						</div>
					</SectionCard>

					{/* 02 — Promo code */}
					<SectionCard n='02' title='Promo code' complete={!!appliedPromo}>
						<PromoCodeInput
							cartTotal={subtotal}
							onApply={(d, code) => setAppliedPromo({ code, discount: d })}
							onClear={() => setAppliedPromo(null)}
							appliedCode={appliedPromo?.code ?? null}
						/>
					</SectionCard>

					{/* 03 — Payment */}
					<SectionCard n='03' title='Payment' complete={paymentComplete}>
						<label className='bf-cod-card'>
							<div className='bf-cod-icon'>
								<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
									<rect x='2' y='6' width='20' height='12' rx='2' /><circle cx='12' cy='12' r='2' /><path d='M6 12h.01M18 12h.01' />
								</svg>
							</div>
							<div className='bf-cod-body'>
								<div className='bf-cod-title'>Cash on delivery</div>
								<div className='bf-cod-sub'>Pay the rider when your order arrives</div>
							</div>
							<span className='bf-cod-radio'>
								<span className='bf-cod-radio-dot' />
							</span>
						</label>
						<div className='bf-cod-note'>
							<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
								<circle cx='12' cy='12' r='10' /><line x1='12' y1='16' x2='12' y2='12' /><line x1='12' y1='8' x2='12.01' y2='8' />
							</svg>
							Card, EasyPaisa & JazzCash coming soon
						</div>
					</SectionCard>

					{/* 04 — Delivery time */}
					<SectionCard n='04' title='Delivery time'>
						<div style={{ display: 'flex', gap: 10 }}>
							<button
								onClick={() => setDeliveryMode('asap')}
								className={`bf-time-btn${deliveryMode === 'asap' ? ' active' : ''}`}
							>
								<div style={{ fontWeight: 700, fontSize: 14 }}>Get it ASAP</div>
								<div style={{ fontWeight: 800, fontSize: 20, marginTop: 6, fontFamily: 'var(--bf-mono)', color: 'var(--bf-ember)' }}>
									~{etaTime(ETA_MAX)}
								</div>
								<div style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 3, fontFamily: 'var(--bf-mono)' }}>
									{ETA_MIN}–{ETA_MAX} min from now
								</div>
							</button>
							<button
								onClick={() => setDeliveryMode('schedule')}
								className={`bf-time-btn${deliveryMode === 'schedule' ? ' active' : ''}`}
							>
								<div style={{ fontWeight: 700, fontSize: 14 }}>Schedule</div>
								<div style={{ fontSize: 12, color: 'var(--bf-mute)', marginTop: 6 }}>Pick a time slot</div>
								<div style={{ fontSize: 11, color: 'var(--bf-mute)', marginTop: 4, fontFamily: 'var(--bf-mono)' }}>Coming soon</div>
							</button>
						</div>
					</SectionCard>
				</div>

				{/* ── Desktop order sidebar ── */}
				<aside className='bf-checkout-sidebar'>
					<div className='bf-card' style={{ padding: 22, position: 'sticky', top: 22 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
							<h3 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Order summary</h3>
							<span style={{ fontSize: 12, color: 'var(--bf-mute)', fontFamily: 'var(--bf-mono)' }}>{displayItemCount} item{displayItemCount !== 1 ? 's' : ''}</span>
						</div>

						{items.length === 0 ? (
							<p style={{ fontSize: 13, color: 'var(--bf-ink-2)' }}>Your cart is empty.</p>
						) : (
							<div style={{ display: 'flex', flexDirection: 'column' }}>
								{items.map(item => (
									<CartRow
										key={`${item.productId}-${item.size ?? ''}-${item.dealId ?? ''}`}
										item={item}
										onQty={qty => updateQuantity(item.productId, qty, item.size, item.dealId)}
										onRemove={() => removeItem(item.productId, item.size, item.dealId)}
										disabled={submitting}
									/>
								))}
							</div>
						)}

						<hr className='bf-rule' />
						<CartTotals subtotal={displaySubtotal} discount={displayDiscount} />

						{submitError && <div style={{ marginTop: 14 }}><ErrorBanner message={submitError} /></div>}
						{!submitError && items.length === 0 && (
							<div style={{ marginTop: 14 }}>
								<ErrorBanner tone='info' message='Your cart is empty. Add something tasty to continue.' />
							</div>
						)}

						<button
							onClick={handlePlaceOrder}
							disabled={submitting || items.length === 0}
							aria-busy={submitting}
							className='bf-btn bf-btn-primary bf-btn-lg'
							style={{
								width: '100%', marginTop: 16, justifyContent: 'space-between',
								opacity: submitting ? 0.7 : 1,
								pointerEvents: submitting ? 'none' : 'auto',
							}}
						>
							<PlaceOrderBtn submitting={submitting} total={displayTotal} itemCount={displayItemCount} />
						</button>

						<div className='bf-sidebar-trust'>
							<span>
								<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
									<rect x='3' y='11' width='18' height='11' rx='2' /><path d='M7 11V7a5 5 0 0110 0v4' />
								</svg>
								Secure checkout
							</span>
							<span>
								<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
									<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
								</svg>
								Order guaranteed
							</span>
							<span>
								<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
									<rect x='2' y='6' width='20' height='12' rx='2' /><circle cx='12' cy='12' r='2' />
								</svg>
								Cash on delivery
							</span>
						</div>
					</div>
				</aside>
			</div>

			{/* ── Mobile fixed bottom CTA ── */}
			<div className='bf-checkout-mobile-bar'>
				{submitError && <div style={{ marginBottom: 8 }}><ErrorBanner message={submitError} /></div>}
				{!submitError && items.length === 0 && (
					<div style={{ marginBottom: 8 }}>
						<ErrorBanner tone='info' message='Your cart is empty. Add items to continue.' />
					</div>
				)}
				<button
					onClick={handlePlaceOrder}
					disabled={submitting || items.length === 0}
					aria-busy={submitting}
					className='bf-btn bf-btn-primary bf-btn-lg'
					style={{
						width: '100%', justifyContent: 'space-between',
						opacity: submitting ? 0.7 : 1,
						pointerEvents: submitting ? 'none' : 'auto',
					}}
				>
					<PlaceOrderBtn submitting={submitting} total={displayTotal} itemCount={displayItemCount} mobile />
				</button>
			</div>

			{submitting && <LoadingOverlay />}
		</div>
	)
}

export { CheckoutExperience }
