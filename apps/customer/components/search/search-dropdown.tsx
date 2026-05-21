'use client'
import React from 'react'
import { Icons } from '../ui/icon'
import { SearchHighlight } from './search-highlight'

export type SearchDropdownItem = {
	type: 'recent' | 'suggestion'
	label: string
	sub?: string
}

function SearchSpinner() {
	return (
		<span className='bf-search-dropdown-spinner' aria-hidden='true'>
			<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
				<path d='M21 12a9 9 0 1 1-6.219-8.56' />
			</svg>
		</span>
	)
}

function SearchDropdown({
	open,
	inputVal,
	items,
	activeIdx,
	sectionLabel,
	loading,
	emptyMessage,
	onSelect,
	onHover,
	onClearRecents,
	showClearRecents,
}: {
	open: boolean
	inputVal: string
	items: SearchDropdownItem[]
	activeIdx: number
	sectionLabel: string
	loading?: boolean
	emptyMessage?: string
	onSelect: (label: string) => void
	onHover: (index: number) => void
	onClearRecents?: () => void
	showClearRecents?: boolean
}) {
	if (!open) return null

	const showPanel = loading || items.length > 0 || !!emptyMessage

	if (!showPanel) return null

	return (
		<div className='bf-search-dropdown' role='listbox'>
			<div className='bf-search-dropdown-label'>{sectionLabel}</div>

			{loading && (
				<div className='bf-search-dropdown-status'>
					<SearchSpinner />
					<span>Searching…</span>
				</div>
			)}

			{!loading && emptyMessage && items.length === 0 && (
				<div className='bf-search-dropdown-status bf-search-dropdown-empty'>{emptyMessage}</div>
			)}

			{!loading &&
				items.map((item, i) => (
					<button
						key={`${item.type}-${item.label}-${i}`}
						type='button'
						role='option'
						aria-selected={activeIdx === i}
						className={`bf-search-dropdown-item${activeIdx === i ? ' active' : ''}`}
						onMouseDown={(e) => {
							e.preventDefault()
							onSelect(item.label)
						}}
						onMouseEnter={() => onHover(i)}
					>
						<span className='bf-search-dropdown-icon'>
							{item.type === 'recent' ? (
								<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
									<circle cx='12' cy='12' r='10' />
									<polyline points='12 6 12 12 16 14' />
								</svg>
							) : (
								Icons.search
							)}
						</span>
						<span className='bf-search-dropdown-text'>
							<SearchHighlight text={item.label} query={inputVal} />
						</span>
						{item.sub && <span className='bf-search-dropdown-sub'>{item.sub}</span>}
					</button>
				))}

			{showClearRecents && onClearRecents && (
				<button type='button' className='bf-search-dropdown-clear' onMouseDown={(e) => { e.preventDefault(); onClearRecents() }}>
					Clear recent searches
				</button>
			)}
		</div>
	)
}

export { SearchDropdown, SearchSpinner }
