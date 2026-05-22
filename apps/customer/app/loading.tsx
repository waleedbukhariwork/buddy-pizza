import React from 'react'

const ORBIT = ['🍔', '🌮', '🍟', '🧁']
const WAVE = 'BUDDY FEAST'
const MSGS = [
	'Heating up the kitchen...',
	'Crafting your feast...',
	'Almost ready! 🎉',
]
const BG_DOTS = [
	{ t: 12, l: 7,  s: 12, d: 0.0, c: 'rgba(255,182,39,0.22)' },
	{ t: 20, l: 88, s: 10, d: 1.2, c: 'rgba(232,67,31,0.18)'  },
	{ t: 72, l: 5,  s: 14, d: 2.0, c: 'rgba(232,67,31,0.14)'  },
	{ t: 80, l: 90, s: 10, d: 0.7, c: 'rgba(255,182,39,0.18)' },
	{ t: 45, l: 95, s: 8,  d: 3.0, c: 'rgba(47,143,78,0.14)'  },
	{ t: 55, l: 2,  s: 9,  d: 1.5, c: 'rgba(255,182,39,0.18)' },
]

export default function Loading() {
	return (
		<div style={{
			position: 'fixed', inset: 0, zIndex: 9999,
			display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
			background: 'radial-gradient(ellipse 90% 80% at 50% 46%, #fff7ee 0%, #f2dfc0 100%)',
			overflow: 'hidden',
			fontFamily: '"Archivo","Helvetica Neue",Helvetica,Arial,sans-serif',
		}}>

			{/* Ambient background dots */}
			{BG_DOTS.map((dot, i) => (
				<div key={i} style={{
					position: 'absolute', top: `${dot.t}%`, left: `${dot.l}%`,
					width: dot.s, height: dot.s, borderRadius: '50%', background: dot.c,
					animation: `fltDot 5s ease-in-out ${dot.d}s infinite alternate`,
					pointerEvents: 'none',
				}} />
			))}

			{/* Central zone: orbit ring + plate */}
			<div style={{ position: 'relative', width: 140, height: 140 }}>

				{/* Dashed orbit track */}
				<div style={{
					position: 'absolute', width: 274, height: 274,
					top: '50%', left: '50%', marginTop: -137, marginLeft: -137,
					borderRadius: '50%',
					border: '1.5px dashed rgba(232,67,31,0.2)',
					animation: 'trackSpin 28s linear infinite',
				}} />

				{/* Orbiting food emojis */}
				{ORBIT.map((emoji, i) => (
					<div key={i} style={{
						position: 'absolute', top: '50%', left: '50%',
						width: 46, height: 46, marginTop: -23, marginLeft: -23,
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						fontSize: 26,
						animation: `orb${i} 10s linear infinite`,
						filter: 'drop-shadow(0 3px 6px rgba(35,31,32,0.2))',
					}}>
						{emoji}
					</div>
				))}

				{/* Pizza plate */}
				<div style={{
					position: 'absolute', inset: 0,
					borderRadius: '50%',
					background: 'linear-gradient(145deg, #ffffff 0%, #fff3dc 100%)',
					boxShadow: '0 0 0 4px rgba(255,182,39,0.28), 0 8px 40px rgba(232,67,31,0.24), 0 20px 50px rgba(35,31,32,0.12)',
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					zIndex: 1,
					animation: 'plateGlow 2.5s ease-in-out infinite',
				}}>
					<div style={{ fontSize: 68, animation: 'pizzaSpin 12s linear infinite', lineHeight: 1 }}>
						🍕
					</div>
					{[0, 1, 2].map(i => (
						<div key={i} style={{
							position: 'absolute', bottom: '90%', left: `${25 + i * 24}%`,
							width: 7, height: 7, borderRadius: '50%',
							background: 'rgba(255,182,39,0.6)',
							animation: `steam ${1.6 + i * 0.4}s ease-out ${i * 0.55}s infinite`,
						}} />
					))}
				</div>
			</div>

			{/* Wave brand name */}
			<div style={{ display: 'flex', gap: 0, marginTop: 28 }}>
				{WAVE.split('').map((ch, i) => (
					<span key={i} style={{
						display: 'inline-block', fontWeight: 900, fontSize: 22,
						letterSpacing: '0.04em', color: '#231f20', padding: '0 1px',
						animation: ch !== ' ' ? `letterWave 1.4s ease-in-out ${i * 0.075}s infinite` : undefined,
						minWidth: ch === ' ' ? 10 : undefined,
					}}>
						{ch === ' ' ? ' ' : ch}
					</span>
				))}
			</div>

			{/* Cycling messages */}
			<div style={{ position: 'relative', height: 22, width: 280, marginTop: 10, overflow: 'hidden' }}>
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

			{/* Bouncing dots */}
			<div style={{ display: 'flex', gap: 7, marginTop: 18 }}>
				{[0, 1, 2].map(i => (
					<div key={i} style={{
						width: 9, height: 9, borderRadius: '50%', background: '#e8431f',
						animation: `dotBounce 1s ease-in-out ${i * 0.15}s infinite`,
					}} />
				))}
			</div>

			<style>{`
				@keyframes fltDot {
					from { transform: translateY(0) scale(1); }
					to   { transform: translateY(-18px) scale(1.08); }
				}
				@keyframes trackSpin {
					from { transform: translate(-50%,-50%) rotate(0deg); }
					to   { transform: translate(-50%,-50%) rotate(360deg); }
				}
				${ORBIT.map((_, i) => `
					@keyframes orb${i} {
						from { transform: rotate(${i * 90}deg) translateY(-117px) rotate(${-(i * 90)}deg); }
						to   { transform: rotate(${i * 90 + 360}deg) translateY(-117px) rotate(${-(i * 90 + 360)}deg); }
					}
				`).join('')}
				@keyframes plateGlow {
					0%,100% {
						box-shadow: 0 0 0 4px rgba(255,182,39,0.28), 0 8px 40px rgba(232,67,31,0.24), 0 20px 50px rgba(35,31,32,0.12);
						transform: scale(1);
					}
					50% {
						box-shadow: 0 0 0 10px rgba(255,182,39,0.18), 0 8px 60px rgba(232,67,31,0.4), 0 24px 60px rgba(35,31,32,0.16);
						transform: scale(1.03);
					}
				}
				@keyframes pizzaSpin {
					from { transform: rotate(0deg); }
					to   { transform: rotate(360deg); }
				}
				@keyframes steam {
					0%   { transform: translateY(0) scale(1); opacity: 0.8; }
					60%  { transform: translateY(-20px) scale(1.3) translateX(3px); opacity: 0.4; }
					100% { transform: translateY(-38px) scale(0.2) translateX(-2px); opacity: 0; }
				}
				@keyframes letterWave {
					0%,100% { transform: translateY(0); color: #231f20; }
					50%     { transform: translateY(-7px); color: #e8431f; }
				}
				@keyframes msgCycle {
					0%   { opacity: 0; transform: translateY(10px); }
					8%   { opacity: 1; transform: translateY(0); }
					26%  { opacity: 1; transform: translateY(0); }
					33%  { opacity: 0; transform: translateY(-10px); }
					100% { opacity: 0; }
				}
				@keyframes dotBounce {
					0%,100% { transform: translateY(0); background: #e8431f; }
					50%     { transform: translateY(-9px); background: #ffb627; }
				}
			`}</style>
		</div>
	)
}
