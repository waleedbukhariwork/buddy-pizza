export const PRODUCT_RECENT_KEY = 'bf_recent_searches'
export const DEAL_RECENT_KEY = 'bf_recent_deal_searches'
export const MAX_RECENT_SEARCHES = 5

export function loadRecentSearches(key: string): string[] {
	if (typeof window === 'undefined') return []
	try {
		const raw = localStorage.getItem(key)
		const list = raw ? JSON.parse(raw) : []
		return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []
	} catch {
		return []
	}
}

export function saveRecentSearch(key: string, query: string): string[] {
	const q = query.trim()
	if (!q) return loadRecentSearches(key)
	const list = [q, ...loadRecentSearches(key).filter((r) => r !== q)].slice(0, MAX_RECENT_SEARCHES)
	localStorage.setItem(key, JSON.stringify(list))
	return list
}

export function clearRecentSearches(key: string): void {
	localStorage.removeItem(key)
}
