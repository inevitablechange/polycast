import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Number(limitParam), 100) : 50

    // 1) 성공한 캐스트 로그들을 가져온다 (필요시 기간 필터도 추가 가능)
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('cast_logs')
      .select('fid, target_lang, posted_at, status')
      .eq('status', 'success')

    if (logsError) {
      console.error('[leaderboard] cast_logs error', logsError)
      return NextResponse.json({ ok: false, error: logsError.message }, { status: 500 })
    }

    // 2) JS로 fid별 aggregate
    type Agg = {
      fid: number
      totalCasts: number
      languages: Set<string>
      lastPostedAt: string | null
    }

    const byUser = new Map<number, Agg>()

    for (const log of logs ?? []) {
      const fid = Number(log.fid)
      if (!byUser.has(fid)) {
        byUser.set(fid, {
          fid,
          totalCasts: 0,
          languages: new Set<string>(),
          lastPostedAt: null,
        })
      }
      const agg = byUser.get(fid)!
      agg.totalCasts += 1
      if (log.target_lang) agg.languages.add(log.target_lang)
      if (log.posted_at) {
        if (!agg.lastPostedAt || new Date(log.posted_at) > new Date(agg.lastPostedAt)) {
          agg.lastPostedAt = log.posted_at
        }
      }
    }

    // 3) fid 목록으로 users 정보 가져오기
    const fids = Array.from(byUser.keys())
    if (fids.length === 0) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('fid, username, display_name, pfp_url')
      .in('fid', fids)

    if (usersError) {
      console.error('[leaderboard] users error', usersError)
      return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 })
    }

    const userMap = new Map<number, (typeof users)[number]>()
    for (const u of users ?? []) {
      userMap.set(Number(u.fid), u)
    }

    // 4) aggregate + 유저 정보 합치고 정렬
    const rows = Array.from(byUser.values())
      .map((agg) => {
        const user = userMap.get(agg.fid)
        return {
          fid: agg.fid,
          username: user?.username ?? null,
          displayName: user?.display_name ?? null,
          pfpUrl: user?.pfp_url ?? null,
          totalCasts: agg.totalCasts,
          totalLanguages: agg.languages.size,
          lastPostedAt: agg.lastPostedAt,
        }
      })
      .sort((a, b) => {
        if (b.totalCasts !== a.totalCasts) return b.totalCasts - a.totalCasts
        if (b.totalLanguages !== a.totalLanguages) return b.totalLanguages - a.totalLanguages
        if (a.lastPostedAt && b.lastPostedAt) {
          return new Date(b.lastPostedAt).getTime() - new Date(a.lastPostedAt).getTime()
        }
        return 0
      })
      .slice(0, limit)

    return NextResponse.json({ ok: true, data: rows })
  } catch (e: any) {
    console.error('[leaderboard] unexpected error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
