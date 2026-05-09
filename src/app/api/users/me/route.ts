import { NextRequest, NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'
import { markQuestPending } from '@/lib/quest-utils'

export async function GET() {
  const session = await getDevSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, image: true,
      pointsBalance: true, totalEarned: true, totalSpent: true,
      currentStreak: true, longestStreak: true, lastCheckinAt: true, createdAt: true,
      transactions: {
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, amount: true, type: true, description: true, createdAt: true },
      },
      redemptions: {
        orderBy: { redeemedAt: 'desc' }, take: 10,
        include: { reward: { select: { title: true, iconEmoji: true } } },
      },
      questCompletions: {
        orderBy: { completedAt: 'desc' }, take: 10,
        include: { quest: { select: { title: true, iconEmoji: true } } },
      },
    },
  })

  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
  })

  const bonusQuest = await markQuestPending(session.user.id, 'profile')
  return NextResponse.json({ success: true, bonusQuest })
}
