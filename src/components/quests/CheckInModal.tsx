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

const SPACE_FACTS = [
  "A day on Venus is longer than a year on Venus. 🪐",
  "There are more stars in the universe than grains of sand on Earth. ✨",
  "The footprints on the Moon will last 100 million years. 👣",
  "Neutron stars are so dense, a teaspoon weighs a billion tons. 💫",
  "The Sun makes up 99.86% of the solar system's mass. ☀️",
  "Light from the Sun takes 8 minutes to reach Earth. 🌍",
  "Saturn's rings are made mostly of ice and rock. 💍",
  "Jupiter's Great Red Spot is a storm that's raged for 350+ years. 🌀",
  "One million Earths could fit inside the Sun. 🔥",
  "The Milky Way galaxy is 100,000 light-years across. 🌌",
]

const MILESTONES = [3, 7, 14, 30]

function getNextMilestone(streak: number) {
  return MILESTONES.find(m => m > streak) ?? null
}

export function CheckInModal({ quest, onClose, onSuccess }: {
  quest: Quest; onClose: () => void; onSuccess: () => void
}) {
  const { update, data: session } = useAppSession() as any
  const [phase, setPhase] = useState<'ready' | 'opening' | 'result'>('ready')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [error, setError] = useState('')
  const [displayedPoints, setDisplayedPoints] = useState(0)
  const [chestShaking, setChestShaking] = useState(false)
  const confettiRef = useRef<HTMLDivElement>(null)
  const currentStreak = session?.user?.currentStreak ?? 0
  const nextMilestone = getNextMilestone(currentStreak)
  const daysToNext = nextMilestone ? nextMilestone - currentStreak : null
  const milestoneProgress = nextMilestone
    ? ((currentStreak % nextMilestone) / nextMilestone) * 100
    : 100
  const todayFact = SPACE_FACTS[new Date().getDate() % SPACE_FACTS.length]
  const alreadyDone = quest.status === 'completed'

  const handleOpen = async () => {
    setChestShaking(true)
    setPhase('opening')
    await sleep(150)
    setChestShaking(false)
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
      await update()
      spawnConfetti()
      animatePoints(data.pointsEarned)
    } catch {
      setError('Network error. Please try again.')
      setPhase('ready')
    }
  }

  const animatePoints = (target: number) => {
    let current = 0
    const step = Math.ceil(target / 20)
    const interval = setInterval(() => {
      current = Math.min(current + step, target)
      setDisplayedPoints(current)
      if (current >= target) clearInterval(interval)
    }, 40)
  }

  const spawnConfetti = () => {
    if (!confettiRef.current) return
    const colors = ['#eecb2c', '#5a56f5', '#0fbf9e', '#f5e06a', '#a8abff', '#f97316']
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left = `${Math.random() * 100}%`
      el.style.background = colors[Math.floor(Math.random() * colors.length)]
      el.style.animationDelay = `${Math.random() * 0.6}s`
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      el.style.width = `${6 + Math.random() * 8}px`
      el.style.height = `${6 + Math.random() * 8}px`
      el.style.transform = `rotate(${Math.random() * 360}deg)`
      confettiRef.current.appendChild(el)
      setTimeout(() => el.remove(), 2500)
    }
  }

  const handleClose = () => phase === 'result' ? onSuccess() : onClose()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-md bg-space-800 border border-white/10 rounded-3xl overflow-hidden shadow-card">
        <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden z-20" />
        <div className="absolute inset-0 bg-nova-glow opacity-30" />
        <div className="absolute inset-0 bg-moon-glow opacity-15" />

        <div className="relative p-8">
          <button onClick={handleClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-xl leading-none">×</button>

          {/* PHASE: Ready */}
          {phase === 'ready' && (
            <div className="text-center">
              {alreadyDone ? (
                <>
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="font-display text-2xl font-bold text-aurora-400 mb-2">Already Checked In!</h2>
                  <p className="text-white/60 text-sm mb-6">Come back tomorrow to keep your streak alive!</p>
                  <div className="glass rounded-xl p-4 mb-6 text-left">
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Today's Space Fact</div>
                    <p className="text-white/70 text-sm">{todayFact}</p>
                  </div>
                  <button onClick={onClose} className="btn-ghost w-full">Close</button>
                </>
              ) : (
                <>
                  {/* Chest */}
                  <div
                    className={`text-8xl mb-4 inline-block cursor-pointer select-none transition-transform ${chestShaking ? 'animate-bounce' : 'hover:scale-110'}`}
                    style={{ filter: 'drop-shadow(0 0 24px rgba(234,179,8,0.5))' }}
                  >
                    🎁
                  </div>
                  <h2 className="font-display text-3xl font-bold mb-1">
                    <span className="gradient-text">Daily Reward</span>
                  </h2>
                  <p className="text-white/50 text-sm mb-5">Open your daily reward box and build your streak!</p>

                  {/* Streak progress */}
                  {nextMilestone && (
                    <div className="glass rounded-xl p-4 mb-5 text-left">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/40 uppercase tracking-widest">Streak Progress</span>
                        <span className="text-xs text-moon-400 font-mono">{currentStreak} / {nextMilestone} days</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-moon-400 rounded-full transition-all duration-700"
                          style={{ width: `${milestoneProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/40">
                        {daysToNext === 1
                          ? '🔥 1 more day to next milestone!'
                          : `🔥 ${daysToNext} more days to ${nextMilestone}-day milestone`}
                      </p>
                    </div>
                  )}

                  {/* Streak flames */}
                  {currentStreak > 0 && (
                    <div className="flex items-center justify-center gap-1 mb-5">
                      {Array.from({ length: Math.min(currentStreak, 7) }).map((_, i) => (
                        <span key={i} className="text-xl" style={{ animationDelay: `${i * 0.1}s`, filter: 'drop-shadow(0 0 4px #f97316)' }}>🔥</span>
                      ))}
                      {currentStreak > 7 && <span className="text-white/40 text-sm font-mono ml-1">+{currentStreak - 7}</span>}
                    </div>
                  )}

                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
                      {error}
                    </div>
                  )}

                  <button onClick={handleOpen} className="btn-moon w-full text-base py-4 font-bold">
                    🎁 Open Daily Reward
                  </button>
                </>
              )}
            </div>
          )}

          {/* PHASE: Opening */}
          {phase === 'opening' && (
            <div className="text-center py-6">
              <div className="relative w-36 h-36 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-moon-400/40 animate-ping" />
                <div className="absolute inset-4 rounded-full border border-nova-500/30 animate-spin-slow" />
                <div className="absolute inset-8 rounded-full border border-aurora-500/20 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
                <div className="absolute inset-0 flex items-center justify-center text-6xl animate-bounce">
                  🎁
                </div>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Opening your reward...</h3>
              <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                <span className="w-2 h-2 rounded-full bg-moon-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-nova-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-aurora-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          {/* PHASE: Result */}
          {phase === 'result' && result && (
            <div className="text-center">
              {/* Milestone badge */}
              {result.milestone ? (
                <>
                  <div className="text-6xl mb-2 animate-bounce">🏆</div>
                  <div className="inline-flex items-center gap-2 bg-moon-500/20 border border-moon-500/40 rounded-full px-4 py-1.5 mb-3">
                    <span className="text-moon-400 font-bold text-sm">🎉 {result.milestone}-Day Milestone!</span>
                  </div>
                </>
              ) : (
                <div className="text-6xl mb-3">🌟</div>
              )}

              <h2 className="font-display text-4xl font-bold mb-1">
                <span className="gradient-text">+{displayedPoints}</span>
                <span className="text-white/50 text-2xl"> pts</span>
              </h2>

              {/* Breakdown */}
              <div className="glass rounded-xl p-4 mb-5 text-left space-y-2 mt-4">
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
                <div className="border-t border-white/10 pt-2 flex justify-between">
                  <span className="text-white/60">New balance</span>
                  <span className="text-moon-400 font-mono font-bold">{result.newBalance.toLocaleString()} pts</span>
                </div>
              </div>

              {/* Streak flames */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: Math.min(result.newStreak, 7) }).map((_, i) => (
                  <span key={i} className="text-xl" style={{ filter: 'drop-shadow(0 0 6px #f97316)', animationDelay: `${i * 0.08}s` }}>🔥</span>
                ))}
                {result.newStreak > 7 && <span className="text-white/40 text-sm font-mono ml-1">+{result.newStreak - 7}</span>}
              </div>
              <p className="text-white/50 text-sm mb-4">Day <span className="text-orange-400 font-bold">{result.newStreak}</span> streak!</p>

              {/* Space fact */}
              <div className="glass rounded-xl p-3 mb-5 text-left">
                <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Space Fact of the Day</div>
                <p className="text-white/60 text-xs">{todayFact}</p>
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
