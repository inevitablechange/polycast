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

export default function ProfilePage() {
  const { uiLanguage } = useUiLanguage()
  const [activities, setActivities] = useState<RecentActivityFromApi[]>([])
  const [userInfo, setUserInfo] = useState<{
    fid?: number
    username?: string
    displayName?: string
    pfpUrl?: string
  }>({})

  const t = getTranslation(uiLanguage)

  useEffect(() => {
    const init = async () => {
      try {
        const context = await sdk.context
        if (context?.user) {
          const u = context.user
          const nextUserInfo = {
            fid: u.fid,
            username: u.username,
            displayName: u.displayName,
            pfpUrl: u.pfpUrl || undefined,
          }
          setUserInfo(nextUserInfo)

          // fid가 있을 때만 서버에서 최근 활동 불러오기
          if (u.fid) {
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
      await sdk.actions.openUrl(url)
    } catch (error) {
      console.error('Failed to open cast:', error)
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
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            {t.globalStats}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalCasts}</div>
              <div className="text-sm text-gray-600">{t.totalCasts}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalTranslations}</div>
              <div className="text-sm text-gray-600">{t.totalTranslationsLabel}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.imagesPosted}</div>
              <div className="text-sm text-gray-600">{t.imagesPostedLabel}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.topLanguages.length}</div>
              <div className="text-sm text-gray-600">{t.languagesUsedLabel}</div>
            </div>
          </div>

          {/* Top Languages */}
          {stats.topLanguages.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Top Languages</h4>
              <div className="flex flex-wrap gap-2">
                {stats.topLanguages.map(({ language, count }) => {
                  const langCode = language as Language
                  const langMeta = LANGUAGES[langCode]
                  const label =
                    langMeta && languageNames[uiLanguage][langCode]
                      ? languageNames[uiLanguage][langCode]
                      : language
                  return (
                    <div key={language} className="px-3 py-1 bg-purple-50 rounded-full text-sm">
                      {langMeta && <span className="mr-1">{langMeta.flag}</span>}
                      {label} ({count})
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
