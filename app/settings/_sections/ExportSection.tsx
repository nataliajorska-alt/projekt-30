'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { Download, Printer, BrainCircuit } from 'lucide-react'
import {
  exportLogsAsCSV, exportQuestsAsCSV, exportReviewsAsCSV,
  exportStatsAsCSV, exportAllAsCSV, exportAsMarkdown,
} from '@/lib/exportData'
import type { DateRange } from '@/lib/exportData'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

type Preset = 'all' | 'year' | 'month' | 'week' | 'custom'

function getPresetRange(preset: Preset): DateRange {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (preset === 'all') return { from: null, to: null }
  if (preset === 'year') {
    return { from: `${today.getFullYear()}-01-01`, to: fmt(today) }
  }
  if (preset === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: fmt(from), to: fmt(today) }
  }
  if (preset === 'week') {
    const dow = (today.getDay() + 6) % 7
    const from = new Date(today)
    from.setDate(today.getDate() - dow)
    return { from: fmt(from), to: fmt(today) }
  }
  return { from: null, to: null }
}

export default function ExportSection({ uid }: { uid: string }) {
  const router = useRouter()
  const [preset, setPreset] = useState<Preset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [exportingLogs, setExportingLogs] = useState(false)
  const [exportingQuests, setExportingQuests] = useState(false)
  const [exportingReviews, setExportingReviews] = useState(false)
  const [exportingStats, setExportingStats] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportingMd, setExportingMd] = useState(false)
  const [error, setError] = useState('')

  const range = useMemo<DateRange>(() => {
    if (preset === 'custom') return { from: customFrom || null, to: customTo || null }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  const wrap = async (fn: () => Promise<void>, setLoad: (b: boolean) => void, errMsg: string) => {
    setError('')
    setLoad(true)
    try { await fn() }
    catch { setError(errMsg) }
    finally { setLoad(false) }
  }

  const PRESETS: { value: Preset; label: string }[] = [
    { value: 'all',    label: 'Cały projekt' },
    { value: 'year',   label: 'Ten rok' },
    { value: 'month',  label: 'Ten miesiąc' },
    { value: 'week',   label: 'Ten tydzień' },
    { value: 'custom', label: 'Własny zakres' },
  ]

  return (
    <section className="panel-frame bg-ivory border border-hairline p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Download size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Eksport danych
        </SmallCaps>
      </div>
      <h2 className="font-display text-dark text-[22px] tracking-tight mt-1 mb-1">Pobierz swoje dane</h2>
      <p className="font-serif-body italic text-muted text-[13px] mb-5 leading-relaxed">
        pobierz dane do analizy w google sheets albo excelu.
      </p>

      {/* Preset selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map(p => {
          const sel = preset === p.value
          return (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={clsx(
                'px-3.5 py-1.5 border transition-colors',
                sel
                  ? 'bg-dark-deep text-ivory border-gold'
                  : 'border-hairline text-muted hover:border-gold-light hover:text-dark'
              )}
            >
              <SmallCaps tone={sel ? 'ivory' : 'muted'} tracking="luxury" size="xs">
                {p.label}
              </SmallCaps>
            </button>
          )
        })}
      </div>

      {/* Custom date inputs */}
      {preset === 'custom' && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1">
              Od
            </SmallCaps>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="w-full font-serif-body text-[14px] text-dark bg-cream/40 border border-hairline px-3 py-2 outline-none focus:border-gold transition-colors"
            />
          </div>
          <div className="flex-1">
            <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1">
              Do
            </SmallCaps>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="w-full font-serif-body text-[14px] text-dark bg-cream/40 border border-hairline px-3 py-2 outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>
      )}

      {/* Description */}
      <ul className="space-y-1.5 mb-6">
        {[
          ['Logi', 'każdy dzień: XP, rutyna, zasady, nastrój, notatki, kluczowy moment, XP per filar'],
          ['Questy', 'historia side questów, własnych i questów dziennych z tytułem, filarem i XP'],
          ['Przeglądy', 'tygodniowe i miesięczne: oceny filarów, refleksje, intencje'],
          ['Statystyki', 'globalne podsumowanie: streaki, rekordy, osiągnięcia, XP per filar'],
        ].map(([title, desc]) => (
          <li key={title as string} className="flex items-baseline gap-2">
            <Diamond size={4} className="text-gold-deep mt-1.5 shrink-0" />
            <p className="font-serif-body text-[12.5px] text-muted leading-relaxed">
              <span className="text-dark not-italic">{title}</span> — <span className="italic">{desc}</span>
            </p>
          </li>
        ))}
      </ul>

      {/* AI export */}
      <button
        onClick={() => wrap(() => exportAsMarkdown(uid, range), setExportingMd, 'Nie udało się wyeksportować dziennika.')}
        disabled={exportingMd}
        className="w-full flex items-center justify-center gap-2 bg-forest text-ivory border border-gold py-3 px-5 hover:bg-forest/85 transition-colors disabled:opacity-60 mb-2"
      >
        {exportingMd
          ? <Fleuron size={11} className="text-gold animate-pulse" />
          : <BrainCircuit size={12} strokeWidth={1.5} className="text-gold-light" />}
        <SmallCaps tone="ivory" tracking="luxury" size="xs">
          {exportingMd ? 'generuję dziennik…' : 'eksport dla AI · markdown'}
        </SmallCaps>
      </button>
      <p className="font-serif-body italic text-muted-light text-[12px] mb-4 px-1 leading-relaxed">
        jeden plik .md z całą historią, notatkami i refleksjami — gotowy do wklejenia w claude lub chatgpt.
      </p>

      {/* Pobierz wszystko */}
      <button
        onClick={() => wrap(() => exportAllAsCSV(uid, range), setExportingAll, 'Nie udało się wyeksportować wszystkich danych.')}
        disabled={exportingAll}
        className="w-full flex items-center justify-center gap-2 bg-gold text-dark-deep border border-gold py-3 px-5 hover:bg-gold-light transition-colors disabled:opacity-60 mb-4"
      >
        {exportingAll
          ? <Fleuron size={11} className="text-dark-deep animate-pulse" />
          : <Download size={12} strokeWidth={1.5} />}
        <SmallCaps tracking="luxury" size="xs" className="!text-dark-deep">
          pobierz wszystko · IV plików CSV
        </SmallCaps>
      </button>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Logi',       run: () => exportLogsAsCSV(uid, range),    set: setExportingLogs,    busy: exportingLogs,    err: 'Nie udało się wyeksportować danych.' },
          { label: 'Questy',     run: () => exportQuestsAsCSV(uid, range),  set: setExportingQuests,  busy: exportingQuests,  err: 'Nie udało się wyeksportować questów.' },
          { label: 'Przeglądy',  run: () => exportReviewsAsCSV(uid, range), set: setExportingReviews, busy: exportingReviews, err: 'Nie udało się wyeksportować przeglądów.' },
          { label: 'Statystyki', run: () => exportStatsAsCSV(uid),          set: setExportingStats,   busy: exportingStats,   err: 'Nie udało się wyeksportować statystyk.' },
        ].map(b => (
          <button
            key={b.label}
            onClick={() => wrap(b.run, b.set, b.err)}
            disabled={b.busy}
            className="border border-hairline text-dark hover:border-gold py-2.5 px-4 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {b.busy
              ? <Fleuron size={10} className="text-gold-deep animate-pulse" />
              : <Download size={11} strokeWidth={1.5} className="text-gold-deep" />}
            <SmallCaps tone="dark" tracking="luxury" size="xs">
              {b.busy ? '…' : b.label}
            </SmallCaps>
          </button>
        ))}

        <button
          onClick={() => router.push('/report')}
          className="border border-hairline text-dark hover:border-gold py-2.5 px-4 transition-colors flex items-center gap-2"
        >
          <Printer size={11} strokeWidth={1.5} className="text-gold-deep" />
          <SmallCaps tone="dark" tracking="luxury" size="xs">
            podsumowanie roczne
          </SmallCaps>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 border border-red-200 bg-red-50/50 px-3 py-2 mt-3">
          <Diamond size={5} className="text-red-700 mt-1.5 shrink-0" />
          <p className="font-serif-body italic text-red-800 text-[13px] leading-snug">{error}</p>
        </div>
      )}
    </section>
  )
}
