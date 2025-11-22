import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

type SaveTranslationsBody = {
  sessionId: number
  translations: {
    targetLang: string
    translatedText?: string
    editedText?: string
    isEdited?: boolean
    orderIndex?: number
  }[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveTranslationsBody

    if (!body.sessionId || Number.isNaN(Number(body.sessionId))) {
      return NextResponse.json(
        { ok: false, error: 'sessionId is required and must be a number' },
        { status: 400 },
      )
    }

    if (!body.translations || body.translations.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'translations array is required' },
        { status: 400 },
      )
    }

    const rows = body.translations.map((t) => ({
      session_id: body.sessionId,
      target_lang: t.targetLang,
      translated_text: t.translatedText ?? null,
      edited_text: t.editedText ?? null,
      is_edited: t.isEdited ?? !!t.editedText,
      order_index: t.orderIndex ?? null,
    }))

    const { error } = await supabaseAdmin.from('polycast_translations').upsert(rows, {
      onConflict: 'session_id,target_lang',
    })

    if (error) {
      console.error('[translations/save] upsert error', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[translations/save] unexpected error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
