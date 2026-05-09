'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface PendingQuest {
  id: string
  questTitle: string
  questEmoji: string
  pointsEarned: number
}

const SEEN_KEY = 'moonshot_seen_notifs'

function getSeenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')) } catch { return new Set() }
}
function addSeenIds(ids: string[]) {
  try {
    const seen = getSeenIds()
    ids.forEach(id => seen.add(id))
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)))
  } catch {}
}

// ——— Points Toast ———
function PointsToast({ points, onDone }: { points: number; onDone: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => setVisible(false), 3000)
    const t3 = setTimeout(onDone, 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] transition-all duration-400 pointer-events-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-aurora-500/40 bg-space-900/95 backdrop-blur-xl px-6 py-4 shadow-2xl">
        <div className="relative">
          <span className="text-3xl">⭐</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-aurora-400 rounded-full animate-ping" />
        </div>
        <div>
          <div className="text-aurora-300 font-mono font-bold text-xl tracking-tight">+{points} pts earned!</div>
          <div className="text-white/50 text-xs mt-0.5">Points added to your account</div>
        </div>
      </div>
    </div>
  )
}

// ——— Claim Modal ———
function ClaimModal({
  quest, onClose, onSuccess,
}: {
  quest: PendingQuest
  onClose: () => void
  onSuccess: (points: number) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'claiming' | 'success'>('idle')
  const [count, setCount] = useState(0)

  const animateCount = (target: number) => {
    let start = 0
    const step = Math.ceil(target / 30)
    const t = setInterval(() => {
      start = Math.min(start + step, target)
      setCount(start)
      if (start >= target) clearInterval(t)
    }, 30)
  }

  const handleClaim = async () => {
    setPhase('claiming')
    const res = await fetch('/api/quests/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completionId: quest.id }),
    })
    if (res.ok) {
      setPhase('success')
      animateCount(quest.pointsEarned)
      setTimeout(() => {
        onSuccess(quest.pointsEarned)
        onClose()
      }, 2200)
    } else {
      setPhase('idle')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={phase === 'success' ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-space-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {phase === 'success' ? (
          <div className="p-8 text-center">
            {/* Success rings */}
            <div className="relative flex items-center justify-center mb-6 h-24">
              <div className="absolute w-24 h-24 rounded-full border-2 border-aurora-400/40 animate-ping" />
              <div className="absolute w-20 h-20 rounded-full border border-aurora-400/20 animate-pulse" />
              <div className="text-5xl z-10 animate-bounce">{quest.questEmoji}</div>
            </div>
            <div className="text-4xl font-bold font-mono text-aurora-300 mb-1">+{count}</div>
            <div className="text-white/50 text-sm mb-2">pts</div>
            <div className="font-display text-lg font-bold text-white mb-1">Reward Claimed!</div>
            <div className="text-white/40 text-xs">Points are being added to your account…</div>
          </div>
        ) : (
          <div className="p-6">
            <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-all text-sm">
              ✕
            </button>

            {/* Quest info */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{quest.questEmoji}</div>
              <div className="inline-flex items-center gap-1.5 bg-aurora-500/10 border border-aurora-500/20 rounded-full px-3 py-1 text-aurora-400 text-xs font-medium mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-aurora-400" />
                Quest Completed
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">{quest.questTitle}</h3>
              <p className="text-white/40 text-sm">Congratulations! You've completed this quest. Claim your points reward below.</p>
            </div>

            {/* Points preview */}
            <div className="flex items-center justify-center gap-3 mb-6 p-4 rounded-2xl bg-gradient-to-r from-moon-500/10 to-aurora-500/10 border border-moon-500/20">
              <span className="text-2xl">⭐</span>
              <span className="text-3xl font-bold font-mono text-moon-300">+{quest.pointsEarned}</span>
              <span className="text-white/40 text-sm">pts reward</span>
            </div>

            <button
              onClick={handleClaim}
              disabled={phase === 'claiming'}
              className="w-full btn-primary py-3.5 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phase === 'claiming' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Claiming…
                </span>
              ) : '🎁 Claim Reward'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ——— Main Bell Component ———
export function NotificationBell() {
  const [quests, setQuests] = useState<PendingQuest[]>([])
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const [selectedQuest, setSelectedQuest] = useState<PendingQuest | null>(null)
  const [toast, setToast] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const fetchQuests = useCallback(async () => {
    const res = await fetch('/api/quests/pending').catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    setQuests(data.quests ?? [])
  }, [])

  useEffect(() => {
    setSeenIds(getSeenIds())
    fetchQuests()
  }, [fetchQuests])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = quests.filter(q => !seenIds.has(q.id)).length

  const handleOpenBell = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
      const ids = quests.map(q => q.id)
      addSeenIds(ids)
      setSeenIds(getSeenIds())
    }
    setOpen(o => !o)
  }

  const handleSelectQuest = (q: PendingQuest) => {
    setSelectedQuest(q)
    setOpen(false)
  }

  const handleClaimed = (points: number) => {
    setQuests(prev => prev.filter(q => q.id !== selectedQuest?.id))
    setSelectedQuest(null)
    setToast(points)
    setTimeout(() => window.location.reload(), 3500)
  }

  return (
    <>
      {/* Toast — portaled to body to escape Navbar stacking context */}
      {toast !== null && typeof document !== 'undefined' && createPortal(
        <PointsToast points={toast} onDone={() => setToast(null)} />,
        document.body
      )}

      {/* Claim Modal — portaled to body */}
      {selectedQuest && typeof document !== 'undefined' && createPortal(
        <ClaimModal
          quest={selectedQuest}
          onClose={() => setSelectedQuest(null)}
          onSuccess={handleClaimed}
        />,
        document.body
      )}

      {/* Bell Button + Dropdown */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleOpenBell}
          className="relative p-2 rounded-xl hover:bg-white/5 transition-all"
        >
          <svg className={`w-5 h-5 transition-colors ${open ? 'text-white' : 'text-white/50 hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {unreadCount === 0 && quests.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-moon-400 rounded-full" />
          )}
        </button>

        {open && typeof document !== 'undefined' && createPortal(
          <div
            ref={dropdownRef}
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
            className="fixed w-80 rounded-2xl border border-white/10 bg-space-900/95 backdrop-blur-xl shadow-2xl z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {quests.length > 0 && (
                <span className="text-xs font-mono text-red-400">{quests.length} reward{quests.length > 1 ? 's' : ''} to claim</span>
              )}
            </div>

            {/* List */}
            {quests.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <div className="text-white/40 text-sm">No pending rewards</div>
                <div className="text-white/20 text-xs mt-1">Complete quests to earn rewards</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {quests.map(q => {
                  const isUnread = !seenIds.has(q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuest(q)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="flex-shrink-0 relative">
                        <span className="text-2xl">{q.questEmoji}</span>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-space-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${isUnread ? 'text-white font-medium' : 'text-white/70'}`}>
                          {q.questTitle}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {isUnread ? (
                            <span className="text-aurora-400 font-medium">· New</span>
                          ) : (
                            <span>Click to claim reward</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-moon-400 font-mono font-bold text-sm">+{q.pointsEarned}</div>
                        <div className="text-white/30 text-xs">pts</div>
                      </div>
                      <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )
                })}
              </div>
            )}

            {quests.length > 0 && (
              <div className="px-4 py-3 border-t border-white/10 text-center">
                <span className="text-xs text-white/30">Click a notification to claim your reward</span>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
    </>
  )
}
