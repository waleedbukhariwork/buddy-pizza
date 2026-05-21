'use client'
import React from 'react'
import Link from 'next/link'

// ─── Logo ────────────────────────────────────────────────────────────────────
function Logo({ size = 20, mono = false }: { size?: number; mono?: boolean }) {
	return (
		<Link href='/' className='bf-logo' style={{ fontSize: size, color: mono ? '#fff' : undefined }}>
			<span className='bf-logo-dot' style={mono ? { background: '#fff' } : undefined} />
			Buddy Feast
			<small style={{ fontSize: '0.5em', fontFamily: 'var(--bf-mono)', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: mono ? 'rgba(255,255,255,.6)' : 'var(--bf-ink-2)', marginLeft: 4 }}>EST. 2024</small>
		</Link>
	)
}

export { Logo }
