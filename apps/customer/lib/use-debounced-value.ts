'use client'
import { useEffect, useState } from 'react'

/** Industry-standard search debounce — API runs only after user pauses typing. */
export const SEARCH_DEBOUNCE_MS = 600

export function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): {
	debounced: T
	isPending: boolean
} {
	const [debounced, setDebounced] = useState(value)
	const [isPending, setIsPending] = useState(false)

	useEffect(() => {
		if (Object.is(value, debounced)) {
			setIsPending(false)
			return
		}
		setIsPending(true)
		const t = setTimeout(() => {
			setDebounced(value)
			setIsPending(false)
		}, delayMs)
		return () => clearTimeout(t)
	}, [value, delayMs])

	return { debounced, isPending }
}
