'use client'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Undo2, X } from 'lucide-react'
import { useGameData } from '@/hooks/useGameData'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { getPhaseForDate } from '@/lib/cycle-data'
import { CIGARETTE_CONTEXTS, REWARD_REPLACEMENTS, STRESS_TOOLS } from '@/lib/smoke-data'
import { ceilingFor, smokePacing, activeWindowFor, emergencyDaysUsedInMonth, EMERGENCY_DAYS_PER_MONTH } from '@/lib/smokeStats'
import { todayKey, getEffectiveNow } from '@/lib/gameLogic'
import type { CigaretteContext } from '@/types'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

interface SmokeButtonProps {
  onClose: () => void
}

// Konteksty emocjonalne dostają zamiennik funkcji przed logowaniem (sedno fazy 2).
// Kontekstowe (kawa/auto/nuda) idą regułą, nie w locie — logują się od razu.
const INTERVENE: Record<string, { intro: string; items: string[] }> = {
  quest: {
    intro: 'to samo domknięcie „zrobione", inny nośnik. spróbuj jednego zamiast papierosa:',
    items: REWARD_REPLACEMENTS,
  },
  stres: {
    intro: 'papieros gasi napięcie na 4 minuty i wraca. narzędzie realnie reguluje — spróbuj jednego:',
    items: STRESS_TOOLS,
  },
}

// „mniej więcej kiedy" — godzina zegarowa + ile temu. Spokojnie, bez pełnej gramatyki godzin.
function formatLastSmoke(timestamp: number): string {
  const d = new Date(timestamp)
  const clock = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  const diffMin = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  let rel: string
  if (diffMin < 1) rel = 'przed chwilą'
  else if (diffMin < 60) rel = `${diffMin} min temu`
  else {
    const h = Math.floor(diffMin / 60)
    const m = diffMin % 60
    rel = m === 0 ? `${h} h temu` : `${h} h ${m} min temu`
  }
  return `${rel} · ${clock}`
}

