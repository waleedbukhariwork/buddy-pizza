#!/usr/bin/env node
/**
 * Buddy Feast — Menu Seed Script (v2)
 *
 * Cleans all existing products, then seeds the full menu using the latest
 * product structure: sizesJson, per-size labels, discount fields.
 *
 * Usage:
 *   node scripts/seed-menu.js
 *
 *   ADMIN_EMAIL=admin@buddyfeast.com ADMIN_PASSWORD=yourpassword node scripts/seed-menu.js
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
	// apiBase: process.env.API_URL ?? 'http://localhost:8080/api',
	apiBase: 'https://buddy-feast-api.onrender.com/api',
	email: process.env.ADMIN_EMAIL ?? 'devAdmin@buddyfeast.com',
	password: process.env.ADMIN_PASSWORD ?? 'admin123',
}

// ─── HTTP HELPERS ─────────────────────────────────────────────────────────────
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
	const text = await res.text()
	if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
	if (!text) return null
	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

async function login() {
	const data = await api('POST', '/v1/auth/admin/login', {
		phoneOrEmail: CONFIG.email,
		password: CONFIG.password,
	})

	console.log({ data })
	token = data.token
	console.log('✅  Logged in as admin')
}

// ─── PRODUCT BUILDER HELPERS ──────────────────────────────────────────────────

/**
 * sized(name, sizes, opts)
 * sizes: Array of { name: string, price: number }
 *   e.g. [{ name: 'Small (6")', price: 330 }, { name: 'Medium (9")', price: 650 }]
 */
function sized(
	name,
	sizes,
	{
		isHot = false,
		description = '',
		discountPct = null,
		discountAmount = null,
	} = {},
) {
	if (!sizes || sizes.length === 0)
		throw new Error(`sized(): no sizes provided for "${name}"`)
	const sorted = [...sizes].sort((a, b) => a.price - b.price)
	return {
		name,
		description: description || null,
		hasSizes: true,
		price: sorted[0].price,
		// Legacy compat fields (first 3)
		priceSmall: sorted[0]?.price ?? null,
		priceMedium: sorted[1]?.price ?? null,
		priceLarge: sorted[2]?.price ?? null,
		labelSmall: sorted[0]?.name ?? null,
		labelMedium: sorted[1]?.name ?? null,
		labelLarge: sorted[2]?.name ?? null,
		// Full list for unlimited-size support
		sizesJson: JSON.stringify(sorted),
		isHot,
		isAvailable: true,
		discountPct,
		discountAmount,
	}
}

/**
 * single(name, price, opts)
 * Simple product with one price.
 */
function single(
	name,
	price,
	{
		isHot = false,
		description = '',
		discountPct = null,
		discountAmount = null,
	} = {},
) {
	return {
		name,
		description: description || null,
		hasSizes: false,
		price,
		priceSmall: null,
		priceMedium: null,
		priceLarge: null,
		labelSmall: null,
		labelMedium: null,
		labelLarge: null,
		sizesJson: null,
		isHot,
		isAvailable: true,
		discountPct,
		discountAmount,
	}
}

// Convenience wrappers for common patterns ─────────────────────────────────

/** Regular pizza with Small (6") / Medium (9") / Large (12") */
function pizza(name, s, m, l, isHot = false) {
	return sized(
		name,
		[
			{ name: 'Small (6")', price: s },
			{ name: 'Medium (9")', price: m },
			{ name: 'Large (12")', price: l },
		],
		{ isHot },
	)
}

/** Pizza available in Medium (9") and Large (12") only */
function pizzaML(name, m, l, isHot = false) {
	return sized(
		name,
		[
			{ name: 'Medium (9")', price: m },
			{ name: 'Large (12")', price: l },
		],
		{ isHot, description: 'Available in Medium (9") and Large (12")' },
	)
}

/** Half / Full item (pasta, wings, Turkish doner) */
function halfFull(name, half, full, description = '') {
	return sized(
		name,
		[
			{ name: 'Half', price: half },
			{ name: 'Full', price: full },
		],
		{ description },
	)
}

