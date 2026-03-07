import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

// ─── Fonts ─────────────────────────────────────────────────────────────────────

const sora = Sora({
  subsets:  ['latin'],
  variable: '--font-sora',
  weight:   ['300', '400', '500', '600', '700', '800'],
  display:  'swap',
})

const dmSans = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  weight:   ['300', '400', '500', '600'],
  display:  'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-jetbrains',
  weight:   ['400', '500'],
  display:  'swap',
})

// ─── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default:  'Alok Message — Hyper-Secure Messaging',
    template: '%s | Alok Message',
  },
  description:
    'The world\'s most secure messaging platform with AI-governed fraud protection, lossless media, 4K calls, and a professional business ecosystem.',
  keywords:  ['secure messaging', 'AI safety', 'encrypted chat', 'business messaging', '4K calls'],
  authors:   [{ name: 'Alok Message' }],
  creator:   'Alok Message',
  icons: {
    icon:  '/icons/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    type:        'website',
    locale:      'en_US',
    url:         process.env.NEXT_PUBLIC_APP_URL,
    siteName:    'Alok Message',
    title:       'Alok Message — Hyper-Secure Messaging',
    description: 'AI-governed security. Fraud-zero ecosystem. World-class communication.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Alok Message' }],
  },
}

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       1,
  themeColor:         '#05071a',
  colorScheme:        'dark',
}

// ─── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-app antialiased">
        {children}

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background:  'rgba(10, 14, 46, 0.95)',
              backdropFilter: 'blur(20px)',
              border:      '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '0.875rem',
              color:       'rgba(255, 255, 255, 0.92)',
              fontFamily:  'var(--font-dm-sans)',
              fontSize:    '0.875rem',
              boxShadow:   '0 8px 32px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'transparent' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'transparent' },
            },
          }}
        />
      </body>
    </html>
  )
}
