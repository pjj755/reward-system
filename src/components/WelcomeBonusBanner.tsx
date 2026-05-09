'use client'

import { useState } from 'react'

export default function WelcomeBonusBanner({ displayName }: { displayName: string }) {
  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  const handleClaim = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/welcome-bonus', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setClaimed(true)
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setError(data.error || 'Failed to claim. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8 relative overflow-hidden rounded-2xl border border-aurora-500/30 bg-gradient-to-r from-aurora-500/10 via-nova-500/10 to-moon-500/10 p-6">
      <div className="absolute inset-0 pointer-events-none">
        {['🎉','⭐','✨','🚀','🌙','💫','🎁','⚡'].map((emoji, i) => (
          <div key={i} className="absolute text-2xl animate-float" style={{
            left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 0.3}s`, opacity: 0.4,
          }}>
            {emoji}
          </div>
        ))}
      </div>

      {error && (
        <div className="relative mb-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎁</span>
            <h2 className="font-display text-xl font-bold text-white">
              {claimed ? 'Welcome bonus claimed!' : `Welcome to Moonshot, ${displayName}!`}
            </h2>
          </div>
          <p className="text-white/60 text-sm">
            {claimed
              ? '100 points have been added to your account. Start completing quests!'
              : 'Claim your 100-point welcome bonus and start your journey to the stars.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center glass rounded-xl px-4 py-2 border border-aurora-500/20">
            <div className="text-2xl font-bold font-mono text-aurora-400">+100</div>
            <div className="text-xs text-white/40">welcome pts</div>
          </div>
          {claimed ? (
            <div className="btn-primary text-sm py-2 px-4 whitespace-nowrap opacity-80">
              ✓ Claimed!
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={loading}
              className="btn-primary text-sm py-2 px-4 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? 'Claiming...' : 'Claim Bonus →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
