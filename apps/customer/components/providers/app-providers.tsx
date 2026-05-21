'use client'
import React, { useEffect, useRef } from 'react'
import { SearchProvider } from '../../lib/search-context'
import { SearchOverlay } from '../search/search-overlay'
import { useCartStore } from '../../lib/cart-store'
import { syncCartToServer } from '../../lib/hooks'
import { apiClient } from '../../lib/api-client'
import type { CartItem } from '@shared/index'
import type { ServerCartDTO } from '../../lib/hooks'

// Retry with exponential backoff. Throws after all attempts exhausted.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 1000): Promise<T> {
	let lastErr: unknown
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn()
		} catch (err) {
			lastErr = err
			if (i < attempts - 1) await new Promise((r) => setTimeout(r, baseMs * 2 ** i))
		}
	}
	throw lastErr
}

function isAuthenticated() {
	return typeof window !== 'undefined' && !!localStorage.getItem('token')
}

// ─── Cart sync: localStorage rehydration + server persistence ─────────────────
function CartSyncProvider({ children }: { children: React.ReactNode }) {
	const isSyncing = useRef(false)
	const syncTimer = useRef<ReturnType<typeof setTimeout>>()

	useEffect(() => {
		// Step 1: rehydrate from localStorage (skipHydration was set in store)
		useCartStore.persist.rehydrate()

		// Step 2: fetch server cart and seed local if local is empty (auth required)
		if (!isAuthenticated()) return
		const localItems = useCartStore.getState().items
		if (localItems.length === 0) {
			isSyncing.current = true
			apiClient
				.get<ServerCartDTO>('/v1/cart')
				.then(({ data }) => {
					if (data.items.length > 0) {
						useCartStore.setState({
							items: data.items as CartItem[],
							total: data.total,
						})
					}
				})
				.catch(() => {})
				.finally(() => {
					isSyncing.current = false
				})
		}
	}, [])

	useEffect(() => {
		// Subscribe to cart changes, debounce, then sync with retry (auth required)
		const unsub = useCartStore.subscribe(() => {
			if (isSyncing.current || !isAuthenticated()) return
			clearTimeout(syncTimer.current)
			syncTimer.current = setTimeout(() => {
				if (!isAuthenticated()) return
				const latest = useCartStore.getState().items
				withRetry(() => syncCartToServer(latest)).catch(() => {
					// All retries exhausted — cart is still safe in localStorage
				})
			}, 600)
		})

		return () => {
			unsub()
			clearTimeout(syncTimer.current)
		}
	}, [])

	return <>{children}</>
}

function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<SearchProvider>
			<CartSyncProvider>
				{children}
			</CartSyncProvider>
			<SearchOverlay />
		</SearchProvider>
	)
}

export { AppProviders }
