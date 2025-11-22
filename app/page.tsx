'use client'

import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
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
} from 'lucide-react'
import {
  LANGUAGES,
  PREVIEW_CHAR_LIMIT,
  Language,
  TranslationResult,
  UILanguage,
  RecentActivity,
} from '@/lib/types'
import { getTranslation, getLanguageName } from '@/lib/i18n'
import { saveActivity } from '@/lib/storage'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en')
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
  const [previewLang, setPreviewLang] = useState<Language | null>(null)

  const t = getTranslation(uiLanguage)

  const sectionCardClass =
    'bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm'

  // 더미 번역 데이터 생성
  const getDummyTranslations = (): TranslationResult => {
    const dummyTexts: Partial<Record<Language, string>> = {
      en: 'Hello! This is a sample translation in English.',
      ko: '안녕하세요! 이것은 한국어로 번역된 샘플 텍스트입니다.',
      ja: 'こんにちは！これは日本語に翻訳されたサンプルテキストです。',
      zh: '你好！这是用中文翻译的示例文本。',
      es: '¡Hola! Este es un texto de ejemplo traducido al español.',
      fr: "Bonjour ! Ceci est un texte d'exemple traduit en français.",
      de: 'Hallo! Dies ist ein Beispieltext, der ins Deutsche übersetzt wurde.',
      pt: 'Olá! Este é um texto de exemplo traduzido para português.',
      vi: 'Xin chào! Đây là văn bản mẫu được dịch sang tiếng Việt.',
      th: 'สวัสดี! นี่คือข้อความตัวอย่างที่แปลเป็นภาษาไทย',
      id: 'Halo! Ini adalah teks contoh yang diterjemahkan ke bahasa Indonesia.',
      ar: 'مرحبا! هذا نص مثال مترجم إلى العربية.',
      hi: 'नमस्ते! यह हिंदी में अनुवादित एक नमूना पाठ है।',
      it: 'Ciao! Questo è un testo di esempio tradotto in italiano.',
      ru: 'Привет! Это пример текста, переведенного на русский язык.',
      tr: "Merhaba! Bu Türkçe'ye çevrilmiş örnek bir metindir.",
      pl: 'Cześć! To jest przykładowy tekst przetłumaczony na język polski.',
      nl: 'Hallo! Dit is een voorbeeldtekst vertaald naar het Nederlands.',
    }

    const result: TranslationResult = {}
    selectedLanguages.forEach((lang) => {
      const text = dummyTexts[lang] || dummyTexts.en || 'Sample translation text.'
      const previewText =
        text.length > PREVIEW_CHAR_LIMIT ? text.substring(0, PREVIEW_CHAR_LIMIT) + '...' : text
      result[lang] = {
        text,
        previewText,
        charCount: text.length,
      }
      // Editable text 초기화
      if (!editableTranslations[lang]) {
        setEditableTranslations((prev) => ({ ...prev, [lang]: text }))
      }
    })
    return result
  }

  const displayTranslations =
    Object.keys(translations).length > 0
      ? translations
      : selectedLanguages.length > 0
      ? getDummyTranslations()
      : {}

  const handleGenerateOriginal = async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-original', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style: 'casual' }),
      })

      const data = await response.json()
      if (data.originalText) {
        setOriginalText(data.originalText)
        setInputMode('manual')
      }
    } catch (error) {
      console.error('Generate error:', error)
      alert('Failed to generate text. Please try again.')
    } finally {
      setIsGenerating(false)
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
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

  const handleTranslate = async () => {
    if (!originalText.trim() || selectedLanguages.length === 0) return

    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          targetLanguages: selectedLanguages,
          style: 'casual',
        }),
      })

      const data = await response.json()
      if (data.translations) {
        setTranslations(data.translations)
        // Editable translations 초기화
        const newEditable: Partial<Record<Language, string>> = {}
        selectedLanguages.forEach((lang) => {
          newEditable[lang] = data.translations[lang]?.text || ''
        })
        setEditableTranslations(newEditable)
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

      // Recent Activities에 저장
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
      <Header uiLanguage={uiLanguage} onLanguageChange={setUiLanguage} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* Original Text Section */}
        <div className={`${sectionCardClass} mb-6`}>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('manual')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                inputMode === 'manual'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.directInput}
            </button>
            <button
              onClick={() => setInputMode('ai')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                inputMode === 'ai'
                  ? 'bg-purple-600 text-white'
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
                className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base"
                rows={5}
              />
              <div className="mt-2 text-sm text-gray-500">
                {originalText.length} {t.chars}
              </div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.describeTopic}
                className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3 text-sm sm:text-base"
              />
              <button
                onClick={handleGenerateOriginal}
                disabled={isGenerating || !topic.trim()}
                className="w-full py-2.5 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
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
        </div>

        {/* Image Upload */}
        <div className={`${sectionCardClass} mb-6`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
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
          <label
            htmlFor="image-upload"
            className="block w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : imageUrl ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm">{fileName}</span>
              </div>
            ) : (
              <span className="text-gray-600">{t.clickToUpload}</span>
            )}
          </label>
          {imageUrl && (
            <div className="mt-3 flex justify-center">
              <img
                src={imageUrl}
                alt="Preview"
                className="rounded-lg max-h-32 w-auto object-contain border border-gray-200"
                onError={(e) => {
                  console.error('Image load error:', imageUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className={`${sectionCardClass} mb-6`}>
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
                    Username
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 truncate">@UserTag</div>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm sm:text-base text-gray-900">
                {originalText || ''}
              </p>

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
        </div>

        {/* Language Selection */}
        <div className={`${sectionCardClass} mb-6`}>
          <h3 className="font-semibold mb-4 text-sm sm:text-base">🌍 {t.whereTravel}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {Object.entries(LANGUAGES).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => toggleLanguage(code as Language)}
                className={`py-2 px-2 sm:px-3 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  selectedLanguages.includes(code as Language)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{lang.flag}</span>
                {getLanguageName(uiLanguage, code as Language)}
              </button>
            ))}
          </div>
          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !originalText.trim() || selectedLanguages.length === 0}
            className="w-full py-3 sm:py-4 bg-purple-600 text-white rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 "
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

        {/* Translation Results - Language Cards */}
        {selectedLanguages.length > 0 &&
          (isTranslating || Object.keys(translations).length > 0) && (
            <div className="space-y-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6">
                {t.yourGlobalMessage}
              </h2>
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

                    {/* Image Thumbnail */}
                    {imageUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden border border-gray-200">
                        <img
                          src={imageUrl}
                          alt="Preview media"
                          className="w-full max-h-80 object-cover bg-gray-100"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {/* Editable TextArea */}
                    <textarea
                      value={editableText}
                      onChange={(e) => {
                        setEditableTranslations((prev) => ({
                          ...prev,
                          [lang]: e.target.value,
                        }))
                      }}
                      className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none mb-3 text-sm sm:text-base"
                      rows={5}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePost(lang)}
                        className="flex-1 py-2 px-3 sm:px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors text-sm sm:text-base"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </main>
      <Footer />
    </div>
  )
}
