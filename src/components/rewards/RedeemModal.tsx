'use client'
import { useState, useRef } from 'react'
import { useAppSession } from '@/lib/use-app-session'
import { cn } from '@/lib/utils'

interface Reward {
  id: string; title: string; description: string; pointCost: number;
  category: string; iconEmoji: string; isFunctional: boolean; canAfford: boolean; inStock: boolean;
  isOneTime?: boolean; alreadyClaimed?: boolean
}
interface RedeemResult {
  code: string; reward: { title: string; emoji: string }
  pointsSpent: number; newBalance: number
}

export function RedeemModal({ reward, balance, onClose, onSuccess }: {
  reward: Reward; balance: number; onClose: () => void; onSuccess: () => void
}) {
  const { update } = useAppSession() as any
  const [phase, setPhase] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm')
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const confettiRef = useRef<HTMLDivElement>(null)

  const canAfford = balance >= reward.pointCost
  const isNonFunctional = !reward.isFunctional

  const handleRedeem = async () => {
    if (!canAfford || !reward.inStock || reward.alreadyClaimed) return
    setPhase('loading')
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: reward.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Redemption failed')
        setPhase('error')
        return
      }
      setResult(data)
      setPhase('success')
      await update()
      spawnConfetti()
    } catch {
      setErrorMsg('Network error. Please try again.')
      setPhase('error')
    }
  }

  const spawnConfetti = () => {
    if (!confettiRef.current) return
    const colors = ['#eecb2c', '#5a56f5', '#0fbf9e', '#f5e06a', '#a8abff', '#34d7b6']
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left = `${Math.random() * 100}%`
      el.style.background = colors[Math.floor(Math.random() * colors.length)]
      el.style.animationDelay = `${Math.random() * 0.8}s`
      el.style.width = el.style.height = `${6 + Math.random() * 6}px`
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      confettiRef.current.appendChild(el)
      setTimeout(() => el.remove(), 2500)
    }
  }

  const copyCode = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-md bg-space-800 border border-white/10 rounded-3xl overflow-hidden shadow-card">
        <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden z-20" />
        <div className="absolute inset-0 bg-nova-glow opacity-30" />

        <div className="relative p-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-xl">×</button>

          {/* CONFIRM */}
          {phase === 'confirm' && (
            <div>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{reward.iconEmoji}</div>
                <h2 className="font-display text-2xl font-bold text-white mb-1">{reward.title}</h2>
                <p className="text-white/50 text-sm">{reward.description}</p>
              </div>

              {reward.isOneTime && (
                <div className="bg-moon-500/10 border border-moon-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <span className="text-moon-400 text-lg flex-shrink-0">⚠️</span>
                  <p className="text-moon-400 text-sm"><strong>One-time only.</strong> This reward can only be redeemed once per account.</p>
                </div>
              )}
              {isNonFunctional && (
                <div className="bg-moon-500/10 border border-moon-500/20 rounded-xl p-3 mb-4 text-center">
                  <p className="text-moon-400 text-sm">⚠️ This reward is for demo purposes. Points will be deducted but no real item will be delivered.</p>
                </div>
              )}

              <div className="glass rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Cost</span>
                  <span className="text-moon-400 font-mono font-bold">{reward.pointCost.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Current balance</span>
                  <span className="text-white font-mono">{balance.toLocaleString()} pts</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white/70 font-medium">After redemption</span>
                  <span className={cn('font-mono font-bold', canAfford ? 'text-aurora-400' : 'text-red-400')}>
                    {(balance - reward.pointCost).toLocaleString()} pts
                  </span>
                </div>
              </div>

              {!canAfford && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-center text-red-400 text-sm">
                  You need {(reward.pointCost - balance).toLocaleString()} more points to redeem this reward.
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button
                  onClick={handleRedeem}
                  disabled={!canAfford || !reward.inStock}
                  className="btn-primary flex-1"
                >
                  Confirm Redeem
                </button>
              </div>
            </div>
          )}

          {/* LOADING */}
          {phase === 'loading' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-2 border-nova-500/30 border-t-nova-500 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-white mb-2">Processing...</h3>
              <p className="text-white/40 text-sm">Securing your reward</p>
            </div>
          )}

          {/* SUCCESS */}
          {phase === 'success' && result && (
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="font-display text-2xl font-bold text-aurora-400 mb-1">Redeemed!</h2>
              <p className="text-white/60 text-sm mb-6">Enjoy your {result.reward.title}</p>

              {/* Redemption Code */}
              <div className="glass rounded-xl p-5 mb-6">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Redemption Code</div>
                <div
                  onClick={copyCode}
                  className="font-mono text-xl font-bold text-moon-400 cursor-pointer hover:text-moon-300 transition-colors flex items-center justify-center gap-2"
                >
                  {result.code}
                  <span className="text-xs text-white/30">{copied ? '✓ Copied!' : '📋'}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm mb-6">
                <span className="text-white/50">Points spent</span>
                <span className="text-red-400 font-mono">-{result.pointsSpent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-6">
                <span className="text-white/50">New balance</span>
                <span className="text-moon-400 font-mono font-bold">{result.newBalance.toLocaleString()} pts</span>
              </div>

              <button onClick={onSuccess} className="btn-primary w-full">Done ✨</button>
            </div>
          )}

          {/* ERROR */}
          {phase === 'error' && (
            <div className="text-center">
              <div className="text-5xl mb-3">😕</div>
              <h2 className="font-display text-2xl font-bold text-red-400 mb-2">Redemption Failed</h2>
              <p className="text-white/50 text-sm mb-6">{errorMsg}</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost flex-1">Close</button>
                <button onClick={() => setPhase('confirm')} className="btn-primary flex-1">Try Again</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
