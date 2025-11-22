import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

type LogCastBody = {
  fid: number
  sessionId: number | null
  translationId?: number | null
  targetLang: string
  castHash?: string | null
  castUrl?: string | null
  client: string
  status: 'success' | 'failed'
  errorMessage?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LogCastBody

    if (!body.fid || Number.isNaN(Number(body.fid))) {
      return NextResponse.json(
        { ok: false, error: 'fid is required and must be a number' },
        { status: 400 },
      )
    }
    if (!body.targetLang) {
      return NextResponse.json({ ok: false, error: 'targetLang is required' }, { status: 400 })
    }
    if (!body.client) {
      return NextResponse.json({ ok: false, error: 'client is required' }, { status: 400 })
    }
    if (!['success', 'failed'].includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: "status must be 'success' or 'failed'" },
        { status: 400 },
      )
    }

    const fid = Number(body.fid)
    const sessionId = body.sessionId ? Number(body.sessionId) : null
    const translationId = body.translationId ? Number(body.translationId) : null

    const { error } = await supabaseAdmin.from('cast_logs').insert({
      fid,
      session_id: sessionId,
      translation_id: translationId,
      target_lang: body.targetLang,
      cast_hash: body.castHash ?? null,
      cast_url: body.castUrl ?? null,
      client: body.client,
      status: body.status,
      error_message: body.errorMessage ?? null,
      posted_at: body.status === 'success' ? new Date().toISOString() : null,
    })

    if (error) {
      console.error('[log-cast] insert error', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // (옵션) 번역 상태 업데이트
    if (translationId && body.status === 'success') {
      const { error: updateError } = await supabaseAdmin
        .from('polycast_translations')
        .update({ status: 'posted' })
        .eq('id', translationId)

      if (updateError) {
        console.warn('[log-cast] failed to update translation status', updateError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[log-cast] unexpected error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
