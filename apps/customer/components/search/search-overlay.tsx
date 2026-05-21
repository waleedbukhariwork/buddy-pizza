'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Icons } from '../ui/icon'
import { useSearch } from '../../lib/search-context'
import { useProducts, rs } from '../../lib/hooks'
import { useCartStore } from '../../lib/cart-store'
import { useProductSearchField } from './use-product-search-field'
import { SearchHighlight } from './search-highlight'
import { SearchSpinner } from './search-dropdown'

function SearchOverlay() {
	const { open, closeSearch } = useSearch()
	const router = useRouter()
	const [mounted, setMounted] = useState(false)
	const [activeIdx, setActiveIdx] = useState(-1)

	const { data: products } = useProducts()
	const search = useProductSearchField({ suggestSize: 8 })

	const trending = products?.filter((p) => p.isAvailable).slice(0, 5).map((p) => p.name) ?? []
	const addItem = useCartStore((s) => s.addItem)
	const trimmedInput = search.inputVal.trim()

	useEffect(() => { setMounted(true) }, [])

	useEffect(() => {
		if (!open) return
		document.body.style.overflow = 'hidden'
		const t = setTimeout(() => search.inputRef.current?.focus(), 80)
		return () => {
			document.body.style.overflow = ''
			clearTimeout(t)
		}
	}, [open, search.inputRef])

	const goToSearch = useCallback(
		(q: string) => {
			const trimmed = q.trim()
			if (!trimmed) return
			search.commitSearch(trimmed)
			closeSearch()
			router.push(`/menu?q=${encodeURIComponent(trimmed)}`)
		},
		[search, closeSearch, router],
	)

	const goToProduct = useCallback(
		(id: number) => {
			closeSearch()
			search.setInputVal('')
			router.push(`/menu/${id}`)
		},
		[closeSearch, router, search],
	)

	function quickAdd(p: { id: number; name: string; price: number; hasSizes?: boolean }) {
		if (p.hasSizes) {
			goToProduct(p.id)
			return
		}
		addItem({ productId: p.id, productName: p.name, price: p.price, quantity: 1 })
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Escape') {
			closeSearch()
			return
		}
		const recentItems = search.recentSearches
		if (trimmedInput) {
			const items = search.suggestionProducts
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setActiveIdx((i) => Math.min(i + 1, items.length - 1))
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setActiveIdx((i) => Math.max(i - 1, -1))
			} else if (e.key === 'Enter') {
				e.preventDefault()
				if (activeIdx >= 0 && items[activeIdx]) goToProduct(items[activeIdx].id)
				else goToSearch(search.inputVal)
			}
		} else if (e.key === 'Enter') {
			goToSearch(search.inputVal)
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			const len = recentItems.length
			if (!len) return
			e.preventDefault()
			if (e.key === 'ArrowDown') setActiveIdx((i) => Math.min(i + 1, len - 1))
			else setActiveIdx((i) => Math.max(i - 1, -1))
		} else if (e.key === 'Enter' && activeIdx >= 0) {
			goToSearch(recentItems[activeIdx])
		}
	}

	if (!mounted || !open) return null

	return createPortal(
		<div className='bf-search-overlay' role='dialog' aria-modal='true' aria-label='Search menu'>
			<div className='bf-search-overlay-backdrop' onClick={closeSearch} />
			<div className='bf-search-overlay-panel bf-sheet-enter'>
				<div className='bf-search-overlay-header'>
					<button type='button' className='bf-btn bf-btn-ghost bf-btn-icon bf-search-back' onClick={closeSearch} aria-label='Close search'>
						<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M15 18l-6-6 6-6' /></svg>
					</button>
					<div className='bf-search-overlay-input-wrap'>
						<span className='bf-search-icon'>{Icons.search}</span>
						<input
							ref={search.inputRef}
							value={search.inputVal}
							onChange={(e) => { search.setInputVal(e.target.value); setActiveIdx(-1) }}
							onKeyDown={handleKeyDown}
							placeholder='Search pizza, burgers, deals…'
							autoComplete='off'
							spellCheck={false}
						/>
						{search.suggestLoading && (
							<span className='bf-search-field-trailing'><SearchSpinner /></span>
						)}
						{search.inputVal && !search.suggestLoading && (
							<button type='button' className='bf-search-clear' onClick={() => { search.setInputVal(''); search.inputRef.current?.focus() }} aria-label='Clear'>
								{Icons.x}
							</button>
						)}
					</div>
				</div>

				<div className='bf-search-overlay-body'>
					{!trimmedInput && trending.length > 0 && (
						<div className='bf-search-section'>
							<div className='bf-search-section-label'>Trending</div>
							<div className='bf-search-chips'>
								{trending.map((t) => (
									<button key={t} type='button' className='bf-search-chip' onClick={() => goToSearch(t)}>{t}</button>
								))}
							</div>
						</div>
					)}

					<div className='bf-search-section'>
						<div className='bf-search-section-label'>{search.sectionLabel}</div>

						{search.suggestLoading && (
							<div className='bf-search-dropdown-status'>
								<SearchSpinner />
								<span>Searching…</span>
							</div>
						)}

						{!search.suggestLoading && search.emptyMessage && (
							<div className='bf-search-dropdown-status bf-search-dropdown-empty'>{search.emptyMessage}</div>
						)}

						{!search.suggestLoading && trimmedInput && search.suggestionProducts.length > 0 && (
							<ul className='bf-search-results-list'>
								{search.suggestionProducts.map((p, i) => (
									<li key={p.id}>
										<div
											className={`bf-search-result${activeIdx === i ? ' active' : ''}`}
											role='button'
											tabIndex={0}
											onClick={() => goToProduct(p.id)}
											onKeyDown={(e) => { if (e.key === 'Enter') goToProduct(p.id) }}
										>
											<span className='bf-search-result-main'>
												<SearchHighlight text={p.name} query={search.inputVal} />
												<span className='bf-search-result-cat'>{p.category}</span>
											</span>
											<span className='bf-search-result-price bf-mono'>{rs(p.price)}</span>
											<button
												type='button'
												className='bf-btn bf-btn-primary bf-btn-sm bf-search-quick-add'
												onClick={(e) => { e.stopPropagation(); quickAdd(p) }}
												aria-label={`Add ${p.name}`}
											>
												{Icons.plus}
											</button>
										</div>
									</li>
								))}
							</ul>
						)}

						{!trimmedInput && search.recentSearches.length > 0 && (
							<ul className='bf-search-results-list'>
								{search.recentSearches.map((r, i) => (
									<li key={r}>
										<button
											type='button'
											className={`bf-search-result${activeIdx === i ? ' active' : ''}`}
											onClick={() => goToSearch(r)}
										>
											<span className='bf-search-result-icon'>{Icons.clock}</span>
											<span>{r}</span>
										</button>
									</li>
								))}
							</ul>
						)}

						{trimmedInput && (
							<button type='button' className='bf-search-see-all' onClick={() => goToSearch(search.inputVal)}>
								Search for &ldquo;{search.inputVal}&rdquo; {Icons.arrow}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>,
		document.body,
	)
}

export { SearchOverlay }
