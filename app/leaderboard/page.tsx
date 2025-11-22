'use client'

import { useState, useEffect } from 'react'
import { Trophy, Globe, Users } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getTranslation } from '@/lib/i18n'
import { useUiLanguage } from '@/components/UiLanguageProvider'

// API에서 내려오는 구조와 동일하게 타입 정의
type LeaderboardEntry = {
  fid: number
  username: string | null
  displayName: string | null
  pfpUrl: string | null
  totalCasts: number
  totalLanguages: number
  lastPostedAt: string | null
}

export default function LeaderboardPage() {
  const { uiLanguage } = useUiLanguage()
  const t = getTranslation(uiLanguage)

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard')
        const json = await res.json()
        if (json.ok && Array.isArray(json.data)) {
          setLeaderboard(json.data)
        } else {
          console.error('Failed to load leaderboard:', json.error)
        }
      } catch (e) {
        console.error('/api/leaderboard fetch error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
    )
  }

  // ----------------------------
  // 랭킹 데이터 분리
  // ----------------------------
  const topCreators = leaderboard.slice(0, 3)
  const allRankings = leaderboard.slice(3).map((entry, index) => ({
    ...entry,
    rank: index + 4,
  }))

  // ----------------------------
  // 글로벌 통계 계산
  // ----------------------------
  const totalCasts = leaderboard.reduce((sum, u) => sum + u.totalCasts, 0)
  const activeCreators = leaderboard.length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
          {t.leaderboardTitle}
        </h1>

        {/* Top 3 Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {topCreators.map((creator, idx) => {
            const rank = idx + 1

            const medal =
              rank === 1 ? (
                <span style={{ fontSize: '2.5rem' }}>🥇</span>
              ) : rank === 2 ? (
                <span style={{ fontSize: '2.5rem' }}>🥈</span>
              ) : (
                <span style={{ fontSize: '2.5rem' }}>🥉</span>
              )

            return (
              <div
                key={creator.fid}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center flex flex-col items-center"
              >
                {medal}
                <div className="font-semibold text-gray-800 mb-1">
                  {creator.displayName || creator.username || `FID ${creator.fid}`}
                </div>
                <div className="flex gap-2 text-gray-500 text-xs">
                  <span>
                    {creator.totalCasts} {t.casts}
                  </span>
                  <span>&bull;</span>
                  <span>
                    {creator.totalLanguages} {t.langsShort}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <Globe className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalCasts}</div>
            <div className="text-sm text-gray-600">{t.totalCasts}</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{activeCreators}</div>
            <div className="text-sm text-gray-600">{t.activeCreators}</div>
          </div>
        </div>

        {/* Full Ranking Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold">{t.fullRankings}</h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">{t.noActivities}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allRankings.map((entry) => (
                <div
                  key={entry.fid}
                  className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="w-6 sm:w-8 text-center font-semibold text-gray-500 text-xs sm:text-sm">
                      #{entry.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {entry.displayName || entry.username || `FID ${entry.fid}`}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        @{entry.username || 'unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm">
                    <div className="text-right">
                      <div className="font-medium">{entry.totalCasts}</div>
                      <div className="text-gray-500 hidden sm:block">{t.casts}</div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="font-medium">{entry.totalLanguages}</div>
                      <div className="text-gray-500">{t.languages}</div>
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
