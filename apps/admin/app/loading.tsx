import React from 'react'

const BARS = [55, 82, 40, 68, 90, 50, 74]

export default function Loading() {
	return (
		<div style={{
			position: 'fixed', inset: 0, zIndex: 9999,
			display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
			background: 'linear-gradient(160deg, #f9f6f2 0%, #f3ede4 100%)',
			overflow: 'hidden',
			fontFamily: '"Archivo","Helvetica Neue",Helvetica,Arial,sans-serif',
		}}>

			{/* Decorative corner accents */}
			<div style={{
				position: 'absolute', top: -60, right: -60,
				width: 200, height: 200, borderRadius: '50%',
				background: 'radial-gradient(circle, rgba(255,182,39,0.12) 0%, transparent 70%)',
				pointerEvents: 'none',
			}} />
			<div style={{
				position: 'absolute', bottom: -80, left: -80,
				width: 260, height: 260, borderRadius: '50%',
				background: 'radial-gradient(circle, rgba(232,67,31,0.08) 0%, transparent 70%)',
				pointerEvents: 'none',
			}} />

			{/* Floating logo mark */}
			<div style={{
				width: 76, height: 76, borderRadius: 22,
				background: 'linear-gradient(145deg, #2e2a2b 0%, #231f20 100%)',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				boxShadow: '0 8px 32px rgba(35,31,32,0.28), 0 2px 8px rgba(35,31,32,0.15)',
				animation: 'logoFloat 2.2s ease-in-out infinite',
			}}>
				<span style={{ fontSize: 38, animation: 'logoSpin 10s linear infinite', display: 'block', lineHeight: 1 }}>
					🍕
				</span>
			</div>

			{/* Brand name with shimmer sweep */}
			<div style={{
				position: 'relative', marginTop: 20, overflow: 'hidden',
				fontWeight: 900, fontSize: 22, color: '#231f20', letterSpacing: '0.02em',
				userSelect: 'none',
			}}>
				Buddy Feast
				<div style={{
					position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
					background: 'linear-gradient(90deg, transparent 0%, rgba(255,182,39,0.65) 50%, transparent 100%)',
					animation: 'shimmerSlide 2.6s ease-in-out 0.4s infinite',
					transform: 'translateX(-100%)',
				}} />
			</div>

			<div style={{
				fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
				color: '#8c8487', textTransform: 'uppercase', marginTop: 5,
			}}>
				Admin Panel
			</div>

			{/* Animated dashboard bar chart */}
			<div style={{
				display: 'flex', gap: 5, alignItems: 'flex-end',
				height: 48, marginTop: 32, padding: '0 4px',
			}}>
				{BARS.map((h, i) => (
					<div key={i} style={{
						width: 12, height: `${h}%`, borderRadius: '3px 3px 0 0',
						background: i % 2 === 0
							? 'linear-gradient(to top, #231f20 0%, #3a3437 100%)'
							: 'linear-gradient(to top, #ffb627 0%, #ffc94a 100%)',
						animation: `barPulse 1.6s ease-in-out ${i * 0.11}s infinite alternate`,
						transformOrigin: 'bottom',
					}} />
				))}
			</div>

			{/* Baseline for chart */}
			<div style={{
				width: BARS.length * 12 + (BARS.length - 1) * 5 + 8, height: 2,
				background: 'rgba(35,31,32,0.12)', borderRadius: 1,
			}} />

			{/* Pulsing dots */}
			<div style={{ display: 'flex', gap: 7, marginTop: 24 }}>
				{[0, 1, 2, 3].map(i => (
					<div key={i} style={{
						width: 8, height: 8, borderRadius: '50%', background: '#231f20',
						animation: `adminDot 1.4s ease-in-out ${i * 0.2}s infinite`,
					}} />
				))}
			</div>

			<style>{`
				@keyframes logoFloat {
					0%,100% { transform: translateY(0) rotate(0deg); }
					50%     { transform: translateY(-8px) rotate(2deg); }
				}
				@keyframes logoSpin {
					from { transform: rotate(0deg); }
					to   { transform: rotate(360deg); }
				}
				@keyframes shimmerSlide {
					from { transform: translateX(-100%); }
					to   { transform: translateX(180%); }
				}
				@keyframes barPulse {
					from { transform: scaleY(0.3); opacity: 0.5; }
					to   { transform: scaleY(1); opacity: 1; }
				}
				@keyframes adminDot {
					0%,100% { transform: scale(1); background: #231f20; }
					50%     { transform: scale(1.7); background: #ffb627; }
				}
			`}</style>
		</div>
	)
}
