'use client'
import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import type { PlacedOrder } from '../../lib/hooks'
import type { CartItem } from '@shared/index'
import { rs } from '../../lib/hooks'
import { Icons } from './icon'

// ─── Brand identity ──────────────────────────────────────────────────────────
const BRAND = {
	name: 'Buddy Feast',
	tagline: 'Hot & Fresh · Fast Delivery',
	footer: 'Thank you for your order!',
	track: 'track.buddyfeast.com',
}

// ─── Receipt content (captured for download) ─────────────────────────────────
function ReceiptContent({
	order,
	cartItems,
}: {
	order: PlacedOrder
	cartItems: CartItem[]
}) {
	const subtotal = cartItems.reduce((s, i) => s + (i.sizePrice ?? i.price) * i.quantity, 0)
	const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0)
	const createdAt = order.createdAt
		? new Date(order.createdAt).toLocaleDateString('en-PK', {
				day: 'numeric', month: 'long', year: 'numeric',
				hour: 'numeric', minute: '2-digit', hour12: true,
		  })
		: '—'

	return (
		<div style={{
			background: '#fff',
			padding: 40,
			fontFamily: 'system-ui, -apple-system, sans-serif',
			maxWidth: 420,
			margin: '0 auto',
		}}>
			{/* Brand header */}
			<div style={{ textAlign: 'center', marginBottom: 28 }}>
				<div style={{
					display: 'inline-flex', alignItems: 'center', gap: 10,
					background: '#231f20', color: '#fff',
					padding: '10px 22px', borderRadius: 999,
					fontWeight: 900, fontSize: 16, letterSpacing: '-0.02em',
				}}>
					<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
						<path d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83'/>
					</svg>
					{BRAND.name}
				</div>
				<div style={{ fontSize: 11, color: '#999', marginTop: 6, letterSpacing: '0.05em' }}>
					{BRAND.tagline}
				</div>
			</div>

			<div style={{ borderTop: '2px dashed #ddd', marginBottom: 20 }} />

			{/* Order info */}
			<div style={{ textAlign: 'center', marginBottom: 20 }}>
				<div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>
					Order Receipt
				</div>
				<div style={{ fontWeight: 800, fontSize: 22, color: '#231f20', letterSpacing: '-0.02em' }}>
					#{order.orderNumber}
				</div>
				<div style={{ fontSize: 11.5, color: '#666', marginTop: 4 }}>
					{createdAt}
				</div>
			</div>

			<div style={{ borderTop: '1px solid #eee', marginBottom: 16 }} />

			{/* Items */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase', marginBottom: 10 }}>
					Items ({totalItems})
				</div>
				{cartItems.map((it, i) => (
					<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
						<div style={{ flex: 1 }}>
							<span style={{ fontWeight: 700, fontSize: 12.5, color: '#333' }}>
								{it.quantity}× {it.productName}
							</span>
							{it.size && (
								<span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>{it.size}</span>
							)}
						</div>
						<span style={{ fontWeight: 700, fontSize: 12.5, color: '#231f20', fontFamily: 'monospace' }}>
							{rs((it.sizePrice ?? it.price) * it.quantity)}
						</span>
					</div>
				))}
			</div>

			<div style={{ borderTop: '1px solid #eee', marginBottom: 16 }} />

			{/* Totals */}
			<div style={{ marginBottom: 20 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, color: '#666' }}>
					<span>Subtotal</span>
					<span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{rs(subtotal)}</span>
				</div>
				<div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, color: '#666' }}>
					<span>Delivery</span>
					<span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#22c55e' }}>FREE</span>
				</div>
				<div style={{ borderTop: '2px solid #231f20', margin: '6px 0 8px' }} />
				<div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 16, fontWeight: 800, color: '#231f20' }}>
					<span>Total</span>
					<span style={{ fontFamily: 'monospace' }}>{rs(order.total)}</span>
				</div>
			</div>

			{/* Delivery address */}
			{order.deliveryAddress && (
				<>
					<div style={{ borderTop: '1px solid #eee', marginBottom: 14 }} />
					<div style={{ marginBottom: 14 }}>
						<div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>
							Deliver to
						</div>
						<div style={{ fontSize: 12.5, color: '#333', lineHeight: 1.5 }}>
							{order.deliveryAddress}
						</div>
					</div>
				</>
			)}

			{/* Footer */}
			<div style={{ borderTop: '2px dashed #ddd', marginTop: 20, paddingTop: 20, textAlign: 'center' }}>
				<div style={{ fontWeight: 800, fontSize: 14, color: '#231f20', marginBottom: 4 }}>
					{BRAND.footer}
				</div>
				<div style={{ fontSize: 11, color: '#999' }}>
					{BRAND.track}
				</div>
			</div>
		</div>
	)
}

