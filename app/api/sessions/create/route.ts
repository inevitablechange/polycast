// app/api/sessions/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

type CreateSessionBody = {
  fid: number
  sourceType: 'manual' | 'ai'
  originalLang?: string | null
  originalText: string
  aiKeywords?: string | null
  flockRequestId?: string | null

  imageType?: 'uploaded' | 'generated' | null
  imageUrl?: string | null
  imagePrompt?: string | null
  imageMetadata?: Record<string, any> | null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateSessionBody

    // 1) 기본 검증
    if (!body.fid || Number.isNaN(Number(body.fid))) {
      return NextResponse.json(
        { ok: false, error: 'fid is required and must be a number' },
        { status: 400 },
      )
    }

    if (!body.sourceType || !['manual', 'ai'].includes(body.sourceType)) {
      return NextResponse.json(
        { ok: false, error: "sourceType must be 'manual' or 'ai'" },
        { status: 400 },
      )
    }

    if (!body.originalText || !body.originalText.trim()) {
      return NextResponse.json({ ok: false, error: 'originalText is required' }, { status: 400 })
    }

    const fid = Number(body.fid)

    // 2) polycast_sessions에 insert
    const { data, error } = await supabaseAdmin
      .from('polycast_sessions')
      .insert({
        fid,
        source_type: body.sourceType,
        original_lang: body.originalLang ?? null,
        original_text: body.originalText,
        ai_keywords: body.aiKeywords ?? null,
        flock_request_id: body.flockRequestId ?? null,

        image_type: body.imageType ?? null,
        image_url: body.imageUrl ?? null,
        image_prompt: body.imagePrompt ?? null,
        image_metadata: body.imageMetadata ?? null,

        status: 'active',
      })
      .select('id') // 새로 생성된 session id만 가져오기
      .single()

    if (error) {
      console.error('[sessions/create] insert error', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      sessionId: data?.id,
    })
  } catch (e: any) {
    console.error('[sessions/create] unexpected error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
