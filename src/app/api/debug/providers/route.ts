import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const emailHasUser = !!process.env.EMAIL_SERVER_USER
  const emailHasPass = !!process.env.EMAIL_SERVER_PASSWORD
  const googleHasId = !!process.env.GOOGLE_CLIENT_ID
  const nodeEnv = process.env.NODE_ENV

  return NextResponse.json({
    nodeEnv,
    emailProviderEnabled: emailHasUser && emailHasPass,
    emailHasUser,
    emailHasPass,
    googleProviderEnabled: googleHasId,
    googleHasId,
    emailHost: process.env.EMAIL_SERVER_HOST ?? 'smtp.gmail.com',
    emailPort: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    emailFrom: process.env.EMAIL_FROM,
  })
}
