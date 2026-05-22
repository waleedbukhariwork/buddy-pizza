import React from 'react'

const MSGS = [
	'Getting ready to roll...',
	'Checking your route...',
	"Let's go! 🏍️",
]

export default function Loading() {
	return (
		<div style={{
			position: 'fixed', inset: 0, zIndex: 9999,
			display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
			background: 'radial-gradient(ellipse 90% 80% at 50% 46%, #fff5f3 0%, #ffddd5 100%)',
			overflow: 'hidden',
			fontFamily: '"Archivo","Helvetica Neue",Helvetica,Arial,sans-serif',
		}}>

			{/* Road surface */}
			<div style={{
				position: 'absolute', bottom: '12%', left: 0, right: 0, height: 4,
				background: 'repeating-linear-gradient(90deg, rgba(232,67,31,0.28) 0px, rgba(232,67,31,0.28) 32px, transparent 32px, transparent 64px)',
				animation: 'roadScroll 0.75s linear infinite',
			}} />
			{/* Road centre dashes */}
			<div style={{
				position: 'absolute', bottom: '12.7%', left: 0, right: 0, height: 2,
				background: 'repeating-linear-gradient(90deg, rgba(255,182,39,0.5) 0px, rgba(255,182,39,0.5) 22px, transparent 22px, transparent 44px)',
				animation: 'roadScroll 0.55s linear infinite',
			}} />

			{/* Speed lines trailing behind the bike */}
			<div style={{ position: 'absolute', top: '37%', left: '12%', pointerEvents: 'none' }}>
				{[52, 36, 44].map((w, i) => (
					<div key={i} style={{
						height: 2.5, width: w, borderRadius: 2, marginBottom: 7,
						background: 'rgba(232,67,31,0.38)',
						animation: `speedLine ${0.55 + i * 0.08}s ease-out ${i * 0.12}s infinite`,
					}} />
				))}
			</div>

			{/* Motorcycle — outer sways, inner bounces */}
			<div style={{ animation: 'bikeFloat 3s ease-in-out infinite' }}>
				<div style={{
					fontSize: 84, lineHeight: 1,
					animation: 'bikeBounce 0.42s ease-in-out infinite alternate',
					filter: 'drop-shadow(0 10px 22px rgba(232,67,31,0.32))',
				}}>
					🏍️
				</div>
			</div>

			{/* Brand */}
			<div style={{
				fontWeight: 900, fontSize: 22, color: '#231f20',
				letterSpacing: '0.03em', marginTop: 18,
			}}>
				Buddy Feast
			</div>
			<div style={{
				fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
				color: '#e8431f', textTransform: 'uppercase', marginTop: 4,
			}}>
				Rider App
			</div>

			{/* Cycling messages */}
			<div style={{ position: 'relative', height: 22, width: 260, marginTop: 12, overflow: 'hidden' }}>
				{MSGS.map((msg, i) => (
					<div key={i} style={{
						position: 'absolute', inset: 0,
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						fontSize: 13, fontWeight: 500, color: '#8c8487', letterSpacing: '0.02em',
						opacity: 0,
						animation: `msgCycle 9s ease-in-out ${i * 3}s infinite`,
					}}>
						{msg}
					</div>
				))}
			</div>

			{/* Animated progress bar */}
			<div style={{
				width: 210, height: 5, borderRadius: 3,
				background: 'rgba(232,67,31,0.15)', marginTop: 18, overflow: 'hidden',
			}}>
				<div style={{
					height: '100%', borderRadius: 3,
					background: 'linear-gradient(90deg, #e8431f 0%, #ffb627 100%)',
					animation: 'progBar 2.2s cubic-bezier(0.4,0,0.2,1) infinite',
				}} />
			</div>

			<style>{`
				@keyframes roadScroll {
					from { background-position: 0 0; }
					to   { background-position: -64px 0; }
				}
				@keyframes speedLine {
					0%   { opacity: 0.85; transform: translateX(0) scaleX(1); }
					100% { opacity: 0;    transform: translateX(-55px) scaleX(0.15); }
				}
				@keyframes bikeFloat {
					0%,100% { transform: rotate(-1.8deg); }
					50%     { transform: rotate(1.8deg); }
				}
				@keyframes bikeBounce {
					from { transform: translateY(0); }
					to   { transform: translateY(-6px); }
				}
				@keyframes msgCycle {
					0%   { opacity: 0; transform: translateY(10px); }
					8%   { opacity: 1; transform: translateY(0); }
					26%  { opacity: 1; transform: translateY(0); }
					33%  { opacity: 0; transform: translateY(-10px); }
					100% { opacity: 0; }
				}
				@keyframes progBar {
					0%   { width: 0%; }
					55%  { width: 72%; }
					80%  { width: 88%; }
					95%  { width: 96%; }
					100% { width: 100%; }
				}
			`}</style>
		</div>
	)
}
