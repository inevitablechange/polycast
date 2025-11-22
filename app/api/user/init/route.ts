// app/api/user/init/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

type InitUserBody = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  wallet?: string
  preferredLang?: string
  favoriteLangs?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InitUserBody

    // 1) 기본 검증
    if (!body.fid || Number.isNaN(Number(body.fid))) {
      return NextResponse.json(
        { ok: false, error: 'fid is required and must be a number' },
        { status: 400 },
      )
    }

    const fid = Number(body.fid)

    // 2) users upsert (fid 기준)
    const { error: userError } = await supabaseAdmin.from('users').upsert(
      {
        fid,
        username: body.username ?? null,
        display_name: body.displayName ?? null,
        pfp_url: body.pfpUrl ?? null,
        wallet: body.wallet ?? null,
      },
      {
        onConflict: 'fid',
      },
    )

    if (userError) {
      console.error('[user/init] users upsert error', userError)
      return NextResponse.json({ ok: false, error: userError.message }, { status: 500 })
    }

    // 3) user_settings upsert (옵션)
    if (body.preferredLang || (body.favoriteLangs && body.favoriteLangs.length > 0)) {
      const { error: settingsError } = await supabaseAdmin.from('user_settings').upsert(
        {
          fid,
          preferred_lang: body.preferredLang ?? null,
          favorite_langs: body.favoriteLangs ?? null,
        },
        {
          onConflict: 'fid',
        },
      )

      if (settingsError) {
        console.error('[user/init] user_settings upsert error', settingsError)
        // 설정은 필수는 아니니까 500으로 안 죽이고 경고만 줄 수도 있음
        return NextResponse.json({ ok: false, error: settingsError.message }, { status: 500 })
      }
    }

    // 4) 최종 응답 (필요하면 user/settings를 다시 select해서 내려줘도 됨)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[user/init] unexpected error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
