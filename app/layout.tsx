import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UiLanguageProvider } from '@/components/UiLanguageProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PolyCast - One Cast, Many Languages',
  description: 'Turn your cast into a global conversation with AI-powered multilingual translation',
  icons: {
    icon: '/favicon.ico',
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://polycast-five.vercel.app/Polycast_logo2.png',
      button: {
        title: 'PolyCast - Cast Globally',
        action: {
          type: 'launch_frame',
          url: 'https://polycast-five.vercel.app',
          name: 'PolyCast',
          splashImageUrl: 'https://polycast-five.vercel.app/Polycast_logo2.png',
          splashBackgroundColor: '#6366F1',
        },
      },
    }),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UiLanguageProvider>{children}</UiLanguageProvider>
      </body>
    </html>
  )
}
