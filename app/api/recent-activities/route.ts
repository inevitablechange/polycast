import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fidParam = searchParams.get('fid')
    const limitParam = searchParams.get('limit')

    if (!fidParam || Number.isNaN(Number(fidParam))) {
      return NextResponse.json(
        { ok: false, error: 'fid query param is required and must be a number' },
        { status: 400 },
      )
    }

    const fid = Number(fidParam)
    const limit = limitParam ? Math.min(Number(limitParam), 100) : 20

    const { data, error } = await supabaseAdmin
      .from('cast_logs')
      .select(
        `
        id,
        target_lang,
        cast_url,
        posted_at,
        status,
        polycast_sessions:session_id (
          id,
          original_text,
          image_url
        ),
        polycast_translations:translation_id (
          id,
          translated_text,
          edited_text
        )
      `,
      )
      .eq('fid', fid)
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[recent-activities] select error', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const activities = (data ?? []).map((row: any) => ({
      id: row.id,
      targetLang: row.target_lang,
      castUrl: row.cast_url,
      postedAt: row.posted_at,
      status: row.status,
      originalText: row.polycast_sessions?.original_text ?? null,
      imageUrl: row.polycast_sessions?.image_url ?? null,
      translatedText:
        row.polycast_translations?.edited_text ??
        row.polycast_translations?.translated_text ??
        null,
    }))

    return NextResponse.json({ ok: true, data: activities })
  } catch (e: any) {
    console.error('[recent-activities] unexpected error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
