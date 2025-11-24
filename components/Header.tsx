// components/Header.tsx
'use client'

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { ChevronDown, Check, Menu, X } from 'lucide-react'
import { LANGUAGES, UILanguage } from '@/lib/types'
import { getTranslation } from '@/lib/i18n'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUiLanguage } from './UiLanguageProvider'
import { useAccount, useBalance } from 'wagmi'
import { base } from 'wagmi/chains'

const UI_LANGUAGES: UILanguage[] = [
  'en',
  'ko',
  'ja',
  'zh',
  'es',
  'fr',
  'de',
  'pt',
  'vi',
  'th',
  'id',
  'ar',
  'hi',
]

const shortenAddress = (addr?: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-')

type MiniAppUser = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

export default function Header() {
  const { uiLanguage, setUiLanguage } = useUiLanguage()
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const t = getTranslation(uiLanguage)

  // wagmi: Base 지갑 정보
  const { address, isConnected } = useAccount()
  const { data: balanceData } = useBalance({
    address,
    chainId: base.id,
    query: {
      enabled: !!address, // ✅ v2 방식
    },
  })

  // Farcaster Mini App 유저 정보 (프로필 사진 / 이름)
  const [pfpUrl, setPfpUrl] = useState<string | null>(null)
  const [userLabel, setUserLabel] = useState<string>('U')

  useEffect(() => {
    let cancelled = false

    const initMiniAppUser = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp()
        if (!inMiniApp || cancelled) return

        const context = await sdk.context
        const user = context.user as MiniAppUser | undefined
        if (!user || cancelled) return

        if (user.pfpUrl) setPfpUrl(user.pfpUrl)
        const label = user.displayName || user.username || 'User'
        setUserLabel(label)
      } catch (e) {
        console.warn('Failed to load mini app user for header:', e)
      }
    }

    initMiniAppUser()
    return () => {
      cancelled = true
    }
  }, [])

  const avatarSrc =
    pfpUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userLabel[0] || 'U',
    )}&background=F3F4F6&color=111827`

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo / Home 버튼 */}
          <button
            onClick={() => {
              if (pathname === '/') {
                window.dispatchEvent(new CustomEvent('resetToHome'))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                router.push('/')
              }
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src="/Polycast_logo1.png" alt="PolyCast Logo" className="w-36 h-14" />
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className={`text-sm font-medium ${
                  pathname === '/' ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.createNav}
              </Link>
              <Link
                href="/leaderboard"
                className={`text-sm font-medium ${
                  pathname === '/leaderboard'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.leaderboardTitle}
              </Link>
              <Link
                href="/profile"
                className={`text-sm font-medium ${
                  pathname === '/profile' ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.profileTitle}
              </Link>
              <Link
                href="/settings"
                className={`text-sm font-medium ${
                  pathname === '/settings' ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.settingsTitle}
              </Link>
            </nav>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:border-gray-300 transition-colors text-xs sm:text-sm"
              >
                <span className="text-base sm:text-lg">{LANGUAGES[uiLanguage].flag}</span>
                <span className="font-medium hidden sm:inline">
                  {LANGUAGES[uiLanguage].nativeName}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    isLanguageMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isLanguageMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsLanguageMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-20 max-h-64 overflow-y-auto">
                    {UI_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setUiLanguage(lang)
                          setIsLanguageMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          uiLanguage === lang ? 'bg-gray-100' : ''
                        }`}
                      >
                        <span className="text-xl">{LANGUAGES[lang].flag}</span>
                        <span className="flex-1 text-left">{LANGUAGES[lang].nativeName}</span>
                        {uiLanguage === lang && <Check className="w-4 h-4 text-purple-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar / Wallet Modal */}
            <div className="relative">
              <button
                onClick={() => setIsWalletModalOpen((v) => !v)}
                className="shrink-0 flex items-center justify-center"
                aria-label="Open wallet info"
              >
                <img
                  src={avatarSrc}
                  alt={userLabel || 'Profile'}
                  className="rounded-full border border-gray-200 w-9 h-9 sm:w-10 sm:h-10 object-cover"
                />
              </button>
              {isWalletModalOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsWalletModalOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-100 shadow-lg z-20 p-3">
                    <div className="text-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">{t.walletNetworkLabel}</span>
                        <span className="font-medium">Base</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">{t.walletAddressLabel}</span>
                        <span className="font-medium break-all">
                          {isConnected ? shortenAddress(address) : t.walletNotConnectedLabel ?? '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">{t.walletBalanceLabel ?? 'Balance'}</span>
                        <span className="font-medium">
                          {balanceData
                            ? `${(Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(
                                4,
                              )} ${balanceData.symbol}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setIsWalletModalOpen(false)}
                        className="px-3 py-1.5 text-xs rounded-md bg-[#c4b5fd] text-black hover:bg-[#a78bfa]"
                      >
                        {t.walletModalClose}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === '/'
                    ? 'bg-purple-50 text-[#a78bfa]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.createNav}
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === '/leaderboard'
                    ? 'bg-purple-50 text-[#a78bfa]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.leaderboardTitle}
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === '/profile'
                    ? 'bg-purple-50 text-[#a78bfa]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.profileTitle}
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === '/settings'
                    ? 'bg-purple-50 text-[#a78bfa]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.settingsTitle}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
