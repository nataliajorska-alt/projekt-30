import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import AuthGate from '@/components/AuthGate'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Projekt 30',
  description: 'Twoja roczna transformacja',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Projekt 30',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A2420',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-ivory">
        <AuthProvider>
          <AuthGate>
            <div className="flex min-h-screen">
              <Navigation />
              {/* Main content — offset for sidebar on desktop, padding for bottom nav on mobile */}
              <main className="flex-1 md:ml-56 pb-24 md:pb-0 min-h-screen">
                {children}
              </main>
            </div>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  )
}
