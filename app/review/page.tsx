'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useAuth } from '@/hooks/useAuth'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useReviewHistory } from '@/hooks/useReviewHistory'
import { getDaysElapsed, getDaysRemaining } from '@/lib/gameLogic'
import { toRoman } from '@/lib/romanNumerals'
import { RitualSurface, SmallCaps, GoldRule, Fleuron, RomanNumeral, Diamond } from '@/components/ui'
import WeeklyReviewForm from './_components/WeeklyReviewForm'
import MonthlyReviewForm from './_components/MonthlyReviewForm'
import ArchiveTab from './_components/ArchiveTab'

type Mode = 'weekly' | 'monthly' | 'archive'

const MODES: { key: Mode; label: string; romanIdx: number }[] = [
  { key: 'weekly', label: 'Tygodniowy', romanIdx: 1 },
  { key: 'monthly', label: 'Miesięczny', romanIdx: 2 },
  { key: 'archive', label: 'Archiwum', romanIdx: 3 },
]

export default function ReviewPage() {
  const { user } = useAuth()
  const { stats, submitWeeklyReview, submitMonthlyReview } = useGameData()
  const { logs } = useTimelineData()
  const {
    weeklyReviews,
    monthlyReviews,
    lastWeeklyReview,
    lastMonthlyReview,
    loading: historyLoading,
  } = useReviewHistory()
  const [mode, setMode] = useState<Mode>('weekly')

  const dayElapsed = getDaysElapsed()
  const daysLeft = getDaysRemaining()

  return (
    <RitualSurface tone="forest-deep" frame="double" className="animate-fade-in">
      <div className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-10 pt-12 pb-16">
        {/* EDITORIAL HEADER */}
        <header className="text-center">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Library at Dusk · Vol. II
          </SmallCaps>
          <h1 className="font-display text-ivory text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.05] mt-4">
            Przegląd
            <span className="block font-serif-body italic text-parchment text-[clamp(1.25rem,2.5vw,1.5rem)] mt-1">
              & korekta
            </span>
          </h1>
          <GoldRule variant="fleuron" tone="gold" className="mt-6 max-w-xs mx-auto" />
          <p className="font-serif-body italic text-parchment text-base mt-5">
            zatrzymaj się — co naprawdę się dzieje?
          </p>
        </header>

        {/* MODE SWITCHER — editorial hairline tabs */}
        <nav className="mt-12">
          <div className="flex justify-center gap-5 sm:gap-8 md:gap-12 flex-wrap">
            {MODES.map(({ key, label, romanIdx }) => {
              const active = mode === key
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className="group flex flex-col items-center gap-1 transition-opacity"
                >
                  <div className="flex items-baseline gap-2">
                    <RomanNumeral
                      value={romanIdx}
                      className={clsx(
                        'text-base transition-colors',
                        active ? 'text-gold' : 'text-parchment/50 group-hover:text-gold-light'
                      )}
                    />
                    <SmallCaps
                      tone={active ? 'gold' : 'parchment'}
                      tracking="luxury"
                      size="sm"
                      className={clsx(
                        'transition-colors',
                        !active && 'group-hover:text-gold-light'
                      )}
                    >
                      {label}
                    </SmallCaps>
                  </div>
                  <span
                    className={clsx(
                      'h-px w-12 transition-all',
                      active ? 'bg-gold' : 'bg-transparent group-hover:bg-gold-light/40'
                    )}
                  />
                </button>
              )
            })}
          </div>
          <GoldRule variant="plain" tone="gold-deep" className="mt-6 opacity-40" />
        </nav>

        {/* STATS — three specimen cards on the dark table */}
        <div className="mt-10 grid grid-cols-3 gap-3 md:gap-4">
          <SpecimenCard
            label="Day of project"
            primary={dayElapsed.toString().padStart(3, '0')}
            sub={`of ${toRoman(365)}`}
          />
          <SpecimenCard
            label="Until birthday"
            primary={daysLeft.toString()}
            sub="days remain"
          />
          <SpecimenCard
            label="Total XP"
            primary={stats.totalXP.toLocaleString('pl-PL')}
            sub="recorded"
          />
        </div>

        {/* FORM AREA — white documents on the dark library table */}
        <div className="mt-12 relative">
          {/* whisper of label */}
          <div className="absolute -top-7 left-0 flex items-center gap-2">
            <Diamond size={6} className="text-gold" />
            <SmallCaps tone="gold-light" tracking="luxury" size="xs">
              the document
            </SmallCaps>
          </div>
          {mode === 'weekly' && (
            <WeeklyReviewForm
              user={user}
              stats={stats}
              submitWeeklyReview={submitWeeklyReview}
              lastReview={lastWeeklyReview}
            />
          )}
          {mode === 'monthly' && (
            <MonthlyReviewForm
              user={user}
              stats={stats}
              logs={logs}
              submitMonthlyReview={submitMonthlyReview}
              lastReview={lastMonthlyReview}
            />
          )}
          {mode === 'archive' && (
            <ArchiveTab
              logs={logs}
              weeklyReviews={weeklyReviews}
              monthlyReviews={monthlyReviews}
              loading={historyLoading}
            />
          )}
        </div>

        {/* CLOSING SIGNATURE */}
        <footer className="mt-16">
          <GoldRule variant="diamond" tone="gold-deep" className="max-w-sm mx-auto opacity-40" />
          <div className="mt-4 flex items-center justify-center gap-3">
            <Fleuron size={10} className="text-gold-deep" />
            <SmallCaps tone="parchment" tracking="editorial" size="xs">
              ex libris · natalia · mmxxvi
            </SmallCaps>
            <Fleuron size={10} className="text-gold-deep" />
          </div>
        </footer>
      </div>
    </RitualSurface>
  )
}

function SpecimenCard({ label, primary, sub }: { label: string; primary: string; sub: string }) {
  return (
    <div className="relative bg-ivory text-dark border border-gold-light/40 px-3 py-4 md:py-5 text-center">
      <SmallCaps tone="muted" tracking="luxury" size="xs">
        {label}
      </SmallCaps>
      <p className="font-display text-2xl md:text-3xl mt-2 leading-none">{primary}</p>
      <p className="font-serif-body italic text-muted text-[11px] mt-1">{sub}</p>
    </div>
  )
}
