import React from 'react'

export default function Loading() {
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'rgba(255, 255, 255, 0.8)',
				backdropFilter: 'blur(4px)',
				zIndex: 9999,
				overflow: 'hidden'
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '16px'
				}}
			>
				<div 
					className="loader-spinner"
					style={{
						width: '48px',
						height: '48px',
						border: '4px solid var(--bf-amber-08, #FFECD1)',
						borderTop: '4px solid var(--bf-amber, #F9AA33)',
						borderRadius: '50%',
						animation: 'spin 1s linear infinite'
					}}
				/>
				<div 
					style={{
						fontWeight: 700,
						fontSize: '16px',
						color: 'var(--bf-ink, #000000)',
						letterSpacing: '0.05em',
						animation: 'pulse 1.5s ease-in-out infinite'
					}}
				>
					LOADING...
				</div>
				<style>{`
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
					@keyframes pulse {
						0%, 100% { opacity: 1; }
						50% { opacity: 0.5; }
					}
				`}</style>
			</div>
		</div>
	)
}
