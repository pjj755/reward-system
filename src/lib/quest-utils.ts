import { prisma } from './prisma'

export async function markQuestPending(userId: string, questType: string) {
  const quest = await prisma.quest.findFirst({ where: { type: questType, isActive: true } })
  if (!quest) return null

  const already = await prisma.questCompletion.findFirst({
    where: { userId, questId: quest.id },
  })
  if (already) return null

  await prisma.questCompletion.create({
    data: { userId, questId: quest.id, pointsEarned: quest.pointValue, claimed: false },
  })

  return { questId: quest.id, questTitle: quest.title, pointsEarned: quest.pointValue }
}