// ─── Receipt modal ───────────────────────────────────────────────────────────
export function ReceiptModal({
	order,
	cartItems,
	onClose,
}: {
	order: PlacedOrder
	cartItems: CartItem[]
	onClose: () => void
}) {
	const receiptRef = useRef<HTMLDivElement>(null)
	const [downloading, setDownloading] = useState(false)

	async function handleDownload() {
		if (!receiptRef.current || downloading) return
		setDownloading(true)
		try {
			const canvas = await html2canvas(receiptRef.current, {
				scale: 2,
				backgroundColor: '#ffffff',
				useCORS: true,
				logging: false,
			})
			const link = document.createElement('a')
			link.download = `receipt-${order.orderNumber}.png`
			link.href = canvas.toDataURL('image/png')
			link.click()
		} catch {
			// fallback
		} finally {
			setDownloading(false)
		}
	}

	function handlePrint() {
		const printWin = window.open('', '_blank')
		if (!printWin) return
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Receipt - ${order.orderNumber}</title>
				<style>
					body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
					@media print { @page { margin: 0; } }
				</style>
			</head>
			<body>
				${receiptRef.current?.innerHTML ?? ''}
				<script>
					window.onload = function() { window.print(); window.close(); }
				</script>
			</body>
			</html>
		`
		printWin.document.write(html)
		printWin.document.close()
	}

	return (
		<div
			style={{
				position: 'fixed', inset: 0, zIndex: 9999,
				background: 'rgba(35,31,32,.6)', backdropFilter: 'blur(6px)',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				padding: 20,
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: '#fff', borderRadius: 20,
					maxWidth: 480, width: '100%',
					maxHeight: '90vh', overflow: 'hidden',
					display: 'flex', flexDirection: 'column',
					boxShadow: '0 24px 64px rgba(35,31,32,.24)',
				}}
				onClick={e => e.stopPropagation()}
			>
				{/* Receipt scrollable area */}
				<div style={{ overflow: 'auto', flex: 1 }} ref={receiptRef}>
					<ReceiptContent order={order} cartItems={cartItems} />
				</div>

				{/* Actions */}
				<div style={{
					padding: '16px 24px',
					borderTop: '1px solid #eee',
					display: 'flex', gap: 10,
					background: '#fafafa',
				}}>
					<button
						onClick={handleDownload}
						disabled={downloading}
						style={{
							flex: 1, padding: '11px 0', borderRadius: 12,
							border: 'none', cursor: downloading ? 'default' : 'pointer',
							background: '#231f20', color: '#fff',
							fontWeight: 700, fontSize: 13,
							display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
							opacity: downloading ? 0.7 : 1,
							transition: 'opacity .15s',
						}}
					>
						{downloading ? (
							<><span className='bf-spinner' /> Downloading…</>
						) : (
							<><svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>
								Download receipt
							</>
						)}
					</button>
					<button
						onClick={handlePrint}
						style={{
							padding: '11px 18px', borderRadius: 12,
							border: '1.5px solid #ddd', cursor: 'pointer',
							background: '#fff', color: '#333',
							fontWeight: 600, fontSize: 13,
							display: 'flex', alignItems: 'center', gap: 6,
							transition: 'border-color .15s',
						}}
						onMouseEnter={e => (e.currentTarget.style.borderColor = '#999')}
						onMouseLeave={e => (e.currentTarget.style.borderColor = '#ddd')}
					>
						<svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'><polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'/><rect x='6' y='14' width='12' height='8'/></svg>
						Print
					</button>
					<button
						onClick={onClose}
						style={{
							width: 42, borderRadius: 12,
							border: '1.5px solid #ddd', cursor: 'pointer',
							background: '#fff', color: '#666',
							display: 'grid', placeItems: 'center',
							transition: 'border-color .15s',
						}}
						onMouseEnter={e => (e.currentTarget.style.borderColor = '#999')}
						onMouseLeave={e => (e.currentTarget.style.borderColor = '#ddd')}
					>
						{Icons.x}
					</button>
				</div>
			</div>
		</div>
	)
}
