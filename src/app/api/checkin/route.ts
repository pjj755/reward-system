import { NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'
import { isToday, isYesterday, getStreakBonus } from '@/lib/utils'

export async function POST() {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Get user and daily_checkin quest
  const [user, quest] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.quest.findFirst({ where: { type: 'daily_checkin' } }),
  ])

  if (!user || !quest) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check if already checked in today
  if (user.lastCheckinAt && isToday(new Date(user.lastCheckinAt))) {
    return NextResponse.json({ error: 'Already checked in today' }, { status: 409 })
  }

  // Calculate streak
  let newStreak = 1
  if (user.lastCheckinAt) {
    const lastDate = new Date(user.lastCheckinAt)
    if (isYesterday(lastDate)) {
      newStreak = user.currentStreak + 1
    }
    // else streak resets to 1
  }

  const streakBonus = getStreakBonus(newStreak)
  const basePoints = quest.pointValue
  const totalPoints = basePoints + streakBonus
  const newLongest = Math.max(user.longestStreak, newStreak)

  // Determine if milestone reached
  const milestones = [3, 7, 14, 30]
  const milestone = milestones.includes(newStreak) ? newStreak : null

  // Atomic transaction: update user + create records
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        pointsBalance: { increment: totalPoints },
        totalEarned: { increment: totalPoints },
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCheckinAt: new Date(),
      },
    }),
    prisma.questCompletion.create({
      data: {
        userId,
        questId: quest.id,
        pointsEarned: totalPoints,
        metadata: JSON.stringify({ streak: newStreak, basePoints, streakBonus, milestone }),
      },
    }),
    prisma.pointTransaction.create({
      data: {
        userId,
        amount: totalPoints,
        type: 'quest_completion',
        description: `Daily Check-in — Day ${newStreak}${streakBonus > 0 ? ` (+${streakBonus} streak bonus)` : ''}`,
      },
    }),
    ...(streakBonus > 0
      ? [
          prisma.pointTransaction.create({
            data: {
              userId,
              amount: 0,
              type: 'streak_bonus',
              description: `🔥 ${newStreak}-day streak bonus: +${streakBonus} pts included above`,
            },
          }),
        ]
      : []),
  ])

  return NextResponse.json({
    success: true,
    pointsEarned: totalPoints,
    basePoints,
    streakBonus,
    newStreak,
    longestStreak: newLongest,
    milestone,
    newBalance: user.pointsBalance + totalPoints,
  })
}
