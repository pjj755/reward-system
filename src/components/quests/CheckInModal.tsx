'use client'
import { useState, useEffect, useRef } from 'react'
import { useAppSession } from '@/lib/use-app-session'

interface Quest {
  id: string; title: string; pointValue: number; status: string
}
interface CheckInResult {
  pointsEarned: number; basePoints: number; streakBonus: number;
  newStreak: number; longestStreak: number; milestone: number | null; newBalance: number
}

export function CheckInModal({ quest, onClose, onSuccess }: {
  quest: Quest; onClose: () => void; onSuccess: () => void
}) {
  const { update } = useAppSession() as any
  const [phase, setPhase] = useState<'ready' | 'launching' | 'result'>('ready')
  const [countdown, setCountdown] = useState(3)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [error, setError] = useState('')
  const confettiRef = useRef<HTMLDivElement>(null)

  // Already checked in
  const alreadyDone = quest.status === 'completed'

  const handleLaunch = async () => {
    setPhase('launching')
    // Animate countdown
    for (let i = 3; i >= 1; i--) {
      setCountdown(i)
      await sleep(700)
    }
    // Call API
    try {
      const res = await fetch('/api/checkin', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to check in')
        setPhase('ready')
        return
      }
      setResult(data)
      setPhase('result')
      // Refresh session
      await update()
      // Trigger confetti
      spawnConfetti()
    } catch {
      setError('Network error. Please try again.')
      setPhase('ready')
    }
  }

  const spawnConfetti = () => {
    if (!confettiRef.current) return
    const colors = ['#eecb2c', '#5a56f5', '#0fbf9e', '#f5e06a', '#a8abff']
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left = `${Math.random() * 100}%`
      el.style.background = colors[Math.floor(Math.random() * colors.length)]
      el.style.animationDelay = `${Math.random() * 0.5}s`
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      el.style.transform = `rotate(${Math.random() * 360}deg)`
      confettiRef.current.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-md bg-space-800 border border-white/10 rounded-3xl overflow-hidden shadow-card">
        {/* Confetti container */}
        <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden z-20" />

        {/* Cosmic background */}
        <div className="absolute inset-0 bg-nova-glow opacity-40" />
        <div className="absolute inset-0 bg-moon-glow opacity-20" />

        <div className="relative p-8">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-xl leading-none">
            ×
          </button>

          {/* PHASE: Ready */}
          {phase === 'ready' && (
            <div className="text-center">
              {alreadyDone ? (
                <>
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="font-display text-2xl font-bold text-aurora-400 mb-2">Already Checked In!</h2>
                  <p className="text-white/60 text-sm mb-6">You've already completed your daily check-in. Come back tomorrow to keep your streak alive!</p>
                  <button onClick={onClose} className="btn-ghost w-full">Close</button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-2 animate-float inline-block">🚀</div>
                  <h2 className="font-display text-3xl font-bold mb-2">
                    <span className="gradient-text">Daily Launch</span>
                  </h2>
                  <p className="text-white/50 text-sm mb-6">
                    Hit the button to launch your daily check-in and earn points. Build your streak for bonus rewards!
                  </p>

                  {/* Streak preview */}
                  <div className="glass rounded-xl p-4 mb-6 text-left space-y-2">
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Streak Bonuses</div>
                    {[
                      { days: 3, bonus: 5, icon: '✨' },
                      { days: 7, bonus: 20, icon: '⚡' },
                      { days: 14, bonus: 50, icon: '🌙' },
                      { days: 30, bonus: 100, icon: '🌟' },
                    ].map(({ days, bonus, icon }) => (
                      <div key={days} className="flex items-center justify-between text-sm">
                        <span className="text-white/60">{icon} {days}-day streak</span>
                        <span className="text-moon-400 font-mono font-bold">+{bonus} pts</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
                      {error}
                    </div>
                  )}

                  <button onClick={handleLaunch} className="btn-moon w-full text-base py-4 text-space-900 font-bold">
                    🔥 Launch Check-in
                  </button>
                </>
              )}
            </div>
          )}

          {/* PHASE: Launching (animated countdown) */}
          {phase === 'launching' && (
            <div className="text-center py-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* Orbit rings */}
                <div className="absolute inset-0 rounded-full border border-nova-500/30 animate-spin-slow" />
                <div className="absolute inset-2 rounded-full border border-moon-500/20 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '5s' }} />
                {/* Countdown */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-6xl font-bold text-moon-400 animate-pulse">
                    {countdown}
                  </span>
                </div>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Initiating Launch Sequence...</h3>
              <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                <span className="w-2 h-2 rounded-full bg-nova-500 animate-pulse" />
                <span>Syncing with Moonshot servers</span>
              </div>
            </div>
          )}

          {/* PHASE: Result */}
          {phase === 'result' && result && (
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="font-display text-3xl font-bold mb-1">
                <span className="gradient-text">+{result.pointsEarned} Points!</span>
              </h2>
              {result.milestone && (
                <div className="inline-flex items-center gap-2 bg-moon-500/20 border border-moon-500/30 rounded-full px-4 py-1.5 mb-4">
                  <span>🏆</span>
                  <span className="text-moon-400 font-semibold text-sm">{result.milestone}-Day Milestone!</span>
                </div>
              )}
              <div className="glass rounded-xl p-5 mb-6 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Base reward</span>
                  <span className="text-white font-mono">+{result.basePoints} pts</span>
                </div>
                {result.streakBonus > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-400">🔥 Streak bonus</span>
                    <span className="text-orange-400 font-mono font-bold">+{result.streakBonus} pts</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white/70 font-medium">New balance</span>
                  <span className="text-moon-400 font-mono font-bold text-lg">{result.newBalance.toLocaleString()} pts</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-2xl">🔥</span>
                <span className="text-white font-semibold">Day {result.newStreak} Streak!</span>
                {result.newStreak >= 3 && (
                  <span className="text-xs text-white/40">Best: {result.longestStreak}</span>
                )}
              </div>
              <button onClick={onSuccess} className="btn-primary w-full">
                Keep Exploring ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
