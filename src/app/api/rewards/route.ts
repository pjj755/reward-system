import { NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getDevSession()

  const rewards = await prisma.reward.findMany({
    where: { isActive: true },
    orderBy: [{ isFunctional: 'desc' }, { pointCost: 'asc' }],
  })

  if (!session?.user?.id) {
    return NextResponse.json({ rewards })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pointsBalance: true },
  })

  const rewardsWithAffordability = rewards.map(r => ({
    ...r,
    canAfford: (user?.pointsBalance ?? 0) >= r.pointCost,
    inStock: r.stock === -1 || r.stock > 0,
  }))

  return NextResponse.json({ rewards: rewardsWithAffordability, balance: user?.pointsBalance ?? 0 })
}
