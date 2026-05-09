'use client'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

const DEV_SESSION: Session | undefined =
  process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'
    ? {
        user: { id: 'dev-user-001', email: 'dev@local.dev', name: 'Dev User' },
        expires: new Date(Date.now() + 86400_000).toISOString(),
      }
    : undefined

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider session={DEV_SESSION}>{children}</SessionProvider>
}
