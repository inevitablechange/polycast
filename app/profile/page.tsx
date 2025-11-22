'use client'

import { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { ExternalLink, BarChart3 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { UILanguage, RecentActivity, Language, LANGUAGES } from '@/lib/types'
import { getActivities } from '@/lib/storage'

export default function ProfilePage() {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en')
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [userInfo, setUserInfo] = useState<{
    fid?: number
    username?: string
    displayName?: string
    pfpUrl?: string
  }>({})

  useEffect(() => {
    // Recent Activities 로드
    setActivities(getActivities())

    // 사용자 정보 가져오기
    sdk.context
      .then((context) => {
        if (context?.user) {
          setUserInfo({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl || undefined,
          })
        }
      })
      .catch(console.error)
  }, [])

  // 통계 계산
  const stats = {
    totalCasts: activities.length,
    totalTranslations: activities.reduce((sum, act) => sum + act.languages.length, 0),
    imagesPosted: activities.filter((act) => act.imageUrl).length,
    topLanguages: (() => {
      const langCount: Record<Language, number> = {} as Record<Language, number>
      activities.forEach((act) => {
        act.languages.forEach((lang) => {
          langCount[lang] = (langCount[lang] || 0) + 1
        })
      })
      return Object.entries(langCount)
        .map(([lang, count]) => ({ language: lang as Language, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })(),
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleViewCast = async (hash?: string) => {
    if (hash) {
      try {
        await sdk.actions.openUrl(`https://warpcast.com/~/conversations/${hash}`)
      } catch (error) {
        console.error('Failed to open cast:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header uiLanguage={uiLanguage} onLanguageChange={setUiLanguage} />
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
            Global Stats
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalCasts}</div>
              <div className="text-sm text-gray-600">Total Casts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalTranslations}</div>
              <div className="text-sm text-gray-600">Total Translations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.imagesPosted}</div>
              <div className="text-sm text-gray-600">Images Posted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.topLanguages.length}</div>
              <div className="text-sm text-gray-600">Languages Used</div>
            </div>
          </div>

          {/* Top Languages */}
          {stats.topLanguages.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Top Languages</h4>
              <div className="flex flex-wrap gap-2">
                {stats.topLanguages.map(({ language, count }) => (
                  <div key={language} className="px-3 py-1 bg-purple-50 rounded-full text-sm">
                    <span className="mr-1">{LANGUAGES[language].flag}</span>
                    {LANGUAGES[language].name} ({count})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold">Recent Activities</h3>
          </div>
          {activities.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
              No activities yet. Start creating casts to see them here!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
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
                        {activity.originalText.substring(0, 100)}
                        {activity.originalText.length > 100 ? '...' : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <span className="text-xs text-gray-500">Languages:</span>
                        {activity.languages.map((lang) => (
                          <span key={lang} className="text-xs">
                            {LANGUAGES[lang].flag} {LANGUAGES[lang].name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-gray-500">
                          Posted: {formatTimeAgo(activity.timestamp)}
                        </span>
                        <button
                          onClick={() => handleViewCast(activity.castHashes?.[0])}
                          className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          View Cast
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
