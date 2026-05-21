import { Suspense } from 'react'
import { AuthSignIn } from '../../../components/views/auth'

export default function LoginPage() {
	return (
		<Suspense>
			<AuthSignIn />
		</Suspense>
	)
}
