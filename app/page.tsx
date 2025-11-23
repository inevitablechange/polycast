'use client'

import { useState, useEffect, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { usePathname } from 'next/navigation'
import {
  Globe,
  Sparkles,
  Upload,
  Loader2,
  Eye,
  Trash2,
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  Check,
  FileText,
  Languages,
  Send,
} from 'lucide-react'
import { LANGUAGES, Language, TranslationResult, RecentActivity } from '@/lib/types'
import { getTranslation, getLanguageName } from '@/lib/i18n'
import { saveActivity } from '@/lib/storage'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useUiLanguage } from '@/components/UiLanguageProvider'

type MiniAppUser = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

// Basic client-side language detection using Unicode script heuristics.
const detectLanguage = (text: string): Language | null => {
  if (!text || !text.trim()) return null

  const hasHangul = /[\uAC00-\uD7A3]/.test(text)
  const hasHiragana = /[\u3040-\u309F]/.test(text)
  const hasKatakana = /[\u30A0-\u30FF]/.test(text)
  const hasCJK = /[\u4E00-\u9FFF]/.test(text)
  const hasArabic = /[\u0600-\u06FF]/.test(text)
  const hasDevanagari = /[\u0900-\u097F]/.test(text)
  const hasThai = /[\u0E00-\u0E7F]/.test(text)
  const hasCyrillic = /[\u0400-\u04FF]/.test(text)
  const hasLatin = /[A-Za-z]/.test(text)

  if (hasHangul) return 'ko'
  if (hasHiragana || hasKatakana) return 'ja'
  // If CJK characters and no Japanese kana, prefer Chinese
  if (hasCJK && !hasHiragana && !hasKatakana) return 'zh'
  if (hasArabic) return 'ar'
  if (hasDevanagari) return 'hi'
  if (hasThai) return 'th'
  if (hasCyrillic) return 'ru'

  if (hasLatin) {
    const lower = text.toLowerCase()
    if (/[¿¡\u00BF]/.test(text) || /\b(que|para|por|el|la|los|las|una)\b/.test(lower)) return 'es'
    if (/[çâêàéèùôîûëäöü]/.test(lower) || /\b(le|la|et|les|des|une|que)\b/.test(lower)) return 'fr'
    if (/\b(de|und|das|die|ist)\b/.test(lower)) return 'de'
    return 'en'
  }

  return null
}

