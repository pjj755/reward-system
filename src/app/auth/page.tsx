'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

export default function AuthPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) router.push('/')
  }, [session, router])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn('email', { email, redirect: false })
      if (result?.error) {
        setError('Something went wrong. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMetaMaskSignIn = async () => {
    if (!window.ethereum?.isMetaMask) {
      setError('MetaMask not detected. Please install the MetaMask extension.')
      return
    }
    setWalletLoading(true)
    setError('')
    try {
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const address = accounts[0]
      const message = `Sign in to Moonshot Rewards\n\nWallet: ${address}\nTimestamp: ${Date.now()}\n\nThis won't trigger a transaction or cost gas.`
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      })
      const result = await signIn('metamask', { address, signature, message, redirect: false })
      if (result?.error) {
        setError('MetaMask sign-in failed. Please try again.')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      if (err?.code === 4001) {
        setError('Signature request was rejected.')
      } else {
        setError('MetaMask connection failed.')
      }
    } finally {
      setWalletLoading(false)
    }
  }

  const hasGoogle = process.env.NEXT_PUBLIC_HAS_GOOGLE === 'true'
  const hasGithub = process.env.NEXT_PUBLIC_HAS_GITHUB === 'true'
  const hasEmail = process.env.NEXT_PUBLIC_HAS_EMAIL === 'true'

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 animate-float inline-block">🌙</div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Sign in to Moonshot</h1>
          <p className="text-white/40 text-sm">Start earning rewards today</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-aurora-500/20 to-nova-500/20 border border-aurora-400/30 rounded-full px-4 py-1.5 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
            <span className="text-lg">🎁</span>
            <span className="text-sm font-semibold text-white">New users get <span className="text-aurora-400">100 points</span> free</span>
          </div>
        </div>

        {sent ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="font-display text-xl font-bold mb-2 text-aurora-400">Check your inbox</h3>
            <p className="text-white/50 text-sm mb-1">
              We sent a magic link to
            </p>
            <p className="text-white font-medium text-sm mb-6">{email}</p>
            <button onClick={() => setSent(false)} className="text-sm text-nova-400 hover:text-nova-300 transition-colors">
              Use a different email →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Google */}
            {hasGoogle && (
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/8 border border-white/12 text-white font-medium text-sm hover:bg-white/14 hover:border-white/20 transition-all backdrop-blur-sm"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            )}

            {/* GitHub */}
            {hasGithub && (
              <button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#24292e] text-white font-medium text-sm hover:bg-[#2f363d] transition-all border border-white/10"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Sign in with GitHub
              </button>
            )}

            {/* MetaMask */}
            <button
              onClick={handleMetaMaskSignIn}
              disabled={walletLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/8 border border-white/12 text-white font-medium text-sm hover:bg-white/14 hover:border-[#f6851b]/40 transition-all backdrop-blur-sm disabled:opacity-50"
            >
              {walletLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 318 318" fill="none" className="flex-shrink-0">
                  <path d="M274.1 35.5L174.6 109.4l19-44.9 80.5-29z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M43.8 35.5l98.6 74.6-18.1-45.7-80.5-28.9zM238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3-46.5-.9zM33.4 207.7l16.2 55.3 56.7-15.6-26.5-40.6-46.4.9z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M103.6 138.2L87.8 162.1l56.3 2.5-2-60.5-38.5 34.1zM214.3 138.2l-39-34.8-1.3 61.2 56.2-2.5-16-23.9zM106.3 247.4l33.8-16.5-29.2-22.8-4.6 39.3zM177.9 230.9l33.9 16.5-4.7-39.3-29.2 22.8z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3 31.5-14.9zM106.3 247.4l31.5 14.9-.2-9.3 2.5-22.1-33.8 16.5z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M138.2 197.6l-28.2-8.3 19.9-9.1 8.3 17.4zM179.7 197.6l8.3-17.4 20 9.1-28.3 8.3z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M106.3 247.4l4.8-40.6-31.3.9 26.5 39.7zM207 206.8l4.8 40.6 26.5-39.7-31.3-.9zM230.6 162.1l-56.2 2.5 5.2 28.8 8.3-17.4 20 9.1 22.7-23zM110 189.3l20-9.1 8.2 17.4 5.3-28.8-56.3-2.5 22.8 23z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M87.8 162.1l23.6 46-.8-23-22.8-23zM207.3 185.1l-1 23 23.7-46-22.7 23zM144.1 164.6l-5.3 28.8 6.6 34.1 1.5-44.9-2.8-18zM174 164.6l-2.7 18 1.3 45 6.7-34.1-5.3-28.9z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M179.7 197.6l-6.7 34.1 4.9 3.2 29.2-22.8 1-23-28.4 8.5zM110 189.3l.8 23 29.2 22.8 4.9-3.2-6.6-34.1-28.3-8.5z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M180 262.3l.3-9.3-2.5-2.2h-37.6l-2.4 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9-31.5 14.9z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M177.9 230.9l-4.9-3.2h-28.1l-4.9 3.2-2.5 22.1 2.4-2.2h37.6l2.5 2.2-2.1-22.1z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M278.3 114.2l8.5-41.1-12.8-37.6-98.1 72.9 37.7 31.9 53.3 15.6 11.8-13.8-5.1-3.7 8.1-7.4-6.3-4.9 8.1-6.2-5.2-5.7zM31.2 73.1l8.5 41.1-5.4 4 8.2 6.2-6.2 4.9 8.1 7.4-5.1 3.7 11.7 13.8 53.3-15.6 37.7-31.9-98.8-73.6z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M267 155l-53.3-15.6 16 23.9-23.7 46 31.3-.9h46.5L267 155zM104.3 139.4L51 155l-16.2 53.5h46.4l31.2.9-23.6-46 15.5-23.9zM174.2 166.7l3.4-58.9 15.4-41.8h-68.6l15.2 41.8 3.6 58.9 1.2 18.2.1 44.8h28.1l.2-44.8 1.4-18.2z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {walletLoading ? 'Connecting...' : 'Sign in with MetaMask'}
            </button>

            {/* Divider + Email Form */}
            {hasEmail && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs text-white/30">
                    <span className="bg-space-950 px-3">or</span>
                  </div>
                </div>

                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input w-full"
                    required
                    disabled={loading}
                  />
                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-white disabled:opacity-50" disabled={loading || !email.trim()}>
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {loading ? 'Sending...' : 'Sign in with Email'}
                  </button>
                </form>
              </>
            )}
            {error && !hasEmail && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <p className="text-center text-xs text-white/20 pt-1">
              By signing in, you agree to our Terms of Service.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
