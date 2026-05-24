'use client'
import React from 'react'

interface Props {
	children: React.ReactNode
}

interface State {
	hasError: boolean
	error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error }
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						padding: 40,
						textAlign: 'center',
						fontFamily: 'sans-serif',
					}}
				>
					<h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#231f20' }}>
						Something went wrong
					</h2>
					<p style={{ margin: '0 0 20px', fontSize: 13, color: '#8c8487' }}>
						{this.state.error?.message || 'An unexpected error occurred'}
					</p>
					<button
						onClick={() => {
							this.setState({ hasError: false, error: null })
							window.location.reload()
						}}
						style={{
							padding: '10px 24px',
							border: 'none',
							borderRadius: 12,
							background: '#e8431f',
							color: '#fff',
							fontSize: 13,
							fontWeight: 600,
							cursor: 'pointer',
						}}
					>
						Reload page
					</button>
				</div>
			)
		}
		return this.props.children
	}
}
