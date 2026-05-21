'use client'
import React from 'react'
import { Icons } from '../ui/icon'
import { SearchDropdown } from './search-dropdown'
import { SearchSpinner } from './search-dropdown'

function SearchField({
	inputRef,
	searchWrapRef,
	inputVal,
	onInputChange,
	onFocus,
	onKeyDown,
	onClear,
	placeholder,
	isActive,
	showDropdown,
	setShowDropdown,
	dropdownItems,
	sectionLabel,
	suggestLoading,
	emptyMessage,
	activeIdx,
	onSelect,
	onHover,
	onClearRecents,
	showClearRecents,
	committedLoading,
	maxWidth = 520,
}: {
	inputRef: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLInputElement>
	searchWrapRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>
	inputVal: string
	onInputChange: (value: string) => void
	onFocus: () => void
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
	onClear: () => void
	placeholder: string
	isActive?: boolean
	showDropdown: boolean
	setShowDropdown: (open: boolean) => void
	dropdownItems: { type: 'recent' | 'suggestion'; label: string; sub?: string }[]
	sectionLabel: string
	suggestLoading?: boolean
	emptyMessage?: string
	activeIdx: number
	onSelect: (label: string) => void
	onHover: (index: number) => void
	onClearRecents?: () => void
	showClearRecents?: boolean
	committedLoading?: boolean
	maxWidth?: number
}) {
	const hasDropdownContent = suggestLoading || dropdownItems.length > 0 || !!emptyMessage
	const borderActive = showDropdown && hasDropdownContent

	return (
		<div ref={searchWrapRef as React.Ref<HTMLDivElement>} className='bf-search-field' style={{ maxWidth }}>
			<div
				className={`bf-search-field-input-wrap${borderActive ? ' bf-search-field-open' : ''}${isActive ? ' bf-search-field-committed' : ''}`}
			>
				<span className='bf-search-field-icon'>{Icons.search}</span>
				<input
					ref={inputRef as React.Ref<HTMLInputElement>}
					value={inputVal}
					onChange={(e) => {
						onInputChange(e.target.value)
						setShowDropdown(true)
					}}
					onFocus={() => {
						onFocus()
						setShowDropdown(true)
					}}
					onKeyDown={onKeyDown}
					className='bf-search-field-input'
					placeholder={placeholder}
					autoComplete='off'
					spellCheck={false}
					aria-autocomplete='list'
					aria-expanded={showDropdown && hasDropdownContent}
				/>
				{suggestLoading && !committedLoading && (
					<span className='bf-search-field-trailing'>
						<SearchSpinner />
					</span>
				)}
				{committedLoading && (
					<span className='bf-search-field-trailing'>
						<SearchSpinner />
					</span>
				)}
				{inputVal && !suggestLoading && (
					<button type='button' className='bf-search-field-clear' onClick={onClear} aria-label='Clear search'>
						{Icons.x}
					</button>
				)}
			</div>
			<SearchDropdown
				open={showDropdown}
				inputVal={inputVal}
				items={dropdownItems}
				activeIdx={activeIdx}
				sectionLabel={sectionLabel}
				loading={suggestLoading}
				emptyMessage={emptyMessage}
				onSelect={onSelect}
				onHover={onHover}
				onClearRecents={onClearRecents}
				showClearRecents={showClearRecents}
			/>
		</div>
	)
}

export { SearchField }
