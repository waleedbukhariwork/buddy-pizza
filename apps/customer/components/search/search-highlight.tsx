'use client'
import React from 'react'

function SearchHighlight({ text, query }: { text: string; query: string }) {
	if (!query.trim()) return <>{text}</>
	const idx = text.toLowerCase().indexOf(query.toLowerCase())
	if (idx === -1) return <>{text}</>
	return (
		<>
			{text.slice(0, idx)}
			<mark className='bf-search-mark'>{text.slice(idx, idx + query.length)}</mark>
			{text.slice(idx + query.length)}
		</>
	)
}

export { SearchHighlight }