// Czas trwania po polsku, zwięźle. Do odstępu „~1 co …".
function fmtDur(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

// „Reszta dnia" — zaokrąglone godziny, spokojnie.
function fmtHoursLeft(min: number): string {
  if (min <= 0) return 'końcówka'
  if (min < 60) return `${min} min`
  return `~${Math.round(min / 60)} h`
}

export default function SmokeButton({ onClose }: SmokeButtonProps) {
  const { todayLog, logCigarette, removeLastCigarette, stats, toggleSmokeEmergencyDay } = useGameData()
  const { logs: cycleLogs } = useCycleData()
  const { settings: cycleSettings } = useCycleSettings()
  const [showContextPicker, setShowContextPicker] = useState(false)
  const [justLogged, setJustLogged] = useState(false)
  const [interveneContext, setInterveneContext] = useState<CigaretteContext | null>(null)
  const [postponed, setPostponed] = useState(false)

  const todayCount = todayLog?.cigarettes?.length ?? 0
  const lastEntry = todayLog?.cigarettes?.[todayLog.cigarettes.length - 1]
  const lastContext = lastEntry?.context
  // Deklaracja „ostatni na dziś" z wieczornego domknięcia — pokazywana łagodnie,
  // dopóki żaden papieros nie został zalogowany po niej (wtedy to już dane, nie znak).
  const lastOfDayAt = todayLog?.smokeLastOfDayAt ?? null
  // todayCount > 0: przy zerze papierosów deklaracja jest bezprzedmiotowa (np.
  // osierocona po cofnięciu jedynego wpisu) — nie pokazujemy jej pod licznikiem 0.
  const declaredLast = lastOfDayAt !== null && todayCount > 0 && !!lastEntry && lastEntry.timestamp <= lastOfDayAt

  // Tempo dnia — spokojne lustro: ile do sufitu i ile aktywnego dnia przed Tobą.
  // Bez blokady, bez czerwieni; tylko fakty, byś sama zobaczyła, czy warto zwolnić.
  const today = todayKey()
  const ceilingInfo = ceilingFor(today)
  const now = getEffectiveNow()
  const weekday = (now.getDay() + 6) % 7 // 0=Pon … 6=Nd

  // Dzień awaryjny — sufit zdjęty, bez presji; limit/miesiąc.
  const emergencyDays = stats.smokeEmergencyDays ?? []
  const isEmergencyToday = emergencyDays.includes(today)
  const emergencyLeft = Math.max(0, EMERGENCY_DAYS_PER_MONTH - emergencyDaysUsedInMonth(emergencyDays, today.slice(0, 7)))

  // Tempo tylko poza dniem awaryjnym — w awaryjnym nie liczymy w górę.
  const pacing = ceilingInfo && !isEmergencyToday
    ? smokePacing(now.getHours(), now.getMinutes(), todayCount, ceilingInfo.ceiling, activeWindowFor(weekday))
    : null

  // Łagodność cyklu — w fazie lutealnej głód nikotynowy jest mocniejszy.
  const cycleInfo = cycleLogs.length > 0 ? getPhaseForDate(cycleLogs[0].startDate, todayKey(), cycleSettings) : null
  const isLuteal = cycleInfo?.phase.id === 'lutealna'

  let paceLine = ''
  if (pacing) {
    if (pacing.over) paceLine = 'nad sufitem — ale to dane, nie wyrok. jeśli chcesz, odłóż tego jednego.'
    else if (pacing.atCeiling) paceLine = 'to twój sufit na dziś — kolejny będzie ponad.'
    else if (pacing.pace === 'ahead') paceLine = `szybciej niż równe tempo, a jeszcze ${fmtHoursLeft(pacing.minutesLeftActive)} dnia przed Tobą. może rozłóż resztę?`
    else if (pacing.intervalMin) paceLine = `spokojne tempo — ~1 co ${fmtDur(pacing.intervalMin)} utrzyma sufit.`
    else paceLine = `${pacing.remaining} do sufitu.`
  }

  // Pasek budżetu — pip per papieros, do sufitu złoto, ponad sufit forest, reszta pusta.
  const pipCount = pacing ? Math.min(28, Math.max(pacing.ceiling, todayCount)) : 0

  useEffect(() => {
    if (!justLogged) return
    const t = setTimeout(() => setJustLogged(false), 1200)
    return () => clearTimeout(t)
  }, [justLogged])

  const handleQuickLog = async () => {
    await logCigarette()
    setJustLogged(true)
  }

  const handleContextLog = async (context: CigaretteContext) => {
    await logCigarette(context)
    setShowContextPicker(false)
    setInterveneContext(null)
    setJustLogged(true)
  }

  // Tap kontekstu: emocjonalny (nagroda/stres) → zamiennik funkcji; reszta → log od razu.
  const handleContextTap = (ctx: CigaretteContext) => {
    // W dniu awaryjnym bez zamiennika-lekcji — palisz dowolnie, bez presji.
    if (!isEmergencyToday && (ctx === 'quest' || ctx === 'stres')) setInterveneContext(ctx)
    else handleContextLog(ctx)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-forest-deep/85 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-ivory border border-gold-light/40 w-full md:max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-hairline">
          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Papieros
            </SmallCaps>
            <h2 className="font-heading text-dark text-xl mt-1">Spokojny licznik</h2>
            <p className="font-serif-body italic text-muted text-[12.5px] mt-1">
              to są dane, nie ocena.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="text-muted-light hover:text-dark transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {postponed ? (
          /* ── Odłożone — po wyborze zamiennika ───────────────────────── */
          <div className="px-6 py-10 text-center">
            <Fleuron size={16} className="text-gold-deep mx-auto mb-4 inline-block" />
            <h3 className="font-heading text-dark text-lg">Odłożone</h3>
            <p className="font-serif-body italic text-muted text-[13px] mt-2 leading-relaxed">
              dałaś sobie chwilę. wróć, jeśli za parę minut nadal będziesz chciała —
              to nadal będzie tylko decyzja, nie porażka.
            </p>
            <button
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-3 bg-dark-deep text-ivory border border-gold px-10 py-3 hover:bg-forest transition-all"
            >
              <SmallCaps tone="ivory" tracking="luxury" size="xs">zamykam</SmallCaps>
            </button>
            <button
              onClick={() => setPostponed(false)}
              className="block mx-auto mt-3 text-muted-light hover:text-dark transition-colors"
            >
              <SmallCaps tone="muted" tracking="luxury" size="xs">wróć do licznika</SmallCaps>
            </button>
          </div>
        ) : interveneContext ? (
          /* ── Zamiennik funkcji — nagroda / stres ────────────────────── */
          <div className="px-6 py-6">
            <div className="flex items-center gap-2 mb-3">
              <Fleuron size={9} className="text-gold-deep" />
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                {interveneContext === 'stres' ? 'zanim zgasisz stres papierosem' : 'zanim nagrodzisz się papierosem'}
              </SmallCaps>
            </div>
            <p className="font-serif-body italic text-muted text-[12.5px] mb-4 leading-relaxed">
              {INTERVENE[interveneContext].intro}
            </p>
            <div className="space-y-2 mb-5">
              {INTERVENE[interveneContext].items.slice(0, 4).map((t) => (
                <div key={t} className="flex items-start gap-2.5 border border-hairline bg-ivory px-3 py-2.5">
                  <Diamond size={4} className="text-gold mt-[5px] shrink-0" />
                  <span className="font-serif-body text-[13px] text-dark leading-snug">{t}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setInterveneContext(null); setPostponed(true) }}
              className="w-full py-3.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-all"
            >
              <SmallCaps tone="ivory" tracking="luxury" size="sm">spróbuję to — odłóż papierosa</SmallCaps>
            </button>
            <button
              onClick={() => interveneContext && handleContextLog(interveneContext)}
              className="w-full py-2.5 mt-2 border border-hairline text-dark hover:border-gold transition-colors"
            >
              <SmallCaps tone="muted" tracking="luxury" size="xs">i tak zapalę — zaloguj</SmallCaps>
            </button>
            <button
              onClick={() => setInterveneContext(null)}
              className="w-full py-2 mt-1 text-muted-light hover:text-dark transition-colors"
            >
              <SmallCaps tone="muted" tracking="luxury" size="xs">‹ wróć</SmallCaps>
            </button>
          </div>
        ) : !showContextPicker ? (
          <div className="px-6 py-6">
            {/* Licznik */}
            <div className="text-center mb-7">
              <p className="font-display text-dark text-6xl leading-none tabular-nums">
                {todayCount}
              </p>
              <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-3 block">
                dzisiaj
              </SmallCaps>
              {lastEntry && (
                <p className="font-serif-body italic text-muted text-[12.5px] mt-3">
                  ostatni: {formatLastSmoke(lastEntry.timestamp)}
                  {lastContext && (
                    <> · {CIGARETTE_CONTEXTS.find(c => c.id === lastContext)?.label.toLowerCase()}</>
                  )}
                </p>
              )}
              {declaredLast && (
                <p className="font-serif-body italic text-gold-deep text-[12px] mt-1.5">
                  zadeklarowany jako ostatni na dziś ◆
                </p>
              )}
            </div>

            {/* Dzień awaryjny — sufit zdjęty, bez presji */}
            {ceilingInfo && isEmergencyToday && (
              <div className="mb-6 border border-gold-light/50 bg-cream-warm/60 px-4 py-4 text-center">
                <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="block">Dzień awaryjny</SmallCaps>
                <p className="font-serif-body italic text-dark text-[13px] mt-2 leading-relaxed">
                  bez sufitu dziś — palisz swoim rytmem, bez liczenia w górę. słaby dzień to nie „nie spełniasz oczekiwań". jutro wracasz do rytmu.
                </p>
                {isLuteal && (
                  <p className="font-serif-body italic text-gold-deep/80 text-[11.5px] mt-2 leading-relaxed">
                    faza lutealna — głód mocniejszy. tym bardziej łagodnie.
                  </p>
                )}
                <button onClick={() => toggleSmokeEmergencyDay()} className="mt-3 text-muted-light hover:text-dark transition-colors">
                  <SmallCaps tone="muted" tracking="luxury" size="xs">cofnij oznaczenie</SmallCaps>
                </button>
              </div>
            )}

            {/* Tempo dnia — pasek budżetu + sufit + reszta dnia (spokojne lustro, nie blokada) */}
            {pacing && (
              <div className="mb-6 border border-hairline bg-cream-warm/40 px-4 py-3.5">
                {/* Pasek budżetu — pip per papieros */}
                <div className="flex items-center gap-[3px] mb-3.5">
                  {Array.from({ length: pipCount }).map((_, i) => {
                    const filled = i < todayCount
                    const overCeiling = i >= pacing.ceiling
                    return (
                      <span
                        key={i}
                        className="flex-1 h-[7px]"
                        style={{
                          minWidth: 4,
                          background: filled ? (overCeiling ? '#6B7D59' : '#8E7338') : '#E6DCC2',
                        }}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center justify-center gap-5 text-center">
                  <div>
                    <p className={clsx('font-display text-[26px] leading-none tabular-nums', pacing.over ? 'text-gold-deep' : 'text-dark')}>
                      {pacing.over ? Math.abs(pacing.remaining) : pacing.remaining}
                    </p>
                    <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block whitespace-nowrap">
                      {pacing.over ? 'nad sufitem o' : pacing.atCeiling ? 'na suficie' : 'do sufitu'}
                    </SmallCaps>
                  </div>
                  <span className="w-px h-9 bg-border" />
                  <div>
                    <p className="font-display text-[26px] leading-none tabular-nums text-dark">
                      {fmtHoursLeft(pacing.minutesLeftActive)}
                    </p>
                    <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-2 block whitespace-nowrap">
                      reszta dnia
                    </SmallCaps>
                  </div>
                </div>
                {paceLine && (
                  <p className="font-serif-body italic text-muted text-[12px] mt-3 pt-2.5 border-t border-hairline text-center leading-relaxed">
                    {paceLine}
                  </p>
                )}
                {isLuteal && (
                  <p className="font-serif-body italic text-gold-deep/80 text-[11.5px] mt-2 text-center leading-relaxed">
                    faza lutealna — głód mocniejszy dziś. bądź dla siebie łagodna.
                  </p>
                )}
                <div className="mt-3 pt-2.5 border-t border-hairline text-center">
                  {emergencyLeft > 0 ? (
                    <button onClick={() => toggleSmokeEmergencyDay()} className="text-muted-light hover:text-dark transition-colors">
                      <SmallCaps tone="muted" tracking="luxury" size="xs">
                        zły dzień? oznacz awaryjny · zostały {emergencyLeft} z {EMERGENCY_DAYS_PER_MONTH}
                      </SmallCaps>
                    </button>
                  ) : (
                    <SmallCaps tone="muted" tracking="luxury" size="xs" className="opacity-50 block">
                      dni awaryjne wykorzystane ({EMERGENCY_DAYS_PER_MONTH}/{EMERGENCY_DAYS_PER_MONTH})
                    </SmallCaps>
                  )}
                </div>
              </div>
            )}

            {/* Główna akcja */}
            <button
              onClick={handleQuickLog}
              className={clsx(
                'w-full py-4 border transition-all flex items-center justify-center gap-2 active:scale-[0.98]',
                justLogged
                  ? 'bg-forest text-ivory border-gold'
                  : 'bg-dark-deep text-ivory border-gold hover:bg-forest'
              )}
            >
              {justLogged ? (
                <>
                  <Diamond size={5} className="text-gold" filled />
                  <SmallCaps tone="ivory" tracking="luxury" size="sm">
                    zapisane
                  </SmallCaps>
                </>
              ) : (
                <>
                  <Diamond size={5} className="text-gold" />
                  <SmallCaps tone="ivory" tracking="luxury" size="sm">
                    + I papieros
                  </SmallCaps>
                </>
              )}
            </button>

            {/* Dodaj kontekst */}
            <button
              onClick={() => setShowContextPicker(true)}
              className="w-full py-3 mt-2 border border-hairline text-dark hover:border-gold transition-colors"
            >
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                + dodaj z kontekstem
              </SmallCaps>
            </button>

            {/* Cofnij */}
            {todayCount > 0 && (
              <button
                onClick={() => removeLastCigarette()}
                className="w-full py-2 mt-3 text-muted-light hover:text-dark transition-colors flex items-center justify-center gap-2"
              >
                <Undo2 size={10} strokeWidth={1.5} />
                <SmallCaps tone="muted" tracking="luxury" size="xs">
                  cofnij ostatni
                </SmallCaps>
              </button>
            )}
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Fleuron size={9} className="text-gold-deep" />
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                co go wywołało?
              </SmallCaps>
            </div>
            <p className="font-serif-body italic text-muted-light text-[12.5px] mb-4">
              nagroda i stres dostaną zamiennik; kontekstowe schodzą regułą.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CIGARETTE_CONTEXTS.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => handleContextTap(ctx.id)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 border border-hairline bg-ivory hover:border-gold transition-all"
                >
                  <span className="text-xl leading-none">{ctx.icon}</span>
                  <SmallCaps tone="dark" tracking="luxury" size="xs">
                    {ctx.label}
                  </SmallCaps>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowContextPicker(false)}
              className="w-full py-2 mt-4 text-muted-light hover:text-dark transition-colors"
            >
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                ‹ wróć
              </SmallCaps>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
