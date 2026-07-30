'use client'
import { useState, useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { useSparkSchedule } from '@/hooks/useSparkSchedule'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'
import { getEffectiveNow } from '@/lib/gameLogic'

function fmtDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekDays(offset: number): Date[] {
  const today = getEffectiveNow()
  const dow = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

export default function SparkScheduleSection() {
  const { sparks, loading, saving, saveSparks } = useSparkSchedule()
  const [weekOffset, setWeekOffset] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading) setDrafts(sparks)
  }, [loading, sparks])

  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset])

  const weekLabel = () => {
    const s = days[0], e = days[6]
    const fmt = (d: Date) => `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    return `${fmt(s)} – ${fmt(e)}.${e.getFullYear()}`
  }

  const todayStr = fmtDateKey(getEffectiveNow())

  const handleChange = (key: string, value: string) => {
    setDrafts(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    const merged = { ...sparks }
    for (const [k, v] of Object.entries(drafts)) {
      if (v.trim()) merged[k] = v.trim()
      else delete merged[k]
    }
    await saveSparks(merged)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return null

  return (
    <section className="panel-frame bg-ivory border border-hairline p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Iskry tygodnia
        </SmallCaps>
      </div>
      <h2 className="font-display text-dark text-[22px] tracking-tight mt-1">Twoje iskry</h2>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5 leading-relaxed">
        wpisz iskry na kolejne dni — pojawią się jako iskra dnia w odpowiednim momencie.
        puste dni wrócą do domyślnych iskier.
      </p>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="w-9 h-8 flex items-center justify-center border border-hairline text-muted hover:text-dark hover:border-gold transition-colors font-display text-lg"
        >
          ‹
        </button>
        <SmallCaps tone="dark" tracking="luxury" size="sm">
          {weekLabel()}
        </SmallCaps>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="w-9 h-8 flex items-center justify-center border border-hairline text-muted hover:text-dark hover:border-gold transition-colors font-display text-lg"
        >
          ›
        </button>
      </div>

      {/* Days */}
      <div className="space-y-3 mb-5">
        {days.map((d, i) => {
          const key = fmtDateKey(d)
          const isToday = key === todayStr
          return (
            <div key={key} className={clsx(isToday && 'border border-gold-light/40 bg-gold/5 p-2 -mx-2')}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  {DAY_NAMES[i]} · {d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}
                </SmallCaps>
                {isToday && (
                  <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
                    · dziś
                  </SmallCaps>
                )}
              </div>
              <textarea
                rows={2}
                value={drafts[key] ?? ''}
                onChange={e => handleChange(key, e.target.value)}
                placeholder="wpisz iskrę dnia…"
                className="w-full border border-hairline bg-cream/40 px-4 py-2.5 font-serif-body italic text-[14px] text-dark focus:outline-none focus:border-gold transition-colors resize-none placeholder:text-muted-light/60 leading-relaxed"
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 px-5 hover:bg-forest transition-colors disabled:opacity-60"
        >
          {saving ? (
            <Fleuron size={11} className="text-gold animate-pulse" />
          ) : (
            <Diamond size={5} className="text-gold" />
          )}
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            {saving ? 'zapisuję…' : 'zapisz iskry'}
          </SmallCaps>
        </button>
        {saved && (
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="animate-fade-in">
            zapisano ◆
          </SmallCaps>
        )}
      </div>
    </section>
  )
}
