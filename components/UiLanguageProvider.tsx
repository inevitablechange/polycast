'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { UILanguage } from '@/lib/types'

interface UiLanguageContextValue {
  uiLanguage: UILanguage
  setUiLanguage: (lang: UILanguage) => void
}

const UiLanguageContext = createContext<UiLanguageContextValue | undefined>(undefined)

const STORAGE_KEY = 'polycast_ui_language'
const DEFAULT_LANG: UILanguage = 'en'

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUiLanguageState] = useState<UILanguage>(DEFAULT_LANG)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as UILanguage | null
      if (stored) {
        setUiLanguageState(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  const setUiLanguage = (lang: UILanguage) => {
    setUiLanguageState(lang)
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }

  return (
    <UiLanguageContext.Provider value={{ uiLanguage, setUiLanguage }}>
      {children}
    </UiLanguageContext.Provider>
  )
}

export function useUiLanguage() {
  const ctx = useContext(UiLanguageContext)
  if (!ctx) {
    throw new Error('useUiLanguage must be used within UiLanguageProvider')
  }
  return ctx
}
