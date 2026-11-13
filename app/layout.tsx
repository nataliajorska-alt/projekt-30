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
import RewardLayer from '@/components/RewardLayer'
import { GameDataProvider } from '@/hooks/useGameData'
import ConnectionStatus from '@/components/ConnectionStatus'

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
  themeColor: '#1D231F',
  width: 'device-width',
  initialScale: 1,
  // cover: dopiero z tym przeglądarka podaje env(safe-area-inset-*), czyli
  // wysokość wycięcia / paska statusu i dolnej belki gestów w iPhonie.
  viewportFit: 'cover',
  // maximumScale celowo usunięte — blokowało pinch-zoom (WCAG 1.4.4) w apce
  // z mnóstwem tekstu 8–11px na telefonie.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-ivory">
        {/* Tło pod pasek statusu telefonu. Apka zainstalowana na iPhonie rysuje się
            POD paskiem (black-translucent), a jego napisy są białe — na kremowej
            stronie nie było ich widać, a nagłówek „Dziś" wchodził pod zegar.
            Ciemna belka o wysokości wycięcia domyka kadr z dolną nawigacją.
            Na urządzeniach bez wycięcia i na desktopie ma wysokość 0. */}
        <div aria-hidden className="md:hidden fixed top-0 inset-x-0 z-[110] h-[env(safe-area-inset-top)] bg-dark print:hidden" />
        <ServiceWorkerRegistrar />
        <AuthProvider>
          <AchievementUnlockProvider>
          <LevelUpProvider>
          <ToastProvider>
            <AuthGate>
            {/* Statystyki i log dnia — jeden stan i jedna para nasłuchów na całą apkę. */}
            <GameDataProvider>
              {/* print: sidebar znika, więc offset i flex też muszą — inaczej
                  wydruk raportu byłby zwężony o 280px / obcięty do jednej strony */}
              <div className="flex min-h-screen print:block print:min-h-0">
                <Navigation />
                {/* Main content — offset for sidebar on desktop, padding for bottom nav on mobile */}
                <main className="flex-1 md:ml-[280px] pt-[env(safe-area-inset-top)] pb-[calc(6rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0 min-h-screen overflow-x-hidden print:ml-0 print:pt-0 print:pb-0 print:min-h-0 print:overflow-visible">
                  {children}
                </main>
                <QuickActionsFab />
              </div>
              {/* Nagrody (+XP, rozpęd, znaleziska) i tryb „Jedna rzecz" — jedna instancja na apkę. */}
              <RewardLayer />
              <ConnectionStatus />
            </GameDataProvider>
            </AuthGate>
          </ToastProvider>
          </LevelUpProvider>
          </AchievementUnlockProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
