'use client'

import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { FileText, MessageSquare, User, ExternalLink } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { UILanguage } from '@/lib/types'

export default function SettingsPage() {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en')

  const handleOpenUrl = async (url: string) => {
    try {
      await sdk.actions.openUrl(url)
    } catch (error) {
      console.error('Failed to open URL:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header uiLanguage={uiLanguage} onLanguageChange={setUiLanguage} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Settings</h1>

        <div className="space-y-3 sm:space-y-4">
          {/* About */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">About</h2>
            </div>
            <p className="text-gray-600 mb-4">
              PolyCast is a Base Mini App that helps you create and share casts in multiple
              languages. One cast, many languages.
            </p>
            <button
              onClick={() => handleOpenUrl('https://docs.polycast.com')}
              className="text-purple-600 hover:text-purple-700 flex items-center gap-2 text-sm"
            >
              View Documentation
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Feedback</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Have suggestions or found a bug? We'd love to hear from you!
            </p>
            <button
              onClick={() => handleOpenUrl('https://forms.gle/feedback')}
              className="text-purple-600 hover:text-purple-700 flex items-center gap-2 text-sm"
            >
              Submit Feedback
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Account</h2>
            </div>
            <button
              onClick={() => (window.location.href = '/profile')}
              className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
            >
              View my Profile
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
