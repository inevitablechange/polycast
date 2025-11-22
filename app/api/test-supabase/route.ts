// app/api/test-supabase/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // 1) 테스트용 유저 한 명 upsert
    const fid = '123456789' // 임의값, 나중에 실제 Farcaster fid로 교체
    const { error: upsertError } = await supabaseAdmin.from('users').upsert(
      {
        fid,
        username: 'test_user',
        display_name: 'Test User',
      },
      {
        onConflict: 'fid',
      },
    )

    if (upsertError) {
      console.error(upsertError)
      return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })
    }

    // 2) USERS 테이블에서 몇 개 조회
    const { data, error } = await supabaseAdmin.from('users').select('*').limit(5)

    if (error) {
      console.error(error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, users: data })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
