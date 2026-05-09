import { authOptions } from '@/lib/auth'
import AuthClient from './AuthClient'

export default function AuthPage() {
  const providerIds = authOptions.providers.map(p => p.id)
  const hasGoogle = providerIds.includes('google')
  const hasGithub = providerIds.includes('github')
  const hasEmail = providerIds.includes('email')

  return (
    <AuthClient
      hasGoogle={hasGoogle}
      hasGithub={hasGithub}
      hasEmail={hasEmail}
    />
  )
}
