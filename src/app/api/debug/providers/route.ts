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
    // 显示变量名长度，避免空格问题，但不暴露值
    emailUserLength: process.env.EMAIL_SERVER_USER?.length ?? 0,
    emailPassLength: process.env.EMAIL_SERVER_PASSWORD?.length ?? 0,
    googleIdLength: process.env.GOOGLE_CLIENT_ID?.length ?? 0,
  })
}
