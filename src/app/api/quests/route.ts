import { NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'
import { isToday } from '@/lib/utils'

export async function GET() {
  const session = await getDevSession()

  const quests = await prisma.quest.findMany({
    where: { isActive: true },
    orderBy: [{ isFunctional: 'desc' }, { pointValue: 'desc' }],
  })

  if (!session?.user?.id) {
    return NextResponse.json({ quests: quests.map(q => ({ ...q, status: 'locked' })) })
  }

  // Fetch user's completion history
  const completions = await prisma.questCompletion.findMany({
    where: { userId: session.user.id },
    orderBy: { completedAt: 'desc' },
  })

  const questsWithStatus = quests.map(quest => {
    const questCompletions = completions.filter(c => c.questId === quest.id)
    const latestCompletion = questCompletions[0]

    let status: 'available' | 'completed' | 'cooldown' = 'available'

    if (quest.category === 'one_time' && questCompletions.length > 0) {
      status = 'completed'
    } else if (quest.type === 'daily_checkin' && latestCompletion) {
      const completedAt = new Date(latestCompletion.completedAt)
      if (isToday(completedAt)) {
        status = 'completed'
      }
    }

    return {
      ...quest,
      status,
      completionCount: questCompletions.length,
      lastCompletedAt: latestCompletion?.completedAt ?? null,
    }
  })

  return NextResponse.json({ quests: questsWithStatus })
}
