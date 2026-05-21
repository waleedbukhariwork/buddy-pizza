'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useDebouncedValue, SEARCH_DEBOUNCE_MS } from '../../lib/use-debounced-value'
import {
	DEAL_RECENT_KEY,
	loadRecentSearches,
	saveRecentSearch,
	clearRecentSearches,
} from '../../lib/search-storage'
import type { Deal } from '../../lib/hooks'
import type { SearchDropdownItem } from './search-dropdown'

function filterDeals(deals: Deal[], q: string): Deal[] {
	const lower = q.toLowerCase()
	return deals.filter(
		(d) =>
			d.title.toLowerCase().includes(lower) ||
			(d.description ?? '').toLowerCase().includes(lower) ||
			(d.items ?? '').toLowerCase().includes(lower),
	)
}

/** Deals: client-side filter after debounce (small catalog). No API per keystroke. */
export function useDealsSearchField(activeDeals: Deal[], options?: {
	initialQ?: string
	onCommit?: (q: string) => void
	onClear?: () => void
}) {
	const [inputVal, setInputVal] = useState(options?.initialQ ?? '')
	const [searchQ, setSearchQ] = useState(options?.initialQ ?? '')
	const [showDropdown, setShowDropdown] = useState(false)
	const [activeIdx, setActiveIdx] = useState(-1)
	const [recentSearches, setRecentSearches] = useState<string[]>([])

	const searchWrapRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const trimmedInput = inputVal.trim()
	const { debounced: debouncedQ, isPending: isDebouncePending } = useDebouncedValue(trimmedInput, SEARCH_DEBOUNCE_MS)

	const isSearchMode = searchQ.trim().length > 0
	const suggestLoading = trimmedInput.length > 0 && isDebouncePending

	const suggestions = useMemo(() => {
		if (!debouncedQ) return []
		return filterDeals(activeDeals, debouncedQ).slice(0, 6)
	}, [activeDeals, debouncedQ])

	const visibleDeals = useMemo(() => {
		if (!searchQ.trim()) return activeDeals
		return filterDeals(activeDeals, searchQ)
	}, [activeDeals, searchQ])

	const dropdownItems: SearchDropdownItem[] = useMemo(() => {
		if (trimmedInput) {
			return suggestions.map((d) => ({
				type: 'suggestion' as const,
				label: d.title,
				sub: d.tag ?? undefined,
			}))
		}
		return recentSearches.map((r) => ({ type: 'recent' as const, label: r }))
	}, [trimmedInput, suggestions, recentSearches])

	const sectionLabel = trimmedInput
		? suggestLoading
			? 'SEARCHING'
			: 'SUGGESTIONS'
		: 'RECENT SEARCHES'

	const emptyMessage =
		trimmedInput && !suggestLoading && debouncedQ && suggestions.length === 0
			? `No deals match "${debouncedQ}".`
			: undefined

	useEffect(() => {
		setRecentSearches(loadRecentSearches(DEAL_RECENT_KEY))
	}, [])

	useEffect(() => {
		function onMouseDown(e: MouseEvent) {
			if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
				setShowDropdown(false)
				setActiveIdx(-1)
			}
		}
		document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [])

	const commitSearch = useCallback(
		(val: string) => {
			const q = val.trim()
			if (!q) return
			setRecentSearches(saveRecentSearch(DEAL_RECENT_KEY, q))
			setInputVal(q)
			setSearchQ(q)
			setShowDropdown(false)
			setActiveIdx(-1)
			options?.onCommit?.(q)
		},
		[options],
	)

	const clearSearch = useCallback(() => {
		setInputVal('')
		setSearchQ('')
		setShowDropdown(false)
		setActiveIdx(-1)
		inputRef.current?.focus()
		options?.onClear?.()
	}, [options])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (!showDropdown || dropdownItems.length === 0) {
				if (e.key === 'Enter') commitSearch(inputVal)
				if (e.key === 'Escape') {
					clearSearch()
					setShowDropdown(false)
				}
				return
			}
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setActiveIdx((i) => Math.min(i + 1, dropdownItems.length - 1))
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setActiveIdx((i) => Math.max(i - 1, -1))
			} else if (e.key === 'Enter') {
				e.preventDefault()
				if (activeIdx >= 0) commitSearch(dropdownItems[activeIdx].label)
				else commitSearch(inputVal)
			} else if (e.key === 'Escape') {
				setShowDropdown(false)
				setActiveIdx(-1)
			}
		},
		[showDropdown, dropdownItems, activeIdx, commitSearch, inputVal, clearSearch],
	)

	const syncFromUrl = useCallback((q: string | null) => {
		if (q) {
			setInputVal(q)
			setSearchQ(q)
		}
	}, [])

	return {
		inputVal,
		setInputVal,
		searchQ,
		isSearchMode,
		visibleDeals,
		suggestLoading,
		showDropdown,
		setShowDropdown,
		activeIdx,
		setActiveIdx,
		dropdownItems,
		sectionLabel,
		emptyMessage,
		commitSearch,
		clearSearch,
		handleKeyDown,
		searchWrapRef,
		inputRef,
		recentSearches,
		clearRecent: () => {
			clearRecentSearches(DEAL_RECENT_KEY)
			setRecentSearches([])
			setShowDropdown(false)
		},
		syncFromUrl,
	}
}
