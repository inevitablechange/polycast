export type Language =
  | 'en'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'es'
  | 'fr'
  | 'pt'
  | 'de'
  | 'it'
  | 'ru'
  | 'ar'
  | 'hi'
  | 'vi'
  | 'th'
  | 'id'
  | 'tr'
  | 'pl'
  | 'nl'

export type UILanguage =
  | 'en'
  | 'ko'
  | 'ja'
  | 'zh'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'vi'
  | 'th'
  | 'id'
  | 'ar'
  | 'hi'

export type Style = 'professional' | 'casual' | 'crypto-native'

export interface Translation {
  text: string
  previewText: string
  charCount: number
}

export interface TranslationResult {
  [key: string]: Translation
}

export interface UploadImageResponse {
  url: string
  fileName: string
  fileSize: number
}

export interface RecentActivity {
  id: string
  originalText: string
  translations: TranslationResult
  imageUrl?: string
  languages: Language[]
  timestamp: number
  castHashes?: string[] // 각 언어별 Cast hash
}

export interface UserStats {
  totalCasts: number
  totalTranslations: number
  imagesPosted: number
  topLanguages: { language: Language; count: number }[]
}

export interface LeaderboardEntry {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  totalCasts: number
  totalLanguages: number
  countriesReached: number
}

// lib/constants.ts
export const LANGUAGES: Record<Language, { name: string; flag: string; nativeName: string }> = {
  en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  ja: { name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  ko: { name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  zh: { name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  es: { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  fr: { name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  pt: { name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  de: { name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  it: { name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  ru: { name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  ar: { name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  hi: { name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  vi: { name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  th: { name: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
  id: { name: 'Indonesian', flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
  tr: { name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  pl: { name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  nl: { name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
}

export const STYLES: Record<Style, { label: string; description: string }> = {
  professional: {
    label: 'Professional',
    description: 'Formal and informative tone',
  },
  casual: {
    label: 'Casual',
    description: 'Friendly and conversational',
  },
  'crypto-native': {
    label: 'Crypto-native',
    description: 'Web3 savvy and punchy',
  },
}

export const MAX_LANGUAGES = 5
export const PREVIEW_CHAR_LIMIT = 320
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
