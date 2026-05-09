import { NextRequest, NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { markQuestPending } from '@/lib/quest-utils'

const ALLOWED_TYPES = ['profile', 'social', 'share']

export async function POST(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { questType } = await req.json()
  if (!ALLOWED_TYPES.includes(questType)) {
    return NextResponse.json({ error: 'Invalid quest type' }, { status: 400 })
  }

  const result = await markQuestPending(session.user.id, questType)
  if (!result) {
    return NextResponse.json({ alreadyCompleted: true })
  }

  return NextResponse.json({ success: true, ...result })
}
