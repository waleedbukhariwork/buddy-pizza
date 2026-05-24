/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	async rewrites() {
		const backendOrigin = process.env.BACKEND_URL
		return [
			{
				source: '/api/:path*',
				destination: `${backendOrigin}/api/:path*`,
			},
		]
	},
}

module.exports = nextConfig
