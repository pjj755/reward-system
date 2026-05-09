import { NextRequest, NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { completionId } = await req.json()
  const userId = session.user.id

  const completion = await prisma.questCompletion.findFirst({
    where: { id: completionId, userId, claimed: false },
    include: { quest: { select: { title: true } } },
  })

  if (!completion) return NextResponse.json({ error: 'Not found or already claimed' }, { status: 404 })

  await prisma.$transaction([
    prisma.questCompletion.update({
      where: { id: completionId },
      data: { claimed: true, claimedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        pointsBalance: { increment: completion.pointsEarned },
        totalEarned: { increment: completion.pointsEarned },
      },
    }),
    prisma.pointTransaction.create({
      data: {
        userId,
        amount: completion.pointsEarned,
        type: 'quest_completion',
        description: `Quest completed: ${completion.quest.title}`,
      },
    }),
  ])

  return NextResponse.json({ success: true, pointsEarned: completion.pointsEarned, questTitle: completion.quest.title })
}
