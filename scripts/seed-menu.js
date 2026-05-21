#!/usr/bin/env node
/**
 * Buddy Feast — Full Menu Seed Script
 *
 * Usage:
 *   ADMIN_EMAIL=admin@buddyfeast.com ADMIN_PASSWORD=yourpassword node scripts/seed-menu.js
 *
 * Or edit the CONFIG block below and run:
 *   node scripts/seed-menu.js
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
	apiBase: process.env.API_URL ?? 'http://localhost:8080/api',
	email: process.env.ADMIN_EMAIL ?? 'admin@buddyfeast.com',
	password: process.env.ADMIN_PASSWORD ?? 'admin123',
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
let token = ''

async function api(method, path, body) {
	const res = await fetch(`${CONFIG.apiBase}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	})
	if (!res.ok) {
		const text = await res.text()
		throw new Error(`${method} ${path} → ${res.status}: ${text}`)
	}
	return res.json()
}

async function login() {
	const data = await api('POST', '/v1/auth/admin/login', {
		phoneOrEmail: CONFIG.email,
		password: CONFIG.password,
	})
	token = data.token
	console.log('✅  Logged in as admin')
}

async function createCategory(name, displayOrder) {
	const cat = await api('POST', '/v1/admin/categories', {
		name,
		displayOrder,
		isActive: true,
	})
	console.log(`   📁 Category: ${name} (id=${cat.id})`)
	return cat
}

async function createProduct(product) {
	const p = await api('POST', '/v1/admin/products', product)
	const priceLabel = product.hasSizes
		? `From Rs.${product.priceSmall}`
		: `Rs.${product.price}`
	console.log(`      🍕 ${product.name} — ${priceLabel}`)
	return p
}

// ─── MENU DATA ────────────────────────────────────────────────────────────────

/**
 * pizza(name, s, m, l)      → Regular pizza with S/M/L sizes
 * pizza2(name, m, l)        → Special/Extreme pizza with M/L only (stored as priceSmall=M, priceMedium=L)
 * single(name, price, hot)  → Single-price item
 * halffull(name, h, f)      → Half/Full item (wings, pasta, Turkish doner)
 */

function pizza(name, s, m, l, isHot = false) {
	return {
		name,
		hasSizes: true,
		price: s,
		priceSmall: s,
		priceMedium: m,
		priceLarge: l,
		isHot,
		isAvailable: true,
	}
}

function pizza2(name, m, l, isHot = false) {
	// M = priceSmall, L = priceMedium  (no Small/6" size)
	return {
		name,
		description: 'Available in Medium (9") and Large (12")',
		hasSizes: true,
		price: m,
		priceSmall: m,
		priceMedium: l,
		priceLarge: null,
		isHot,
		isAvailable: true,
	}
}

function single(name, price, isHot = false, description = '') {
	return {
		name,
		description,
		price,
		hasSizes: false,
		priceSmall: null,
		priceMedium: null,
		priceLarge: null,
		isHot,
		isAvailable: true,
	}
}

function halffull(name, half, full, description = '') {
	return {
		name,
		description,
		hasSizes: true,
		price: half,
		priceSmall: half,
		priceMedium: full,
		priceLarge: null,
		isHot: false,
		isAvailable: true,
	}
}

