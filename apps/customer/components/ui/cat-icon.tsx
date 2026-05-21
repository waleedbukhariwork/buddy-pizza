'use client'
import React from 'react'

const COLORS: Record<string, string> = {
	// Pizzas
	pizza:    '#E8431F',
	pizzas:   '#E8431F',
	// Burgers
	burger:   '#FFB627',
	burgers:  '#FFB627',
	// Rolls / Paratha
	roll:     '#E8431F',
	rolls:    '#E8431F',
	paratha:  '#E8431F',
	'paratha rolls': '#E8431F',
	// Wings
	wing:     '#FF6B35',
	wings:    '#FF6B35',
	// Fries
	fries:    '#FFB627',
	frie:     '#FFB627',
	// Pasta
	pasta:    '#8B5CF6',
	// Turkish
	turkish:  '#2F8F4E',
	doner:    '#2F8F4E',
	'turkish food': '#2F8F4E',
	// Shawarma
	shawarma: '#E8431F',
	// Appetizers / Starters
	appetizer:  '#231F20',
	appetizers: '#231F20',
	starter:    '#231F20',
	starters:   '#231F20',
	nuggets:    '#231F20',
	// Drinks / Soft Drinks
	drink:      '#3B82F6',
	drinks:     '#3B82F6',
	'soft drinks': '#3B82F6',
	beverages:  '#3B82F6',
	// Deals / Combos
	deal:    '#E8431F',
	deals:   '#E8431F',
	combo:   '#E8431F',
	combos:  '#E8431F',
	// Sides
	side:  '#2F8F4E',
	sides: '#2F8F4E',
}

