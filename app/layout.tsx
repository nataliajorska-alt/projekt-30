import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import AuthGate from '@/components/AuthGate'
import Navigation from '@/components/Navigation'
import QuickActionsFab from '@/components/QuickActionsFab'
import { ToastProvider } from '@/components/ToastProvider'
import { AchievementUnlockProvider } from '@/components/AchievementUnlockModal'
import { LevelUpProvider } from '@/components/LevelUpModal'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'Projekt 30',
  description: 'Twoja roczna transformacja',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
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
  // maximumScale celowo usunięte — blokowało pinch-zoom (WCAG 1.4.4) w apce
  // z mnóstwem tekstu 8–11px na telefonie.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-ivory">
        <ServiceWorkerRegistrar />
        <AuthProvider>
          <AchievementUnlockProvider>
          <LevelUpProvider>
          <ToastProvider>
            <AuthGate>
              {/* print: sidebar znika, więc offset i flex też muszą — inaczej
                  wydruk raportu byłby zwężony o 280px / obcięty do jednej strony */}
              <div className="flex min-h-screen print:block print:min-h-0">
                <Navigation />
                {/* Main content — offset for sidebar on desktop, padding for bottom nav on mobile */}
                <main className="flex-1 md:ml-[280px] pb-24 md:pb-0 min-h-screen overflow-x-hidden print:ml-0 print:pb-0 print:min-h-0 print:overflow-visible">
                  {children}
                </main>
                <QuickActionsFab />
              </div>
            </AuthGate>
          </ToastProvider>
          </LevelUpProvider>
          </AchievementUnlockProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
