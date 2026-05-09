'use client'
import { useState } from 'react'

interface PendingQuest {
  id: string
  questTitle: string
  pointsEarned: number
  questEmoji: string
}

export default function QuestRewardModal({ pending }: { pending: PendingQuest[] }) {
  const [quests, setQuests] = useState(pending)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimed, setClaimed] = useState<PendingQuest[]>([])
  const [phase, setPhase] = useState<'list' | 'success'>('list')
  const [lastClaimed, setLastClaimed] = useState<PendingQuest | null>(null)

  if (quests.length === 0 && claimed.length === 0) return null

  const handleClaim = async (quest: PendingQuest) => {
    setClaiming(quest.id)
    try {
      const res = await fetch('/api/quests/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId: quest.id }),
      })
      if (res.ok) {
        setLastClaimed(quest)
        setClaimed(prev => [...prev, quest])
        setQuests(prev => prev.filter(q => q.id !== quest.id))
        setPhase('success')
        setTimeout(() => {
          setPhase('list')
          if (quests.length <= 1) {
            setTimeout(() => window.location.reload(), 300)
          }
        }, 1800)
      }
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-space-800 border border-white/10 rounded-3xl overflow-hidden shadow-card">
        <div className="absolute inset-0 bg-nova-glow opacity-20" />

        <div className="relative p-7">
          {phase === 'success' && lastClaimed ? (
            <div className="text-center py-4">
              <div className="text-6xl mb-3 animate-bounce">{lastClaimed.questEmoji}</div>
              <h2 className="font-display text-2xl font-bold gradient-text mb-1">+{lastClaimed.pointsEarned} pts!</h2>
              <p className="text-white/50 text-sm">{lastClaimed.questTitle} completed</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="font-display text-2xl font-bold text-white mb-1">
                  {quests.length > 1 ? 'Rewards Ready!' : 'Quest Complete!'}
                </h2>
                <p className="text-white/50 text-sm">
                  You've earned {quests.length > 1 ? `${quests.length} rewards` : 'a reward'} — claim your points!
                </p>
              </div>

              <div className="space-y-3">
                {quests.map(quest => (
                  <div key={quest.id} className="flex items-center gap-4 glass rounded-xl p-4 border border-white/10">
                    <div className="text-3xl">{quest.questEmoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{quest.questTitle}</div>
                      <div className="text-moon-400 font-mono font-bold">+{quest.pointsEarned} pts</div>
                    </div>
                    <button
                      onClick={() => handleClaim(quest)}
                      disabled={claiming === quest.id}
                      className="btn-primary text-sm px-4 py-2 flex-shrink-0 disabled:opacity-50"
                    >
                      {claiming === quest.id ? '...' : 'Claim'}
                    </button>
                  </div>
                ))}
              </div>

              {quests.length === 0 && (
                <p className="text-center text-white/40 text-sm mt-4">All claimed! 🎊</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
