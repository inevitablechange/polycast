'use client'

import { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { ExternalLink, BarChart3 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Language, LANGUAGES } from '@/lib/types'
import { getTranslation, languageNames } from '@/lib/i18n'
import { useUiLanguage } from '@/components/UiLanguageProvider'

// /api/recent-activities 에서 내려오는 데이터 형태와 맞춰서 타입 정의
type RecentActivityFromApi = {
  id: number
  targetLang: string
  castUrl: string | null
  postedAt: string | null
  status: string
  originalText: string | null
  imageUrl: string | null
  translatedText: string | null
}

// ✅ /api/leaderboard 타입
type LeaderboardEntry = {
  fid: number
  username: string | null
  displayName: string | null
  pfpUrl: string | null
  totalCasts: number
  totalLanguages: number
  lastPostedAt: string | null
}

export default function ProfilePage() {
  const { uiLanguage } = useUiLanguage()
  const [activities, setActivities] = useState<RecentActivityFromApi[]>([])
  const [userInfo, setUserInfo] = useState<{
    fid?: number
    username?: string
    displayName?: string
    pfpUrl?: string
  }>({})

  // ✅ 내 순위 + 전체 참가자 수
  const [myRank, setMyRank] = useState<number | null>(null)
  const [totalCreators, setTotalCreators] = useState<number | null>(null)

  const t = getTranslation(uiLanguage)

  useEffect(() => {
    const init = async () => {
      try {
        const context = await sdk.context
        if (context?.user) {
          const u = context.user as {
            fid?: number
            username?: string
            displayName?: string
            pfpUrl?: string
          }

          const nextUserInfo = {
            fid: u.fid,
            username: u.username,
            displayName: u.displayName,
            pfpUrl: u.pfpUrl || undefined,
          }
          setUserInfo(nextUserInfo)

          // fid가 있을 때만 서버에서 최근 활동 & 리더보드 불러오기
          if (u.fid) {
            // 최근 활동
            try {
              const res = await fetch(`/api/recent-activities?fid=${u.fid}&limit=50`)
              const json = await res.json()
              if (json.ok && Array.isArray(json.data)) {
                setActivities(json.data as RecentActivityFromApi[])
              } else {
                console.error('Failed to load recent activities:', json.error)
              }
            } catch (e) {
              console.error('Error fetching /api/recent-activities:', e)
            }

            // ✅ 리더보드 불러와서 내 순위 계산
            try {
              const lbRes = await fetch('/api/leaderboard')
              const lbJson = await lbRes.json()
              if (lbJson.ok && Array.isArray(lbJson.data)) {
                const list = lbJson.data as LeaderboardEntry[]
                setTotalCreators(list.length)

                const index = list.findIndex((entry) => entry.fid === u.fid)
                if (index !== -1) {
                  setMyRank(index + 1) // 랭크는 1부터 시작
                } else {
                  setMyRank(null)
                }
              } else {
                console.error('Failed to load leaderboard in profile:', lbJson.error)
              }
            } catch (e) {
              console.error('/api/leaderboard fetch error (profile):', e)
            }
          }
        }
      } catch (e) {
        console.error('Error getting sdk.context:', e)
      }
    }

    init()
  }, [])

  // 통계 계산 (DB 기반 구조로 변경)
  const stats = {
    totalCasts: activities.length,
    // 번역 횟수 = 언어별 캐스트 수와 동일하게 간주
    totalTranslations: activities.length,
    imagesPosted: activities.filter((act) => !!act.imageUrl).length,
    topLanguages: (() => {
      const langCount: Record<string, number> = {}
      activities.forEach((act) => {
        if (act.targetLang) {
          langCount[act.targetLang] = (langCount[act.targetLang] || 0) + 1
        }
      })
      return Object.entries(langCount)
        .map(([lang, count]) => ({ language: lang, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })(),
  }

  // 상위 몇 %인지 (대략)
  const topPercent = myRank && totalCreators ? Math.round((myRank / totalCreators) * 100) : null

  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return '-'
    const ts = new Date(isoString).getTime()
    if (Number.isNaN(ts)) return '-'

    const seconds = Math.floor((Date.now() - ts) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleViewCast = async (url?: string | null) => {
    if (!url) return
    try {
      await sdk.actions.openUrl({ url })
    } catch (error) {
      console.error('Failed to open cast:', error)
    }
  }

  // 📤 내 Global Stats를 "텍스트만" 캐스트로 공유
  const handleShareStats = async () => {
    try {
      const username = userInfo.username || 'anonymous'

      const textLines = [
        '📊 My PolyCast Global Stats',
        '',
        `@${username}`,
        `Total Casts: ${stats.totalCasts}`,
        `Total Translations: ${stats.totalTranslations}`,
        `Images Posted: ${stats.imagesPosted}`,
        `Languages Used: ${stats.topLanguages.length}`,
        myRank && totalCreators
          ? `Rank: #${myRank} / ${totalCreators}`
          : myRank
          ? `Rank: #${myRank}`
          : '',
        '',
        'Cast once, go global with PolyCast.',
      ].filter(Boolean)

      const text = textLines.join('\n')

      await sdk.actions.composeCast({
        text,
        embeds: [],
      })
    } catch (e) {
      console.error('Failed to share stats:', e)
      alert('Failed to open composer. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* User Profile */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
          <div className="flex items-center gap-4 mb-6">
            {userInfo.pfpUrl ? (
              <img src={userInfo.pfpUrl} alt="Profile" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{userInfo.displayName || 'Anonymous'}</h2>
              <p className="text-gray-600">@{userInfo.username || 'unknown'}</p>
              {userInfo.fid && <p className="text-sm text-gray-500">FID: {userInfo.fid}</p>}
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
          {/* 헤더 영역: 타이틀 + 공유 버튼 */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold">{t.globalStats}</h3>
            </div>
            <button
              onClick={handleShareStats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors"
            >
              📤 <span>Share my stats</span>
            </button>
          </div>

          {/* 숫자 카드 4개 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div className="rounded-xl bg-purple-50 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[11px] sm:text-xs text-purple-700 font-medium uppercase tracking-wide">
                {t.totalCasts}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-purple-900">
                {stats.totalCasts}
              </div>
            </div>
            <div className="rounded-xl bg-indigo-50 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[11px] sm:text-xs text-indigo-700 font-medium uppercase tracking-wide">
                {t.totalTranslationsLabel}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-indigo-900">
                {stats.totalTranslations}
              </div>
            </div>
            <div className="rounded-xl bg-sky-50 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[11px] sm:text-xs text-sky-700 font-medium uppercase tracking-wide">
                {t.imagesPostedLabel}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-sky-900">
                {stats.imagesPosted}
              </div>
            </div>
            <div className="rounded-xl bg-purple-50 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[11px] sm:text-xs text-purple-700 font-medium uppercase tracking-wide">
                {t.languagesUsedLabel}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-purple-900">
                {stats.topLanguages.length}
              </div>
            </div>
          </div>

          {/* ✅ 내 리더보드 순위 카드 (조금 더 컴팩트하게) */}
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs text-purple-700 font-medium">
                  {t.myRankLabel || 'My Rank'}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-900 leading-tight">
                  {myRank ? `#${myRank}` : '-'}
                </div>
              </div>
              {totalCreators && (
                <div className="text-right text-[11px] sm:text-xs text-purple-700">
                  {t.outOfLabel
                    ? t.outOfLabel.replace('{total}', String(totalCreators))
                    : `out of ${totalCreators} creators`}
                  {topPercent && (
                    <div className="mt-1 text-[10px] sm:text-[11px] text-purple-600">
                      Top&nbsp;
                      <span className="font-semibold">{topPercent}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {myRank && totalCreators && (
              <div className="mt-1">
                <div className="h-1.5 w-full rounded-full bg-purple-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-purple-500 via-indigo-500 to-sky-500"
                    style={{
                      width: `${Math.max(8, 100 - (myRank / totalCreators) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold">{t.recentActivities}</h3>
          </div>
          {activities.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
              {t.noActivities}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => {
                const langCode = activity.targetLang as Language
                const langMeta = LANGUAGES[langCode]
                const langLabel =
                  langMeta && languageNames[uiLanguage][langCode]
                    ? languageNames[uiLanguage][langCode]
                    : activity.targetLang

                return (
                  <div key={activity.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-3 sm:gap-4">
                      {activity.imageUrl && (
                        <img
                          src={activity.imageUrl}
                          alt="Thumbnail"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-700 mb-2 line-clamp-2">
                          {(activity.originalText || '').substring(0, 100)}
                          {activity.originalText && activity.originalText.length > 100 ? '...' : ''}
                        </p>

                        {/* 언어 태그 (단일 언어) */}
                        {activity.targetLang && (
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <span className="text-xs text-gray-500">{t.languages}:</span>
                            <span className="text-xs">
                              {langMeta && <span className="mr-1">{langMeta.flag}</span>}
                              {langLabel}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs text-gray-500">
                            {t.postedLabel}: {formatTimeAgo(activity.postedAt)}
                          </span>
                          {activity.castUrl && (
                            <button
                              onClick={() => handleViewCast(activity.castUrl)}
                              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                              {t.viewCast}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
