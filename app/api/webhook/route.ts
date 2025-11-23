import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Webhook Event]', body)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Webhook Error]', err)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Webhook alive' })
}
