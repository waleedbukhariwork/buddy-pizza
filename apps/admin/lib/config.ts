function assert(value: string | undefined, name: string): string {
	if (!value) throw new Error(`Missing required environment variable: ${name}`)
	return value
}

const config = {
	apiUrl: assert(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL'),
} as const

export default config
