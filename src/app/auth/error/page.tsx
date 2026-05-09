'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthErrorPage() {
  const params = useSearchParams()
  const error = params.get('error')
  const messages: Record<string, string> = {
    Configuration: 'Server configuration error. Please contact support.',
    AccessDenied: 'Access denied.',
    Verification: 'The sign-in link expired or has already been used.',
    Default: 'An authentication error occurred.',
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="font-display text-3xl font-bold text-red-400 mb-3">Auth Error</h1>
        <p className="text-white/60 mb-6">{messages[error ?? 'Default'] ?? messages.Default}</p>
        <Link href="/auth" className="btn-primary inline-block">Try Again</Link>
      </div>
    </div>
  )
}
