import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PolyCast - One Cast, Many Languages',
  description: 'Turn your cast into a global conversation with AI-powered multilingual translation',
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://your-domain.com/embed-preview.png',
      button: {
        title: 'Cast Globally',
        action: {
          type: 'launch_frame',
          url: 'https://your-domain.com',
          name: 'PolyCast',
          splashImageUrl: 'https://your-domain.com/splash.png',
          splashBackgroundColor: '#6366F1',
        },
      },
    }),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