export default function Home() {
  const { uiLanguage } = useUiLanguage()
  const pathname = usePathname()
  const [currentStep, setCurrentStep] = useState<'input' | 'languages' | 'posting'>('input')
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>('manual')
  const [originalText, setOriginalText] = useState('')
  const [topic, setTopic] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [translations, setTranslations] = useState<TranslationResult>({})
  const [editableTranslations, setEditableTranslations] = useState<
    Partial<Record<Language, string>>
  >({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [miniAppUser, setMiniAppUser] = useState<MiniAppUser | null>(null)
  const [userName, setUserName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isInMiniApp, setIsInMiniApp] = useState(false)
  const [fid, setFid] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)

  const t = getTranslation(uiLanguage)

  const sectionCardClass =
    'bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm'

  const displayTranslations = translations
  const [originalLang, setOriginalLang] = useState<Language | null>(null)

  useEffect(() => {
    const initMiniAppUser = async () => {
      try {
        const miniAppStatus = await sdk.isInMiniApp()
        setIsInMiniApp(miniAppStatus)

        if (!miniAppStatus) {
          return
        }

        const context = await sdk.context
        const user = context.user as MiniAppUser

        if (!user?.fid) return

        setMiniAppUser(user)
        setUserName(user.username || '')
        setDisplayName(user.displayName || '')
        setFid(user.fid)

        try {
          const initResponse = await fetch('/api/user/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: user.fid,
              username: user.username,
              displayName: user.displayName,
              pfpUrl: user.pfpUrl,
            }),
          })

          if (!initResponse.ok) {
            console.warn('/api/user/init HTTP error:', initResponse.status)
            return
          }

          const contentType = initResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const initData = await initResponse.json()
            if (!initData.ok) {
              console.warn('/api/user/init error:', initData.error)
            }
          }
        } catch (initError) {
          console.warn('Failed to initialize user:', initError)
        }

        try {
          await sdk.actions.ready()
        } catch (e) {
          console.warn('sdk.actions.ready() failed or not supported', e)
        }
      } catch (error) {
        console.error('Error initializing mini app user:', error)
      }
    }

    initMiniAppUser()
  }, [])

  // Reset function
  const resetToHome = () => {
    setCurrentStep('input')
    setOriginalText('')
    setTopic('')
    setSelectedLanguages([])
    setImageUrl('')
    setFileName('')
    setTranslations({})
    setEditableTranslations({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to input step and clear input when navigating to home page
  useEffect(() => {
    if (pathname === '/') {
      resetToHome()
    }
  }, [pathname])

  // Listen for custom event to reset when logo is clicked on same page
  useEffect(() => {
    const handleResetToHome = () => {
      resetToHome()
    }

    window.addEventListener('resetToHome', handleResetToHome)
    return () => {
      window.removeEventListener('resetToHome', handleResetToHome)
    }
  }, [])

  const previewRef = useRef<HTMLTextAreaElement | null>(null)

  const adjustPreviewHeight = () => {
    const el = previewRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = 320 // px
    const newHeight = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => {
    setOriginalLang(detectLanguage(originalText))
    adjustPreviewHeight()

    if (originalText.trim() && Object.keys(translations).length > 0) {
      setTranslations({})
      setEditableTranslations({})
      // 필요하면 세션도 리셋:
      // setSessionId(null)
    }
  }, [originalText])

  // 세션이 없으면 /api/sessions/create로 하나 만드는 헬퍼
  const createSessionIfNeeded = async (): Promise<number | null> => {
    if (sessionId || !fid || !originalText.trim()) return sessionId

    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          sourceType: inputMode, // 'manual' | 'ai'
          originalLang,
          originalText,
          imageType: imageUrl ? 'uploaded' : null,
          imageUrl: imageUrl || null,
        }),
      })

      if (!res.ok) {
        console.error('/api/sessions/create HTTP error:', res.status, res.statusText)
        return null
      }

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('/api/sessions/create: Response is not JSON')
        return null
      }

      const json = await res.json()
      if (!json.ok) {
        console.error('/api/sessions/create error:', json.error)
        return null
      }

      if (json.sessionId) {
        setSessionId(json.sessionId)
        return json.sessionId as number
      }

      return null
    } catch (e) {
      console.error('Failed to create session:', e)
      return null
    }
  }

  const handleGenerateOriginal = async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-original', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style: 'casual' }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON')
      }

      const data = await response.json()
      if (data.originalText) {
        setOriginalText(data.originalText)
      }
    } catch (error) {
      console.error('Generate error:', error)
      alert('Failed to generate text. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // 텍스트 입력 완료 후 다음 단계로 이동
  const handleContinueToLanguages = () => {
    if (originalText.trim()) {
      setCurrentStep('languages')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setImageUrl(result)
        setFileName(file.name)
      }
    }
    reader.readAsDataURL(file)

    setIsUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
          } catch (parseError) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }

      const data = await response.json()
      if (data.url) {
        setImageUrl(data.url)
        setFileName(data.fileName)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setFileName('')
    setIsUploading(false)
  }

  const topicRef = useRef<HTMLTextAreaElement | null>(null)

  const adjustTopicHeight = () => {
    const el = topicRef.current
    if (!el) return
    // reset to calculate scrollHeight correctly
    el.style.height = 'auto'
    const maxHeight = 160 // px, adjust as needed
    const newHeight = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => {
    adjustTopicHeight()
  }, [topic])

  const handleTranslate = async () => {
    if (!originalText.trim() || selectedLanguages.length === 0) return

    setIsTranslating(true)
    try {
      // 1) 세션 없으면 먼저 생성
      const currentSessionId = await createSessionIfNeeded()
      const effectiveSessionId = currentSessionId ?? sessionId

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          targetLanguages: selectedLanguages,
          style: 'casual',
          sessionId: effectiveSessionId, // 나중에 서버에서 활용 가능
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON')
      }

      const data = await response.json()
      if (data.translations) {
        setTranslations(data.translations)

        const newEditable: Partial<Record<Language, string>> = {}
        selectedLanguages.forEach((lang) => {
          newEditable[lang] = data.translations[lang]?.text || ''
        })
        setEditableTranslations(newEditable)

        // 2) 번역 결과를 Supabase polycast_translations에 저장
        if (effectiveSessionId) {
          try {
            const payload = {
              sessionId: effectiveSessionId,
              translations: selectedLanguages
                .filter((lang) => !!data.translations[lang]?.text)
                .map((lang, idx) => ({
                  targetLang: lang,
                  translatedText: data.translations[lang].text as string,
                  orderIndex: idx,
                })),
            }

            await fetch('/api/translations/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          } catch (e) {
            console.error('Failed to save translations:', e)
          }
        }

        // 번역 완료 후 포스팅 단계로 이동
        setCurrentStep('posting')
      }
    } catch (error) {
      console.error('Translate error:', error)
      alert('Failed to translate. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  const handlePost = async (lang: Language) => {
    const text = editableTranslations[lang] || displayTranslations[lang]?.text
    if (!text) return

    try {
      await sdk.actions.composeCast({
        text,
        embeds: imageUrl ? [imageUrl] : [],
      })

      // 1) Supabase cast_logs에 성공 로그 기록
      try {
        if (fid) {
          await fetch('/api/log-cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid,
              sessionId,
              translationId: null, // 지금은 polycast_translations.id를 모름
              targetLang: lang,
              castHash: null, // composeCast는 hash를 직접 안 줌
              castUrl: null,
              client: 'polycast-mini-app',
              status: 'success',
            }),
          })
        }
      } catch (e) {
        console.error('Failed to log cast (success):', e)
      }

      // 2) 기존 localStorage Recent Activities도 유지
      const activity: RecentActivity = {
        id: Date.now().toString(),
        originalText,
        translations: displayTranslations,
        imageUrl: imageUrl || undefined,
        languages: selectedLanguages,
        timestamp: Date.now(),
      }
      saveActivity(activity)
    } catch (error) {
      console.error('Post error:', error)
      alert('Failed to open composer. Please try again.')

      // composeCast 자체가 실패했을 때도 로그 남기기
      try {
        if (fid) {
          await fetch('/api/log-cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid,
              sessionId,
              translationId: null,
              targetLang: lang,
              castHash: null,
              castUrl: null,
              client: 'polycast-mini-app',
              status: 'failed',
              errorMessage: (error as Error).message ?? 'composeCast failed',
            }),
          })
        }
      } catch (e) {
        console.error('Failed to log cast (failed):', e)
      }
    }
  }

  const handlePostOriginal = async () => {
    const text = originalText
    if (!text) return

    const targetLangForLog = originalLang ?? 'en' // 로그용 언어 코드 fallback

    try {
      await sdk.actions.composeCast({
        text,
        embeds: imageUrl ? [imageUrl] : [],
      })

      // 1) 원문 캐스트도 cast_logs에 기록
      try {
        if (fid) {
          await fetch('/api/log-cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid,
              sessionId,
              translationId: null,
              targetLang: targetLangForLog,
              castHash: null,
              castUrl: null,
              client: 'polycast-mini-app',
              status: 'success',
            }),
          })
        }
      } catch (e) {
        console.error('Failed to log original cast (success):', e)
      }

      const activity: RecentActivity = {
        id: Date.now().toString(),
        originalText,
        translations: displayTranslations,
        imageUrl: imageUrl || undefined,
        languages: selectedLanguages,
        timestamp: Date.now(),
      }
      saveActivity(activity)
    } catch (error) {
      console.error('Post original error:', error)
      alert('Failed to open composer. Please try again.')

      try {
        if (fid) {
          await fetch('/api/log-cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid,
              sessionId,
              translationId: null,
              targetLang: targetLangForLog,
              castHash: null,
              castUrl: null,
              client: 'polycast-mini-app',
              status: 'failed',
              errorMessage: (error as Error).message ?? 'composeCast failed',
            }),
          })
        }
      } catch (e) {
        console.error('Failed to log original cast (failed):', e)
      }
    }
  }

  const handleDeleteCard = (lang: Language) => {
    setSelectedLanguages(selectedLanguages.filter((l) => l !== lang))
    setEditableTranslations((prev) => {
      const newPrev = { ...prev }
      delete newPrev[lang]
      return newPrev
    })
  }

  const toggleLanguage = (lang: Language) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang))
    } else {
      setSelectedLanguages([...selectedLanguages, lang])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* Step Indicator */}
        <div className="mb-6">
          {/* Full Step Indicator - All Screens */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-semibold text-sm sm:text-lg transition-all duration-300 ${
                      currentStep === 'input'
                        ? 'bg-linear-to-br from-[#9333ea] to-[#7c3aed] text-white shadow-lg shadow-[#9333ea]/30 scale-110'
                        : currentStep === 'languages' || currentStep === 'posting'
                        ? 'bg-linear-to-br from-[#a855f7] to-[#9333ea] text-white shadow-md scale-105'
                        : 'bg-gray-200 text-gray-500 scale-100'
                    }`}
                  >
                    {currentStep === 'languages' || currentStep === 'posting' ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                </div>
                <span
                  className={`text-[17px] font-medium transition-all duration-300 text-center ${
                    currentStep === 'input'
                      ? 'bg-linear-to-r from-[#9333ea] to-[#a855f7] bg-clip-text text-transparent font-semibold'
                      : currentStep === 'languages' || currentStep === 'posting'
                      ? 'text-[#9333ea] font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  {t.step1Input}
                </span>
              </div>

              {/* Connector Line */}
              <div className="relative flex-1 max-w-[60px] sm:max-w-[80px]">
                <div className="h-0.5 sm:h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-in-out ${
                      currentStep === 'languages' || currentStep === 'posting'
                        ? 'bg-linear-to-r from-[#9333ea] via-[#a855f7] to-[#60a5fa] w-full'
                        : 'w-0'
                    }`}
                  ></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-semibold text-sm sm:text-lg transition-all duration-300 ${
                      currentStep === 'languages'
                        ? 'bg-linear-to-br from-[#a855f7] to-[#60a5fa] text-white shadow-lg shadow-[#a855f7]/30 scale-110'
                        : currentStep === 'posting'
                        ? 'bg-linear-to-br from-[#a855f7] to-[#9333ea] text-white shadow-md scale-105'
                        : 'bg-gray-200 text-gray-500 scale-100'
                    }`}
                  >
                    {currentStep === 'posting' ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Languages className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                </div>
                <span
                  className={`text-[17px] font-medium transition-all duration-300 text-center ${
                    currentStep === 'languages'
                      ? 'bg-linear-to-r from-[#a855f7] to-[#60a5fa] bg-clip-text text-transparent font-semibold'
                      : currentStep === 'posting'
                      ? 'text-[#a855f7] font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  {t.step2Language}
                </span>
              </div>

              {/* Connector Line */}
              <div className="relative flex-1 max-w-[60px] sm:max-w-[80px]">
                <div className="h-0.5 sm:h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-in-out ${
                      currentStep === 'posting'
                        ? 'bg-linear-to-r from-[#a855f7] via-[#60a5fa] to-[#3b82f6] w-full'
                        : 'w-0'
                    }`}
                  ></div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-semibold text-sm sm:text-lg transition-all duration-300 ${
                      currentStep === 'posting'
                        ? 'bg-linear-to-br from-[#60a5fa] to-[#3b82f6] text-white shadow-lg shadow-[#60a5fa]/30 scale-110'
                        : 'bg-gray-200 text-gray-500 scale-100'
                    }`}
                  >
                    <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <span
                  className={`text-[17px] font-medium transition-all duration-300 text-center ${
                    currentStep === 'posting'
                      ? 'bg-linear-to-r from-[#60a5fa] to-[#3b82f6] bg-clip-text text-transparent font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  {t.step3Posting}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Input Mode & Text Input */}
        {currentStep === 'input' && (
          <div className={`${sectionCardClass} mb-6`}>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  inputMode === 'manual'
                    ? 'bg-[#9333ea] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.directInput}
              </button>
              <button
                onClick={() => setInputMode('ai')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  inputMode === 'ai'
                    ? 'bg-[#9333ea] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {t.aiGenerate}
              </button>
            </div>

            {inputMode === 'manual' ? (
              <div>
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a855f7] focus:border-transparent resize-none text-sm sm:text-base"
                  rows={5}
                />
                <div className="mt-2 text-sm text-gray-500">
                  {originalText.length} {t.chars}
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  ref={topicRef}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t.describeTopic}
                  className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base min-h-5"
                  rows={5}
                />
                <button
                  onClick={handleGenerateOriginal}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-2.5 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5  sm:h-5 animate-spin" />
                      {t.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      {t.generate}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Image Upload */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                {t.addVisual} ({t.optional})
              </h3>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />

              <div className="flex items-center gap-3">
                {/* 작은 정사각형 + 버튼 */}
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-gray-500 text-xl"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <span>+</span>
                  )}
                </label>

                {/* 오른쪽 이미지 + 삭제 버튼 */}
                {imageUrl && (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                    {/* 삭제(X) 버튼 */}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-white p-1 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
                    </button>

                    {/* 이미지 (원본 비율 유지) */}
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-lg border border-gray-200 bg-gray-100"
                      onError={(e) => {
                        console.error('Image load error:', imageUrl)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Language Selection */}
        {currentStep === 'languages' && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setCurrentStep('input')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              뒤로
            </button>

            {/* Language Selection */}
            <div className={`${sectionCardClass}`}>
              <h3 className="font-semibold mb-4 text-sm sm:text-base"> {t.whereTravel}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {Object.entries(LANGUAGES).map(([code, lang]) => {
                  const langCode = code as Language
                  const isSelected = selectedLanguages.includes(langCode)
                  const isInPreview = !!translations[langCode] || originalLang === langCode
                  const tooltip = isInPreview
                    ? originalLang === langCode
                      ? 'Detected as original language'
                      : 'Already in preview'
                    : undefined

                  return (
                    <button
                      key={code}
                      onClick={() => !isInPreview && toggleLanguage(langCode)}
                      disabled={isInPreview}
                      aria-disabled={isInPreview}
                      title={tooltip}
                      className={`py-2 px-2 sm:px-3 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                        isInPreview
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#9333ea] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{lang.flag}</span>
                      {getLanguageName(uiLanguage, code as Language)}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleTranslate}
                disabled={isTranslating || !originalText.trim() || selectedLanguages.length === 0}
                className="w-full py-3 sm:py-4 bg-[#9333ea] text-white rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:bg-[#a855f7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 h-6 sm:h-6 animate-spin" />
                    <span className="text-sm sm:text-base">{t.craftingMessage}</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-sm sm:text-base">{t.translate}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Posting Screen */}
        {currentStep === 'posting' && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setCurrentStep('languages')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              뒤로
            </button>

            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6">
              {t.yourGlobalMessage}
            </h2>

            {/* Original Text Posting Option */}
            <div className={sectionCardClass}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-xl sm:text-2xl"></span>
                  <span>원문 (Original)</span>
                </h3>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200" />
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {userName || 'Anonymous'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        {displayName || ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">
                    {originalText}
                  </div>

                  {imageUrl && (
                    <div className="mt-3 sm:mt-4 rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={imageUrl}
                        alt="Preview media"
                        className="w-full max-h-80 object-cover bg-gray-100"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  <div className="mt-3 sm:mt-4 flex items-center justify-between text-gray-500">
                    <div className="flex items-center gap-12">
                      <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                        <Repeat2 className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>
                    <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                      <Share className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handlePostOriginal}
                  className="flex-1 py-2 px-3 sm:px-4 bg-[#9333ea] text-white rounded-lg font-medium hover:bg-[#a855f7] transition-colors text-sm sm:text-base"
                >
                  ✉️ {t.postNow}
                </button>
              </div>
            </div>

            {/* Translation Results */}
            {Object.keys(translations).length > 0 && (
              <div className="space-y-4 mb-6">
                {selectedLanguages.map((lang) => {
                  const translation = displayTranslations[lang]
                  if (!translation) return null

                  const editableText = editableTranslations[lang] || translation.text

                  return (
                    <div key={lang} className={sectionCardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                          <span className="text-xl sm:text-2xl">{LANGUAGES[lang].flag}</span>
                          <span className="truncate">{LANGUAGES[lang].name}</span>
                        </h3>
                        <button
                          onClick={() => handleDeleteCard(lang)}
                          className="text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200" />
                            <div className="min-w-0">
                              <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                Username
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">
                                @UserTag
                              </div>
                            </div>
                          </div>

                          <textarea
                            value={editableText}
                            onChange={(e) => {
                              setEditableTranslations((prev) => ({
                                ...prev,
                                [lang]: e.target.value,
                              }))
                            }}
                            className="w-full p-0 border-0 resize-none text-sm sm:text-base text-gray-900 bg-transparent focus:outline-none"
                            rows={3}
                          />

                          {imageUrl && (
                            <div className="mt-3 sm:mt-4 rounded-xl overflow-hidden border border-gray-200">
                              <img
                                src={imageUrl}
                                alt="Preview media"
                                className="w-full max-h-80 object-cover bg-gray-100"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}

                          <div className="mt-3 sm:mt-4 flex items-center justify-between text-gray-500">
                            <div className="flex items-center gap-12">
                              <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                              </button>
                              <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                <Repeat2 className="w-5 h-5" />
                              </button>
                              <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                <Heart className="w-5 h-5" />
                              </button>
                            </div>
                            <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                              <Share className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePost(lang)}
                          className="flex-1 mt-4 py-2 px-3 sm:px-4 bg-[#9333ea] text-white rounded-lg font-medium hover:bg-[#a855f7] transition-colors text-sm sm:text-base"
                        >
                          {t.postNow}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Preview Section - Hide on final (posting) step */}
        {currentStep === 'input' && (
          <div className={`${sectionCardClass} mt-6`}>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              {t.preview}
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200" />
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      {userName || 'Anonymous'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">
                      @{displayName || ''}
                    </div>
                  </div>
                </div>

                {/* ✅ Editable Preview */}
                <textarea
                  ref={previewRef}
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full p-0 border-0 resize-none text-sm sm:text-base text-gray-900 bg-transparent focus:outline-none min-h-[60px]"
                  rows={3}
                />

                {imageUrl && (
                  <div className="mt-3 sm:mt-4 rounded-xl overflow-hidden border border-gray-200 relative">
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600" />
                      <span className="sr-only">Remove image</span>
                    </button>
                    <img
                      src={imageUrl}
                      alt="Preview media"
                      className="w-full max-h-80 object-cover bg-gray-100"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <div className="mt-3 sm:mt-4 flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-12">
                    <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                      <Repeat2 className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                    <Share className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            {/* Continue Button */}

            <div className="mt-6">
              <button
                disabled={!originalText.trim()}
                onClick={handleContinueToLanguages}
                className="w-full py-3 sm:py-4 bg-[#9333ea] text-white rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:bg-[#a855f7] transition-colors flex items-center justify-center gap-2"
              >
                <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-sm sm:text-base">{t.nextLanguageSelection}</span>
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
