import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const devSession = await getDevSession()
  const authSession = devSession ?? await getServerSession(authOptions)
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authSession.user.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { welcomeBonusClaimed: true },
  })

  if (!user || user.welcomeBonusClaimed) {
    return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: 100 }, totalEarned: { increment: 100 }, welcomeBonusClaimed: true },
    }),
    prisma.pointTransaction.create({
      data: {
        userId,
        amount: 100,
        type: 'bonus',
        description: '🎉 Welcome bonus — thanks for joining Moonshot!',
      },
    }),
  ])

  return NextResponse.json({ success: true, points: 100 })
}
