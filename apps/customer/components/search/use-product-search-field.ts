'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useProductSearch } from '../../lib/hooks'
import { useDebouncedValue, SEARCH_DEBOUNCE_MS } from '../../lib/use-debounced-value'
import {
	PRODUCT_RECENT_KEY,
	loadRecentSearches,
	saveRecentSearch,
	clearRecentSearches,
} from '../../lib/search-storage'
import type { SearchDropdownItem } from './search-dropdown'

const SUGGEST_SIZE = 6
const RESULT_SIZE = 12

export function useProductSearchField(options?: {
	initialQ?: string
	suggestSize?: number
	resultSize?: number
	onCommit?: (q: string) => void
	onClear?: () => void
}) {
	const suggestSize = options?.suggestSize ?? SUGGEST_SIZE
	const resultSize = options?.resultSize ?? RESULT_SIZE

	const [inputVal, setInputVal] = useState(options?.initialQ ?? '')
	const [searchQ, setSearchQ] = useState(options?.initialQ ?? '')
	const [searchPage, setSearchPage] = useState(0)
	const [showDropdown, setShowDropdown] = useState(false)
	const [activeIdx, setActiveIdx] = useState(-1)
	const [recentSearches, setRecentSearches] = useState<string[]>([])

	const searchWrapRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const trimmedInput = inputVal.trim()
	const { debounced: debouncedQ, isPending: isDebouncePending } = useDebouncedValue(trimmedInput, SEARCH_DEBOUNCE_MS)

	// API: suggestions — only when debounced query is non-empty (not every keystroke)
	const {
		data: suggestData,
		isLoading: suggestFetching,
		isValidating: suggestValidating,
	} = useProductSearch(debouncedQ, null, 0, suggestSize)

	// API: full results — only after user commits search
	const {
		data: searchData,
		isLoading: searchLoading,
		error: searchError,
	} = useProductSearch(searchQ, null, searchPage, resultSize)

	const isSearchMode = searchQ.trim().length > 0
	const suggestLoading =
		trimmedInput.length > 0 && (isDebouncePending || ((suggestFetching || suggestValidating) && debouncedQ.length > 0))

	const suggestions = debouncedQ.length > 0 ? (suggestData?.content ?? []) : []

	const dropdownItems: SearchDropdownItem[] = useMemo(() => {
		if (trimmedInput) {
			return suggestions.map((s) => ({
				type: 'suggestion' as const,
				label: s.name,
				sub: s.category,
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
			? `No matches for "${debouncedQ}". Press Enter to search all items.`
			: undefined

	useEffect(() => {
		setRecentSearches(loadRecentSearches(PRODUCT_RECENT_KEY))
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
			setRecentSearches(saveRecentSearch(PRODUCT_RECENT_KEY, q))
			setInputVal(q)
			setSearchQ(q)
			setSearchPage(0)
			setShowDropdown(false)
			setActiveIdx(-1)
			options?.onCommit?.(q)
		},
		[options],
	)

	const clearSearch = useCallback(() => {
		setInputVal('')
		setSearchQ('')
		setSearchPage(0)
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
		searchPage,
		setSearchPage,
		isSearchMode,
		searchData,
		searchLoading,
		searchError,
		suggestLoading,
		isDebouncePending,
		debouncedQ,
		suggestionProducts: suggestions,
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
			clearRecentSearches(PRODUCT_RECENT_KEY)
			setRecentSearches([])
			setShowDropdown(false)
		},
		syncFromUrl,
	}
}
