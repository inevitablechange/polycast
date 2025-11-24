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
  const [originalLang, setOriginalLang] = useState<Language | null>(null)

  // Mini App capabilities (composeCast 지원 여부 등)
  const [capabilities, setCapabilities] = useState<string[]>([])

  // Mini App added 여부 (Base docs의 client.added 사용)
  const [isMiniAppAdded, setIsMiniAppAdded] = useState<boolean | null>(null)

  // Mini App 추가 진행 상태
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false)

  // Posting step UI 상태
  const [isCombineMode, setIsCombineMode] = useState(false)
  // Step3에서 실제로 보여줄 / 포스트할 언어 목록
  const [postLanguages, setPostLanguages] = useState<Language[]>([])
  // 합치기 모드에서 원문 포함 여부
  const [includeOriginalInCombined, setIncludeOriginalInCombined] = useState(false)

  const t = getTranslation(uiLanguage)

  const sectionCardClass =
    'bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm'

  const displayTranslations = translations

  // Add Mini App handler (이제 자동 호출 용도로만 사용)
  const handleAddMiniApp = async () => {
    // 이미 추가 중이면 중복 호출 방지
    if (isAddingMiniApp) return

    if (!isInMiniApp) {
      alert('Mini App 환경에서만 앱 추가가 가능합니다.')
      return
    }

    try {
      setIsAddingMiniApp(true)
      const result = await sdk.actions.addMiniApp()
      console.log('MiniApp added:', result)

      // Base 클라이언트에서 Mini App이 정상적으로 추가된 경우
      setIsMiniAppAdded(true)
    } catch (err) {
      console.error('addMiniApp error', err)
      alert('앱 추가에 실패했습니다. 나중에 다시 시도해주세요.')
    } finally {
      setIsAddingMiniApp(false)
    }
  }

  useEffect(() => {
    const initMiniAppUser = async () => {
      try {
        const miniAppStatus = await sdk.isInMiniApp()
        setIsInMiniApp(miniAppStatus)

        if (!miniAppStatus) {
          console.log('Not running inside Mini App host')
          return
        }

        // Get host capabilities
        try {
          const caps = await sdk.getCapabilities()
          console.log('MiniApp capabilities:', caps)
          setCapabilities(caps)
        } catch (capErr) {
          console.warn('Failed to get capabilities', capErr)
        }

        const context = await sdk.context
        const user = context.user as MiniAppUser
        const client = (context as any)?.client as { added?: boolean } | undefined

        if (typeof client?.added === 'boolean') {
          setIsMiniAppAdded(client.added)
        }

        if (!user?.fid) return

        setMiniAppUser(user)
        setUserName(user.username || '')
        setDisplayName(user.displayName || '')
        setFid(user.fid)

        // Initialize user on backend
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
          } else {
            const contentType = initResponse.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const initData = await initResponse.json()
              if (!initData.ok) {
                console.warn('/api/user/init error:', initData.error)
              }
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

  // farcaster/base 앱에 Mini App이 아직 추가되지 않은 경우,
  // 앱 진입 시 자동으로 addMiniApp 실행
  useEffect(() => {
    if (!isInMiniApp) return
    if (isMiniAppAdded === false) {
      // 최초 한 번만 시도 (isAddingMiniApp으로 중복 방지)
      handleAddMiniApp()
    }
  }, [isInMiniApp, isMiniAppAdded])

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
    setIsCombineMode(false)
    setPostLanguages([])
    setIncludeOriginalInCombined(false)
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
      setIsCombineMode(false)
      setPostLanguages([])
      setIncludeOriginalInCombined(false)
      // setSessionId(null) // 필요하면 세션도 리셋
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
          } catch {
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
    el.style.height = 'auto'
    const maxHeight = 160 // px
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

        // Step3 초기 상태
        setPostLanguages(selectedLanguages)
        setIsCombineMode(false)
        setIncludeOriginalInCombined(false)

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

    if (!isInMiniApp) {
      alert('Cast는 Farcaster/Base Mini App 안에서만 보낼 수 있어요.')
      return
    }

    try {
      const canCompose = capabilities.includes('actions.composeCast')

      if (canCompose) {
        await sdk.actions.composeCast({
          text,
          embeds: imageUrl ? [imageUrl] : [],
        })
      } else {
        // Fallback: Warpcast compose URL
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
        await sdk.actions.openUrl({ url })
      }

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

      // composeCast/openUrl 실패했을 때도 로그 남기기
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
              errorMessage: (error as Error).message ?? 'composeCast/openUrl failed',
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

    if (!isInMiniApp) {
      alert('Cast는 Farcaster/Base Mini App 안에서만 보낼 수 있어요.')
      return
    }

    const targetLangForLog = originalLang ?? 'en' // 로그용 언어 코드 fallback

    try {
      const canCompose = capabilities.includes('actions.composeCast')

      if (canCompose) {
        await sdk.actions.composeCast({
          text,
          embeds: imageUrl ? [imageUrl] : [],
        })
      } else {
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
        await sdk.actions.openUrl({ url })
      }

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
              errorMessage: (error as Error).message ?? 'composeCast/openUrl failed',
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
    setPostLanguages((prev) => prev.filter((l) => l !== lang))
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

  // Step3에서 보여줄 언어 토글
  const togglePostLanguage = (lang: Language) => {
    setPostLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    )
  }

  // 합치기 모드에서 최종 텍스트 빌드
  const buildCombinedText = (): string => {
    const blocks: string[] = []

    if (includeOriginalInCombined && originalText.trim()) {
      blocks.push(originalText.trim())
    }

    postLanguages.forEach((lang) => {
      const raw = editableTranslations[lang] || translations[lang]?.text
      if (raw && raw.trim()) {
        blocks.push(raw.trim())
      }
    })

    return blocks.join('\n\n')
  }

  // 여러 언어를 한 캐스트로 합쳐서 포스팅
  const handlePostCombined = async () => {
    const finalText = buildCombinedText()
    if (!finalText.trim()) return

    if (!isInMiniApp) {
      alert('Cast는 Farcaster/Base Mini App 안에서만 보낼 수 있어요.')
      return
    }

    try {
      const canCompose = capabilities.includes('actions.composeCast')

      if (canCompose) {
        await sdk.actions.composeCast({
          text: finalText,
          embeds: imageUrl ? [imageUrl] : [],
        })
      } else {
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(finalText)}`
        await sdk.actions.openUrl({ url })
      }

      const targetLangForLog = postLanguages[0] ?? originalLang ?? 'en'

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
              mode: 'combined',
            }),
          })
        }
      } catch (e) {
        console.error('Failed to log combined cast:', e)
      }
    } catch (error) {
      console.error('Post combined error:', error)
      alert('Failed to open composer. Please try again.')

      try {
        const targetLangForLog = postLanguages[0] ?? originalLang ?? 'en'
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
              mode: 'combined',
              errorMessage: (error as Error).message ?? 'composeCast/openUrl failed',
            }),
          })
        }
      } catch (e) {
        console.error('Failed to log combined cast (failed):', e)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Step 1 */}
              <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
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
                  className={`text-[12px] font-medium transition-all duration-300 text-center ${
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
              <div className="flex-1 flex items-center">
                <div className="relative w-full h-[2px] sm:h-[4px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`
        absolute left-0 top-0 h-full transition-all duration-500 ease-in-out
        ${
          currentStep === 'posting'
            ? 'bg-linear-to-r from-[#a855f7] via-[#60a5fa] to-[#3b82f6] w-full'
            : currentStep === 'languages'
            ? 'bg-linear-to-r from-[#9333ea] via-[#a855f7] to-[#60a5fa] w-full'
            : 'w-0'
        }
      `}
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
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
                  className={`text-[12px] font-medium transition-all duration-300 text-center ${
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
              <div className="flex-1 flex items-center">
                <div className="relative w-full h-[2px] sm:h-[4px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`
        absolute left-0 top-0 h-full transition-all duration-500 ease-in-out
        ${
          currentStep === 'posting'
            ? 'bg-linear-to-r from-[#a855f7] via-[#60a5fa] to-[#3b82f6] w-full'
            : currentStep === 'languages'
            ? 'bg-linear-to-r from-[#9333ea] via-[#a855f7] to-[#60a5fa] w-full'
            : 'w-0'
        }
      `}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
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
                  className={`text-[12px] font-medium transition-all duration-300 text-center ${
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
                  className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a855f7] focus:border-transparent resize-none text-base sm:text-base"
                  rows={6}
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
                  className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-base sm:text-base min-h-5"
                  rows={6}
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
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-white p-1 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
                    </button>

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
              {t.back}
            </button>

            {/* Language Selection */}
            <div className={`${sectionCardClass}`}>
              <h3 className="font-semibold mb-4 text-sm sm:text-base">{t.whereTravel}</h3>
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
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
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
              {t.back}
            </button>

            {/* Original Text Posting Option */}
            <div className={sectionCardClass}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-xl sm:text-2xl">📝</span>
                  <span>{t.original}</span>
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
              <div className={sectionCardClass}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-sm sm:text-base">번역 결과</h3>
                  <button
                    type="button"
                    onClick={() => setIsCombineMode((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isCombineMode
                        ? 'bg-[#9333ea] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isCombineMode ? '✓ 합치기 모드' : '합치기 모드'}
                  </button>
                </div>

                {/* 언어 선택 버튼들 - Step2에서 고른 언어 중 실제로 포스트에 쓸 언어들 */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedLanguages.map((lang) => {
                    const isSelected = postLanguages.includes(lang)
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => togglePostLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-[#9333ea] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="mr-1">{LANGUAGES[lang].flag}</span>
                        {getLanguageName(uiLanguage, lang)}
                      </button>
                    )
                  })}
                </div>

                {/* 합치기 모드 */}
                {isCombineMode ? (
                  <div className="space-y-4">
                    {/* 원문 포함 토글 */}
                    <button
                      type="button"
                      onClick={() => setIncludeOriginalInCombined((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                        includeOriginalInCombined
                          ? 'bg-[#9333ea] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">📝</span>
                      원문 포함하기
                    </button>

                    {postLanguages.length === 0 && !includeOriginalInCombined ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        합칠 언어를 선택해주세요
                      </div>
                    ) : (
                      <>
                        {/* 미리보기 카드 */}
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

                            <div className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">
                              {buildCombinedText()}
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

                        <button
                          onClick={handlePostCombined}
                          className="w-full py-2.5 px-4 bg-[#9333ea] text-white rounded-lg font-medium hover:bg-[#a855f7] transition-colors text-sm sm:text-base"
                        >
                          ✉️ 한 번에 포스팅
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  // 개별 모드: 언어별 카드
                  <div className="space-y-4">
                    {postLanguages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        보고 싶은 언어를 선택해주세요
                      </div>
                    ) : (
                      postLanguages.map((lang) => {
                        if (!translations[lang]) return null

                        return (
                          <div key={lang} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                                <span className="text-lg sm:text-xl">{LANGUAGES[lang].flag}</span>
                                <span>{getLanguageName(uiLanguage, lang)}</span>
                              </h4>
                              <button
                                onClick={() => handleDeleteCard(lang)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                                      @{displayName || ''}
                                    </div>
                                  </div>
                                </div>

                                <textarea
                                  value={editableTranslations[lang] || translations[lang].text}
                                  onChange={(e) => {
                                    setEditableTranslations((prev) => ({
                                      ...prev,
                                      [lang]: e.target.value,
                                    }))
                                  }}
                                  className="w-full p-0 border-0 resize-none text-base sm:text-base text-gray-900 bg-transparent focus:outline-none"
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

                            <button
                              onClick={() => handlePost(lang)}
                              className="w-full py-2 px-4 bg-[#9333ea] text-white rounded-lg font-medium hover:bg-[#a855f7] transition-colors text-sm sm:text-base"
                            >
                              ✉️ {t.postNow}
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
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

                <textarea
                  ref={previewRef}
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full p-0 border-0 resize-none text-base sm:text-base text-gray-900 bg-transparent focus:outline-none min-h-[60px]"
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
