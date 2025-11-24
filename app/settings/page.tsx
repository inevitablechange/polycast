'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { FileText, MessageSquare, User, ExternalLink } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getTranslation } from '@/lib/i18n'
import { useUiLanguage } from '@/components/UiLanguageProvider'

export default function SettingsPage() {
  const { uiLanguage } = useUiLanguage()
  const t = getTranslation(uiLanguage)

  const handleOpenUrl = async (url: string) => {
    try {
      await sdk.actions.openUrl(url)
    } catch (error) {
      console.error('Failed to open URL:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
          {t.settingsTitle}
        </h1>

        <div className="space-y-3 sm:space-y-4">
          {/* About */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-[#a78bfa]" />
              <h2 className="text-lg font-semibold">{t.aboutTitle}</h2>
            </div>
            <p className="text-gray-600 mb-4">{t.aboutDescription}</p>
            <button
              onClick={() => handleOpenUrl('https://docs.polycast.com')}
              className="text-[#a78bfa] hover:text-[#9333ea] flex items-center gap-2 text-sm"
            >
              {t.viewDocs}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-[#a78bfa]" />
              <h2 className="text-lg font-semibold">{t.feedbackTitle}</h2>
            </div>
            <p className="text-gray-600 mb-4">{t.feedbackDescription}</p>
            <button
              onClick={() => handleOpenUrl('https://forms.gle/feedback')}
              className="text-[#a78bfa] hover:text-[#9333ea] flex items-center gap-2 text-sm"
            >
              {t.submitFeedback}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
