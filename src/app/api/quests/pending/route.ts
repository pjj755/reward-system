import { NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getDevSession()
  if (!session?.user?.id) return NextResponse.json({ count: 0, quests: [] })

  const quests = await prisma.questCompletion.findMany({
    where: { userId: session.user.id, claimed: false },
    include: { quest: { select: { title: true, iconEmoji: true } } },
    orderBy: { completedAt: 'desc' },
  })

  return NextResponse.json({
    count: quests.length,
    quests: quests.map(c => ({
      id: c.id,
      questTitle: c.quest.title,
      questEmoji: c.quest.iconEmoji,
      pointsEarned: c.pointsEarned,
      completedAt: c.completedAt,
    })),
  })
}