const MENU = [
	// ── 1. PIZZAS ──────────────────────────────────────────────────────────────
	{
		category: 'Pizzas',
		displayOrder: 1,
		products: [
			// Regular Pizzas (S 6" / M 9" / L 12")
			pizza('Chicken Tikka', 330, 650, 930, true),
			pizza('Chicken Fajita', 330, 650, 930),
			pizza('Chicken Tandoori', 330, 650, 930),
			pizza('Chicken Sicilian', 330, 650, 930),

			// Special Pizzas (M / L only)
			pizza2('Feast Special', 799, 1099, true),
			pizza2('Behari Seekh Kabab', 799, 1099, true),
			pizza2('Chunky Cheese Kabab', 799, 999),
			pizza2('Malai Boti', 749, 999),
			pizza2('Hot & Spicy', 749, 999, true),
			pizza2('Bonfire', 749, 999),
			pizza2('Peri Peri', 749, 999),
			pizza2('Shahi', 749, 999),
			pizza2('Supreme', 749, 999),

			// Extreme Crust (M / L only)
			pizza2('Makhni Kabab (Crown Crust)', 899, 1199),
			pizza2('Seekh Kabab (Crown Crust)', 899, 1199),
			pizza2('Cheese Crust', 899, 1199),
			pizza2('Crown Crust', 899, 1199),
		],
	},

	// ── 2. BURGERS ─────────────────────────────────────────────────────────────
	{
		category: 'Burgers',
		displayOrder: 2,
		products: [
			// Grilled
			single('Steak Jalapeno Burger', 449, true),
			single('Steak & Cheese Burger', 449),
			// Fried
			single('Feast Special Zinger Burger', 299, true),
			single('Chicken Petty Burger', 199),
			single('Classic Zinger Burger', 249),
			single('Chipotle Jalapeno Burger', 349),
			single('Double Dose Burger', 399),
			single('Monster Burger', 480, true),
		],
	},

	// ── 3. PARATHA ROLLS ───────────────────────────────────────────────────────
	{
		category: 'Paratha Rolls',
		displayOrder: 3,
		products: [
			single('Feast Special Paratha Roll', 300),
			single('Tikka Paratha Roll', 199),
			single('Loaded Paratha Roll', 259),
			single('Zinger Paratha Roll', 250),
			single('Tikka Cheese Paratha Roll', 250),
			single('Behari Kabab Paratha Roll', 250),
		],
	},

	// ── 4. WINGS ───────────────────────────────────────────────────────────────
	{
		category: 'Wings',
		displayOrder: 4,
		products: [
			halffull('Grilled Wings', 170, 320),
			halffull('Flaming Wings', 200, 380, 'Spicy'),
			halffull('B.B.Q Wings', 200, 380),
		],
	},

	// ── 5. FRIES ───────────────────────────────────────────────────────────────
	{
		category: 'Fries',
		displayOrder: 5,
		products: [
			single('Plain Fries', 170),
			single('Masala Fries', 199),
			single('Jalapeno Fries', 240),
			single('Loaded Fries', 299),
			single('Crispy Loaded Fries', 350),
			single('Pizza Fries', 380),
		],
	},

	// ── 6. PASTA ───────────────────────────────────────────────────────────────
	{
		category: 'Pasta',
		displayOrder: 6,
		products: [
			halffull('Flaming Pasta', 260, 480, 'Spicy'),
			halffull('Buddy Feast Pasta', 280, 499),
			halffull('Crispy Pasta', 320, 599),
		],
	},

	// ── 7. TURKISH FOOD ────────────────────────────────────────────────────────
	{
		category: 'Turkish Food',
		displayOrder: 7,
		products: [
			halffull('Classic Turkish Doner', 399, 749),
			halffull('Premium Turkish Doner', 460, 799),
		],
	},

	// ── 8. SHAWARMA ────────────────────────────────────────────────────────────
	{
		category: 'Shawarma',
		displayOrder: 8,
		products: [
			single('Tikka Shawarma', 180),
			single('Zinger Shawarma', 230),
			single('Feast Shawarma', 230),
		],
	},

	// ── 9. APPETIZERS ──────────────────────────────────────────────────────────
	{
		category: 'Appetizers',
		displayOrder: 9,
		products: [
			single('Nuggets (5 Pcs)', 199),
			single('Boneless Thigh', 199),
			single('Crispy Bites (8 Pcs)', 330),
			single('Saucy Bites (8 Pcs)', 380),
		],
	},

	// ── 10. SOFT DRINKS ────────────────────────────────────────────────────────
	{
		category: 'Soft Drinks',
		displayOrder: 10,
		products: [
			single('Cold Drink (500ml)', 80),
			single('Cold Drink (1 Ltr)', 110),
			single('Buddy Pack (1.5 Ltr)', 140),
			single('Cold Drink (1.5 Ltr)', 170),
		],
	},
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
	console.log('\n🚀  Buddy Feast — Menu Seed Script')
	console.log(`    API: ${CONFIG.apiBase}\n`)

	await login()

	let totalCategories = 0
	let totalProducts = 0
	const errors = []

	for (const section of MENU) {
		console.log(`\n📂  ${section.category}`)
		let catId

		try {
			const cat = await createCategory(section.category, section.displayOrder)
			catId = cat.id
			totalCategories++
		} catch (err) {
			console.error(
				`   ❌  Failed to create category "${section.category}": ${err.message}`,
			)
			errors.push(`Category: ${section.category} — ${err.message}`)
			continue
		}

		for (const product of section.products) {
			try {
				await createProduct({ ...product, categoryId: catId })
				totalProducts++
			} catch (err) {
				console.error(`   ❌  Failed: ${product.name} — ${err.message}`)
				errors.push(`Product: ${product.name} — ${err.message}`)
			}
		}
	}

	console.log('\n─────────────────────────────────────────')
	console.log(
		`✅  Done!  ${totalCategories} categories · ${totalProducts} products seeded`,
	)

	if (errors.length > 0) {
		console.log(`\n⚠️   ${errors.length} error(s):`)
		errors.forEach((e) => console.log(`    • ${e}`))
	}

	console.log('')
}

main().catch((err) => {
	console.error('\n💥  Fatal error:', err.message)
	process.exit(1)
})
