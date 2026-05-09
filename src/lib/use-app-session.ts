'use client'
import { useSession } from 'next-auth/react'

const DEV_SESSION = {
  data: { user: { id: 'dev-user-001', email: 'dev@local.dev', name: 'Dev User' } },
  status: 'authenticated' as const,
  update: async () => null,
}

export function useAppSession() {
  const real = useSession()
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') return DEV_SESSION
  return real
}
