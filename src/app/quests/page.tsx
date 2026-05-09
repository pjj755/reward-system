'use client'
import { useAppSession } from '@/lib/use-app-session'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { getDifficultyColor, cn } from '@/lib/utils'
import { CheckInModal } from '@/components/quests/CheckInModal'

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
  status: 'available' | 'completed' | 'cooldown'
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
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)

  useEffect(() => {
    if (!session) { router.push('/auth'); return }
  }, [session, router])

  const fetchQuests = useCallback(async () => {
    const res = await fetch('/api/quests')
    const data = await res.json()
    setQuests(data.quests || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchQuests() }, [fetchQuests])

  const dailyQuest = quests.find(q => q.type === 'daily_checkin')
  const otherQuests = quests.filter(q => q.type !== 'daily_checkin')
  const filtered = filter === 'all' ? otherQuests : otherQuests.filter(q => q.category === filter)

  const handleQuestClick = (quest: Quest) => {
    if (quest.type === 'daily_checkin') {
      setSelectedQuest(quest)
      setCheckinOpen(true)
    }
    // non-functional quests just show their details (read-only)
  }

  if (!session) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          ⚡ Quests
        </h1>
        <p className="text-white/50">Complete quests to earn points and level up your rewards.</p>
      </div>

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
            fetchQuests()
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
      onClick={onClick}
      className={cn(
        'card-hover relative overflow-hidden transition-all duration-200',
        isDone && 'opacity-60',
        !isDone && quest.isFunctional && 'border-moon-500/20 hover:border-moon-400/40 hover:shadow-moon'
      )}
    >
      {isDone && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-aurora-500/20 border border-aurora-500/30 flex items-center justify-center text-aurora-400 text-xs">
          ✓
        </div>
      )}
      <div className="text-3xl mb-3">{quest.iconEmoji}</div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="font-display text-lg font-bold text-white">{quest.title}</h3>
      </div>
      <p className="text-white/50 text-sm mb-4 line-clamp-2">{quest.description}</p>
      <div className="flex items-center justify-between mt-auto">
        <div>
          <span className="text-moon-400 font-mono font-bold">+{quest.pointValue}</span>
          <span className="text-white/30 text-xs ml-1">pts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('badge text-xs', diffColor)}>{quest.difficulty}</span>
          {!quest.isFunctional && (
            <span className="text-xs text-white/20 font-mono">SOON</span>
          )}
        </div>
      </div>
    </div>
  )
}
