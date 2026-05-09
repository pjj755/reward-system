'use client'
import { useAppSession } from '@/lib/use-app-session'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { getDifficultyColor, cn } from '@/lib/utils'
import { CheckInModal } from '@/components/quests/CheckInModal'
import { ShareModal } from '@/components/quests/ShareModal'

interface PendingQuest {
  id: string; questTitle: string; questEmoji: string; pointsEarned: number
}

interface Quest {
  id: string
  title: string
  description: string
  pointValue: number
  type: string
  category: string
  difficulty: string
  isFunctional: boolean
  iconEmoji: string
  status: 'available' | 'completed' | 'cooldown' | 'locked'
  completionCount: number
  lastCompletedAt: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All', daily: 'Daily', one_time: 'One-Time', recurring: 'Recurring',
}

export default function QuestsPage() {
  const { data: session } = useAppSession()
  const router = useRouter()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [pendingQuests, setPendingQuests] = useState<PendingQuest[]>([])
  const [claiming, setClaiming] = useState<string | null>(null)

  const fetchQuests = useCallback(async () => {
    const res = await fetch('/api/quests')
    const data = await res.json()
    setQuests(data.quests || [])
    setLoading(false)
  }, [])

  const fetchPending = useCallback(async () => {
    if (!session) return
    const res = await fetch('/api/quests/pending')
    const data = await res.json()
    setPendingQuests(data.quests || [])
  }, [session])

  useEffect(() => { fetchQuests(); fetchPending() }, [fetchQuests, fetchPending])

  const handleClaim = async (completionId: string) => {
    setClaiming(completionId)
    try {
      const res = await fetch('/api/quests/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId }),
      })
      if (res.ok) {
        setPendingQuests(prev => prev.filter(q => q.id !== completionId))
        setTimeout(() => window.location.reload(), 800)
      }
    } finally {
      setClaiming(null)
    }
  }

  const dailyQuest = quests.find(q => q.type === 'daily_checkin')
  const otherQuests = quests.filter(q => q.type !== 'daily_checkin')
  const sortQuests = (list: Quest[]) =>
    [...list].sort((a, b) => {
      const rank = (q: Quest) => (q.status === 'completed' ? 2 : !q.isFunctional ? 1 : 0)
      return rank(a) - rank(b)
    })
  const filtered = sortQuests(filter === 'all' ? otherQuests : otherQuests.filter(q => q.category === filter))

  const handleQuestClick = (quest: Quest) => {
    if (!session) { router.push('/auth'); return }
    if (quest.status === 'completed') return
    if (quest.type === 'daily_checkin') {
      setSelectedQuest(quest)
      setCheckinOpen(true)
    } else if (quest.type === 'share') {
      setSelectedQuest(quest)
      setShareOpen(true)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          ⚡ Quests
        </h1>
        <p className="text-white/50">Complete quests to earn points and level up your rewards.</p>
      </div>

      {/* Pending Rewards */}
      {pendingQuests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-widest">Rewards Ready to Claim</h2>
          </div>
          <div className="space-y-3">
            {pendingQuests.map(q => (
              <div key={q.id} className="flex items-center gap-4 rounded-2xl border border-aurora-500/20 bg-aurora-500/5 px-5 py-4">
                <span className="text-3xl">{q.questEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{q.questTitle}</div>
                  <div className="text-moon-400 font-mono font-bold text-sm">+{q.pointsEarned} pts</div>
                </div>
                <button
                  onClick={() => handleClaim(q.id)}
                  disabled={claiming === q.id}
                  className="btn-primary text-sm px-5 py-2 flex-shrink-0 disabled:opacity-50"
                >
                  {claiming === q.id ? 'Claiming...' : '🎁 Claim'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Check-in — Featured */}
      {dailyQuest && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4">Featured Quest</h2>
          <div
            onClick={() => handleQuestClick(dailyQuest)}
            className={cn(
              'relative overflow-hidden rounded-2xl border p-6 cursor-pointer transition-all duration-300 group',
              dailyQuest.status === 'completed'
                ? 'border-aurora-500/30 bg-aurora-500/5'
                : 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-moon-500/5 hover:border-orange-400/50 hover:shadow-moon'
            )}
          >
            {/* BG Glow */}
            <div className="absolute inset-0 bg-moon-glow opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="text-5xl">{dailyQuest.iconEmoji}</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-display text-2xl font-bold text-white">{dailyQuest.title}</h3>
                  <span className="badge border-orange-500/30 text-orange-400 bg-orange-500/10">Daily</span>
                  {dailyQuest.status === 'completed' && (
                    <span className="badge border-aurora-500/30 text-aurora-400 bg-aurora-500/10">✓ Done Today</span>
                  )}
                </div>
                <p className="text-white/60 text-sm mb-4 max-w-lg">{dailyQuest.description}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-moon-400 text-sm font-mono font-bold">+{dailyQuest.pointValue}</span>
                    <span className="text-white/40 text-xs">pts base</span>
                  </div>
                  <div className="text-white/40 text-xs">+streak bonuses at 3, 7, 14, 30 days</div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  className={cn(
                    'px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                    dailyQuest.status === 'completed'
                      ? 'bg-aurora-500/20 text-aurora-400 border border-aurora-500/30 cursor-default'
                      : 'btn-moon group-hover:scale-105'
                  )}
                >
                  {dailyQuest.status === 'completed' ? '✓ Checked In' : '🔥 Check In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              filter === key
                ? 'bg-nova-500/20 text-nova-300 border border-nova-500/30'
                : 'text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quest Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-48 shimmer-bg" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(quest => (
            <QuestCard key={quest.id} quest={quest} onClick={() => handleQuestClick(quest)} />
          ))}
        </div>
      )}

      {/* Check-in Modal */}
      {checkinOpen && selectedQuest && (
        <CheckInModal
          quest={selectedQuest}
          onClose={() => setCheckinOpen(false)}
          onSuccess={() => {
            setCheckinOpen(false)
            window.location.reload()
          }}
        />
      )}

      {/* Share Modal */}
      {shareOpen && selectedQuest && (
        <ShareModal
          pointValue={selectedQuest.pointValue}
          onClose={() => setShareOpen(false)}
          onSuccess={() => {
            setShareOpen(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

function QuestCard({ quest, onClick }: { quest: Quest; onClick: () => void }) {
  const diffColor = getDifficultyColor(quest.difficulty)
  const isDone = quest.status === 'completed'

  return (
    <div
      onClick={isDone ? undefined : onClick}
      className={cn(
        'relative overflow-hidden transition-all duration-200 rounded-2xl border p-5 flex flex-col',
        isDone
          ? 'border-aurora-500/20 bg-aurora-500/5 cursor-default'
          : quest.isFunctional
          ? 'border-white/10 bg-white/3 hover:border-moon-400/40 hover:shadow-moon hover:bg-white/5 cursor-pointer'
          : 'border-white/5 bg-white/2 opacity-50 cursor-default'
      )}
    >
      {isDone && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          {/* Subtle green tint overlay */}
          <div className="absolute inset-0 bg-aurora-500/5 rounded-2xl" />
        </div>
      )}

      <div className="relative flex items-start justify-between mb-3">
        <span className={cn('text-3xl', isDone && 'opacity-60')}>{quest.iconEmoji}</span>
        {isDone && (
          <div className="flex items-center gap-1.5 bg-aurora-500/15 border border-aurora-500/30 rounded-full px-2.5 py-1">
            <svg className="w-3 h-3 text-aurora-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-aurora-400 text-xs font-semibold">Completed</span>
          </div>
        )}
        {!isDone && !quest.isFunctional && (
          <span className="text-[10px] text-white/25 font-mono bg-white/5 px-2 py-0.5 rounded-full">SOON</span>
        )}
      </div>

      <h3 className={cn('font-display text-lg font-bold mb-1', isDone ? 'text-white/50' : 'text-white')}>{quest.title}</h3>
      <p className="text-white/40 text-sm mb-4 line-clamp-2">{quest.description}</p>

      <div className="flex items-center justify-between mt-auto">
        <div className={cn(isDone && 'opacity-40')}>
          <span className="text-moon-400 font-mono font-bold">+{quest.pointValue}</span>
          <span className="text-white/30 text-xs ml-1">pts</span>
        </div>
        <span className={cn('badge text-xs', isDone ? 'opacity-40' : '', diffColor)}>{quest.difficulty}</span>
      </div>
    </div>
  )
}
