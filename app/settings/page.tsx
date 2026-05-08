'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'
import AccountSection from './_sections/AccountSection'
import RoutineEditSection from './_sections/RoutineEditSection'
import SparkScheduleSection from './_sections/SparkScheduleSection'
import CustomQuestLibrarySection from './_sections/CustomQuestLibrarySection'
import NotificationsSection from './_sections/NotificationsSection'
import ExportSection from './_sections/ExportSection'
import NominatedContactsSection from './_sections/NominatedContactsSection'
import XPRecoverySection from './_sections/XPRecoverySection'

type SettingsTab = 'account' | 'personal' | 'notify' | 'export' | 'safety'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'account',  label: 'Konto' },
  { id: 'personal', label: 'Personalizacja' },
  { id: 'notify',   label: 'Powiadomienia' },
  { id: 'export',   label: 'Eksport' },
  { id: 'safety',   label: 'Bezpieczeństwo' },
]

export default function SettingsPage() {
  const { user, logOut } = useAuth()
  const [tab, setTab] = useState<SettingsTab>('account')

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <h1 className="font-serif text-2xl text-dark mb-6">Ustawienia</h1>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex-shrink-0 px-4 py-2.5 rounded-xl font-sans text-xs transition-all whitespace-nowrap',
              tab === id
                ? 'bg-dark text-ivory'
                : 'bg-white border border-border text-muted hover:bg-cream'
            )}
          >
            {label}
          </button>
        ))}
      </div>

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
