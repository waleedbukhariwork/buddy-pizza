'use client'
import React, { createContext, useCallback, useContext, useState } from 'react'

interface SearchContextValue {
	open: boolean
	openSearch: () => void
	closeSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

function SearchProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false)
	const openSearch = useCallback(() => setOpen(true), [])
	const closeSearch = useCallback(() => setOpen(false), [])
	return (
		<SearchContext.Provider value={{ open, openSearch, closeSearch }}>
			{children}
		</SearchContext.Provider>
	)
}

function useSearch() {
	const ctx = useContext(SearchContext)
	if (!ctx) throw new Error('useSearch must be used within SearchProvider')
	return ctx
}

export { SearchProvider, useSearch }