// ─── MENU DATA ────────────────────────────────────────────────────────────────
const MENU = [
	// ── 1. PIZZAS ──────────────────────────────────────────────────────────────
	{
		category: 'Pizzas',
		displayOrder: 1,
		products: [
			// ─ Regular Pizzas: Small (6") / Medium (9") / Large (12")
			pizza('Chicken Tikka', 330, 650, 930, true),
			pizza('Chicken Fajita', 330, 650, 930),
			pizza('Chicken Tandoori', 330, 650, 930),
			pizza('Chicken Sicilian', 330, 650, 930),

			// ─ Special Pizzas: Medium (9") / Large (12") only
			pizzaML('Feast Special', 799, 1099, true),
			pizzaML('Behari Seekh Kabab', 799, 1099, true),
			pizzaML('Chunky Cheese Kabab', 799, 999),
			pizzaML('Malai Boti', 749, 999),
			pizzaML('Hot & Spicy', 749, 999, true),
			pizzaML('Bonfire', 749, 999),
			pizzaML('Peri Peri', 749, 999),
			pizzaML('Shahi', 749, 999),
			pizzaML('Supreme', 749, 999),

			// ─ Extreme / Crown Crust: Medium (9") / Large (12") only
			pizzaML('Makhni Kabab (Crown Crust)', 899, 1199),
			pizzaML('Seekh Kabab (Crown Crust)', 899, 1199),
			pizzaML('Cheese Crust', 899, 1199),
			pizzaML('Crown Crust', 899, 1199),
		],
	},

	// ── 2. BURGERS ─────────────────────────────────────────────────────────────
	{
		category: 'Burgers',
		displayOrder: 2,
		products: [
			// Grilled
			single('Steak Jalapeno Burger', 449, { isHot: true }),
			single('Steak & Cheese Burger', 449),
			// Fried
			single('Feast Special Zinger Burger', 299, { isHot: true }),
			single('Chicken Petty Burger', 199),
			single('Classic Zinger Burger', 249),
			single('Chipotle Jalapeno Burger', 349),
			single('Double Dose Burger', 399),
			single('Monster Burger', 480, { isHot: true }),
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
			halfFull('Grilled Wings', 170, 320),
			halfFull('Flaming Wings', 200, 380, 'Spicy'),
			halfFull('B.B.Q Wings', 200, 380),
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
			halfFull('Flaming Pasta', 260, 480, 'Spicy'),
			halfFull('Buddy Feast Pasta', 280, 499),
			halfFull('Crispy Pasta', 320, 599),
		],
	},

	// ── 7. TURKISH FOOD ────────────────────────────────────────────────────────
	{
		category: 'Turkish Food',
		displayOrder: 7,
		products: [
			halfFull('Classic Turkish Doner', 399, 749),
			halfFull('Premium Turkish Doner', 460, 799),
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

// ─── CLEAN ────────────────────────────────────────────────────────────────────
async function deleteAllProducts() {
	console.log('\n🗑   Fetching existing products…')
	const products = await api('GET', '/v1/products')
	if (!Array.isArray(products) || products.length === 0) {
		console.log('    No products to delete.')
		return
	}
	console.log(`    Found ${products.length} product(s) — deleting…`)
	let deleted = 0
	for (const p of products) {
		try {
			await api('DELETE', `/v1/admin/products/${p.id}`)
			deleted++
		} catch (err) {
			console.error(
				`    ⚠  Could not delete product ${p.id} (${p.name}): ${err.message}`,
			)
		}
	}
	console.log(`    ✅  Deleted ${deleted} product(s)`)
}

async function getExistingCategories() {
	const cats = await api('GET', '/v1/admin/categories')
	const map = {}
	for (const c of cats ?? []) map[c.name.toLowerCase()] = c
	return map
}

// ─── SEED ─────────────────────────────────────────────────────────────────────
async function main() {
	console.log('\n🚀  Buddy Feast — Menu Seed Script v2')
	console.log(`    API : ${CONFIG.apiBase}`)
	console.log(`    User: ${CONFIG.email}\n`)

	await login()

	// 1. Clean all products
	// await deleteAllProducts()

	// 2. Resolve categories (reuse existing by name, create if missing)
	console.log('\n📁  Resolving categories…')
	const existingCats = await getExistingCategories()
	const catIdByName = {}

	for (const section of MENU) {
		const key = section.category.toLowerCase()
		if (existingCats[key]) {
			catIdByName[section.category] = existingCats[key].id
			console.log(
				`    ♻  Reused  "${section.category}" (id=${existingCats[key].id})`,
			)
		} else {
			try {
				const cat = await api('POST', '/v1/admin/categories', {
					name: section.category,
					displayOrder: section.displayOrder,
					isActive: true,
				})
				catIdByName[section.category] = cat.id
				console.log(`    ✨ Created "${section.category}" (id=${cat.id})`)
			} catch (err) {
				console.error(
					`    ❌  Failed to create category "${section.category}": ${err.message}`,
				)
			}
		}
	}

	// 3. Seed products
	console.log('\n🍕  Seeding products…')
	let totalProducts = 0
	const errors = []

	for (const section of MENU) {
		const catId = catIdByName[section.category]
		if (!catId) {
			console.error(
				`\n   ⚠  Skipping "${section.category}" — no category ID resolved`,
			)
			continue
		}

		console.log(`\n   📂  ${section.category}`)

		for (const product of section.products) {
			try {
				await api('POST', '/v1/admin/products', {
					...product,
					categoryId: catId,
				})

				// Nice price display
				let priceStr
				if (product.hasSizes && product.sizesJson) {
					const sizes = JSON.parse(product.sizesJson)
					const min = sizes[0]
					const max = sizes[sizes.length - 1]
					priceStr =
						sizes.length > 1
							? `Rs.${min.price} – Rs.${max.price}  (${sizes.map((s) => s.name).join(' / ')})`
							: `Rs.${min.price}  (${min.name})`
				} else {
					priceStr = `Rs.${product.price}`
				}
				console.log(`      ✅  ${product.name.padEnd(36)} ${priceStr}`)
				totalProducts++
			} catch (err) {
				console.error(`      ❌  ${product.name} — ${err.message}`)
				errors.push(`${section.category} › ${product.name}: ${err.message}`)
			}
		}
	}

	// ─── Summary ───────────────────────────────────────────────────────────────
	console.log('\n══════════════════════════════════════════════════')
	console.log(`🎉  Done!`)
	console.log(`    Categories : ${Object.keys(catIdByName).length}`)
	console.log(`    Products   : ${totalProducts}`)

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
