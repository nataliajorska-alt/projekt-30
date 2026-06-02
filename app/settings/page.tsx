'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { SmallCaps, GoldRule, RomanNumeral } from '@/components/ui'
import AccountSection from './_sections/AccountSection'
import RoutineEditSection from './_sections/RoutineEditSection'
import SparkScheduleSection from './_sections/SparkScheduleSection'
import CustomQuestLibrarySection from './_sections/CustomQuestLibrarySection'
import NotificationsSection from './_sections/NotificationsSection'
import ExportSection from './_sections/ExportSection'
import NominatedContactsSection from './_sections/NominatedContactsSection'
import XPRecoverySection from './_sections/XPRecoverySection'
import SkincareGuideSection from './_sections/SkincareGuideSection'
import SupplementGuideSection from './_sections/SupplementGuideSection'

type SettingsTab = 'account' | 'personal' | 'skincare' | 'vitamins' | 'notify' | 'export' | 'safety'

const TABS: { id: SettingsTab; label: string; roman: number }[] = [
  { id: 'account',  label: 'Konto',           roman: 1 },
  { id: 'personal', label: 'Personalizacja',  roman: 2 },
  { id: 'skincare', label: 'Pielęgnacja',     roman: 3 },
  { id: 'vitamins', label: 'Witaminy',        roman: 4 },
  { id: 'notify',   label: 'Powiadomienia',   roman: 5 },
  { id: 'export',   label: 'Eksport',         roman: 6 },
  { id: 'safety',   label: 'Bezpieczeństwo',  roman: 7 },
]

export default function SettingsPage() {
  const { user, logOut } = useAuth()
  const [tab, setTab] = useState<SettingsTab>('account')

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="mb-8">
        <SmallCaps tone="muted" tracking="editorial" size="xs">
          Apparatus · Vol. I
        </SmallCaps>
        <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
          Ustawienia
        </h1>
        <p className="font-serif-body italic text-muted text-[14px] mt-2">
          drobne pokrętła, którymi dostrajasz przyrząd.
        </p>
        <GoldRule variant="diamond" tone="gold-deep" className="mt-5 opacity-50" />
      </header>

      {/* Tabs — editorial */}
      <nav className="mb-8">
        <div className="flex gap-5 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {TABS.map(({ id, label, roman }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-shrink-0 group flex flex-col items-center gap-1.5 py-1 transition-colors"
              >
                <span className="flex items-baseline gap-2 whitespace-nowrap">
                  <RomanNumeral
                    value={roman}
                    className={clsx(
                      'text-sm transition-colors',
                      active ? 'text-gold' : 'text-muted-light group-hover:text-gold-light'
                    )}
                  />
                  <SmallCaps
                    tone={active ? 'gold' : 'muted'}
                    tracking="luxury"
                    size="sm"
                    className={clsx('transition-colors', !active && 'group-hover:text-gold-deep')}
                  >
                    {label}
                  </SmallCaps>
                </span>
                <span
                  className={clsx(
                    'h-px w-10 transition-colors',
                    active ? 'bg-gold' : 'bg-transparent'
                  )}
                />
              </button>
            )
          })}
        </div>
        <GoldRule variant="plain" tone="gold-deep" className="mt-2 opacity-30" />
      </nav>

      <div className="space-y-6">
        {tab === 'account' && (
          <AccountSection email={user?.email ?? ''} user={user} logOut={logOut} />
        )}
        {tab === 'personal' && (
          <>
            <RoutineEditSection />
            <SparkScheduleSection />
            <CustomQuestLibrarySection />
          </>
        )}
        {tab === 'skincare' && <SkincareGuideSection />}
        {tab === 'vitamins' && <SupplementGuideSection />}
        {tab === 'notify' && <NotificationsSection />}
        {tab === 'export' && <ExportSection uid={user?.uid ?? ''} />}
        {tab === 'safety' && (
          <>
            <NominatedContactsSection />
            <XPRecoverySection />
          </>
        )}
      </div>
    </div>
  )
}
