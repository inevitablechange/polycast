'use client'

import { useState } from 'react'
import { Trophy, Globe, Users } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { UILanguage } from '@/lib/types'

export default function LeaderboardPage() {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en')

  // 더미 데이터
  const topCreators = [
    {
      rank: 1,
      fid: 1234,
      username: 'creator1',
      displayName: 'Global Creator',
      totalCasts: 156,
      totalLanguages: 12,
    },
    {
      rank: 2,
      fid: 5678,
      username: 'creator2',
      displayName: 'Poly Linguist',
      totalCasts: 142,
      totalLanguages: 10,
    },
    {
      rank: 3,
      fid: 9012,
      username: 'creator3',
      displayName: 'World Speaker',
      totalCasts: 128,
      totalLanguages: 9,
    },
  ]

  const allRankings = Array.from({ length: 20 }, (_, i) => ({
    rank: i + 4,
    fid: 1000 + i,
    username: `user${i + 4}`,
    displayName: `Creator ${i + 4}`,
    totalCasts: 100 - i * 2,
    totalLanguages: 8 - Math.floor(i / 3),
  }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header uiLanguage={uiLanguage} onLanguageChange={setUiLanguage} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Leaderboard</h1>

        {/* Top 3 Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {topCreators.map((creator, index) => (
            <div
              key={creator.fid}
              className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center ${
                index === 0 ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {index === 0 && <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />}
              <div className="text-2xl font-bold mb-1">#{creator.rank}</div>
              <div className="font-semibold mb-2">{creator.displayName}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{creator.totalCasts} Casts</div>
                <div>{creator.totalLanguages} Languages</div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <Globe className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">1,234</div>
            <div className="text-sm text-gray-600">Total Casts</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">567</div>
            <div className="text-sm text-gray-600">Active Creators</div>
          </div>
        </div>

        {/* Full Ranking Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold">Full Rankings</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {allRankings.map((entry) => (
              <div
                key={entry.fid}
                className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <div className="w-6 sm:w-8 text-center font-semibold text-gray-500 text-xs sm:text-sm flex-shrink-0">
                    #{entry.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {entry.displayName}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">
                      @{entry.username}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm flex-shrink-0">
                  <div className="text-right">
                    <div className="font-medium">{entry.totalCasts}</div>
                    <div className="text-gray-500 hidden sm:block">Casts</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="font-medium">{entry.totalLanguages}</div>
                    <div className="text-gray-500">Languages</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
