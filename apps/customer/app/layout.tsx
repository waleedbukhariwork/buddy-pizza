import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '../components/providers/app-providers'
import { ErrorBoundary } from '../components/ui/error-boundary'

export const metadata: Metadata = {
	title: 'Buddy Feast - Order Online',
	description:
		'Fast and delicious food delivery. Order pizza, burgers, and more.',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='en'>
			<head>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
				<link href='https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800;900&display=swap' rel='stylesheet' />
			</head>
			<body className='antialiased'>
				<ErrorBoundary>
					<AppProviders>{children}</AppProviders>
				</ErrorBoundary>
			</body>
		</html>
	)
}