function CatIcon({ name, size = 22 }: { name: string; size?: number }) {
	const key = name.toLowerCase().trim()
	const c = COLORS[key] ?? '#E8431F'

	// Pizza
	if (key.includes('pizza')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<circle cx='12' cy='12' r='9' fill={c} opacity='.15' />
			<path d='M12 3 L4.5 18.5 a9 9 0 0 0 15 0 Z' fill='none' stroke={c} strokeWidth='2' strokeLinejoin='round' />
			<circle cx='9' cy='10' r='1.4' fill={c} />
			<circle cx='14' cy='13' r='1.4' fill={c} />
			<circle cx='11' cy='15.5' r='1.4' fill={c} />
		</svg>
	)

	// Burger
	if (key.includes('burger')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<path d='M4 9a8 8 0 0 1 16 0z' fill={c} opacity='.9' />
			<rect x='3' y='10.5' width='18' height='2.5' rx='1' fill='#E8431F' />
			<path d='M4 15h16' stroke={c} strokeWidth='2' strokeLinecap='round' />
			<path d='M5 18h14' stroke={c} strokeWidth='2.5' strokeLinecap='round' />
		</svg>
	)

	// Paratha Roll / Roll
	if (key.includes('roll') || key.includes('paratha')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<ellipse cx='12' cy='12' rx='5' ry='9' fill={c} opacity='.15' stroke={c} strokeWidth='1.8' />
			<path d='M8 8 Q12 10 16 8' stroke={c} strokeWidth='1.5' fill='none' strokeLinecap='round' />
			<path d='M8 12 Q12 14 16 12' stroke={c} strokeWidth='1.5' fill='none' strokeLinecap='round' />
			<path d='M9 16 Q12 17.5 15 16' stroke={c} strokeWidth='1.5' fill='none' strokeLinecap='round' />
		</svg>
	)

	// Wings
	if (key.includes('wing')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<path d='M4 14 C4 8 10 5 16 7 C20 8 21 12 18 15 C15 18 9 18 6 16 Z' fill={c} opacity='.2' stroke={c} strokeWidth='1.8' strokeLinejoin='round' />
			<path d='M8 8 C10 6 14 6 17 9' stroke={c} strokeWidth='1.6' fill='none' strokeLinecap='round' />
			<path d='M6 11 C7 9 11 8 15 10' stroke={c} strokeWidth='1.3' fill='none' strokeLinecap='round' />
		</svg>
	)

	// Fries
	if (key.includes('fries') || key.includes('frie')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<rect x='5' y='11' width='14' height='2.5' rx='1' fill='#E8431F' />
			<path d='M7 4v9M10 3v9M13 3v9M16 4v9' stroke={c} strokeWidth='2.2' strokeLinecap='round' />
			<path d='M6 13l-1 8h14l-1-8' fill={c} opacity='.2' />
		</svg>
	)

	// Pasta
	if (key.includes('pasta')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<path d='M4 8 Q8 5 12 8 Q16 11 20 8' stroke={c} strokeWidth='2' fill='none' strokeLinecap='round' />
			<path d='M4 12 Q8 9 12 12 Q16 15 20 12' stroke={c} strokeWidth='2' fill='none' strokeLinecap='round' />
			<path d='M4 16 Q8 13 12 16 Q16 19 20 16' stroke={c} strokeWidth='2' fill='none' strokeLinecap='round' />
			<circle cx='12' cy='12' r='9' fill='none' stroke={c} strokeWidth='1.2' opacity='.3' />
		</svg>
	)

	// Turkish / Doner
	if (key.includes('turkish') || key.includes('doner')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<ellipse cx='12' cy='12' rx='4' ry='9' fill={c} opacity='.2' stroke={c} strokeWidth='1.8' />
			<path d='M8 7h8M7 10h10M7 14h10M8 17h8' stroke={c} strokeWidth='1.6' strokeLinecap='round' />
			<path d='M5 19 Q12 22 19 19' stroke={c} strokeWidth='2' fill='none' strokeLinecap='round' />
		</svg>
	)

	// Shawarma
	if (key.includes('shawarma')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<path d='M7 5 Q12 3 17 5 L18 19 Q12 21 6 19 Z' fill={c} opacity='.18' stroke={c} strokeWidth='1.8' />
			<path d='M8 9h8M8 12h8M8 15h6' stroke={c} strokeWidth='1.6' strokeLinecap='round' />
		</svg>
	)

	// Appetizers / Starters
	if (key.includes('appetizer') || key.includes('starter') || key.includes('nugget')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<rect x='4' y='13' width='16' height='6' rx='3' fill={c} opacity='.2' stroke={c} strokeWidth='1.8' />
			<circle cx='8' cy='10' r='2.8' fill={c} opacity='.3' stroke={c} strokeWidth='1.5' />
			<circle cx='14' cy='9' r='2.2' fill={c} opacity='.3' stroke={c} strokeWidth='1.5' />
			<circle cx='19' cy='11' r='1.8' fill={c} opacity='.3' stroke={c} strokeWidth='1.5' />
		</svg>
	)

	// Soft Drinks / Beverages
	if (key.includes('drink') || key.includes('beverage') || key.includes('soft')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<path d='M7 4h10l-1.5 16H8.5z' fill={c} opacity='.2' stroke={c} strokeWidth='1.8' strokeLinejoin='round' />
			<path d='M9 8h6' stroke={c} strokeWidth='1.8' strokeLinecap='round' />
			<circle cx='12' cy='12' r='1.5' fill={c} opacity='.6' />
		</svg>
	)

	// Deals / Combos
	if (key.includes('deal') || key.includes('combo')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<rect x='3' y='5' width='10' height='13' rx='1.5' fill={c} opacity='.2' stroke={c} strokeWidth='1.8' />
			<rect x='14' y='8' width='7' height='10' rx='1.5' fill='#FFB627' opacity='.6' stroke='#FFB627' strokeWidth='1.5' />
			<circle cx='8' cy='10' r='1.2' fill={c} />
		</svg>
	)

	// Sides
	if (key.includes('side')) return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<circle cx='12' cy='12' r='8' fill={c} opacity='.18' stroke={c} strokeWidth='1.6' />
			<circle cx='9' cy='10' r='1.2' fill={c} />
			<circle cx='15' cy='11' r='1.2' fill={c} />
			<circle cx='12' cy='14.5' r='1.2' fill={c} />
		</svg>
	)

	// Generic fallback
	return (
		<svg width={size} height={size} viewBox='0 0 24 24'>
			<circle cx='12' cy='12' r='9' fill={c} opacity='.15' />
			<circle cx='12' cy='12' r='4' fill={c} opacity='.45' />
		</svg>
	)
}

export { CatIcon }
