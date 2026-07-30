'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useGameData } from '@/hooks/useGameData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { filterItemsForMinimumDay } from '@/lib/minimumDayLogic'
import { SmallCaps, Diamond, Fleuron, GoldRule, CornerBrackets } from '@/components/ui'

// Wieczorne domknięcie dnia — jeden ceremonialny ekran spinający istniejącą
// rutynę wieczorną (te same id i toggleRoutine co checklista — zero drugiego
// źródła prawdy) plus deklarację „ostatni papieros dnia". Deklaracja to czysty
// znacznik w logu dnia (smokeLastOfDayAt), bez XP i bez blokowania — pull, not push.

interface EveningClosingProps {
  onClose: () => void
}

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

export default function EveningClosing({ onClose }: EveningClosingProps) {
  const { todayLog, toggleRoutine, setLastCigaretteOfDay } = useGameData()
  const { getEffectiveItems } = useRoutineConfig()
  const [marking, setMarking] = useState(false)

  // Escape zamyka — parytet z resztą overlayów apki.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!todayLog) return null

  const done = todayLog.completedRoutine ?? []
  const isMinimum = todayLog.dayMode === 'minimum'
  const reason = todayLog.minimumReason
  const full = getEffectiveItems('evening', false)
  const items = isMinimum && reason ? filterItemsForMinimumDay(full, reason) : full
  const remaining = items.filter(i => !done.includes(i.id)).length
  // Pusty przefiltrowany zestaw = nic do zrobienia = domknięty (spójnie z DashboardNow.isDone).
  const allDone = remaining === 0

  const cigs = todayLog.cigarettes ?? []
  const lastCig = cigs.length > 0 ? cigs[cigs.length - 1] : null
  const markedAt = todayLog.smokeLastOfDayAt ?? null
  const smokedAfterMark = markedAt !== null && lastCig !== null && lastCig.timestamp > markedAt

  const mark = async (on: boolean) => {
    if (marking) return
    setMarking(true)
    try {
      await setLastCigaretteOfDay(on)
    } catch (err) {
      console.error('evening closing mark error:', err)
    } finally {
      setMarking(false)
    }
  }

  return (
    // z-[90] świadomie PONIŻEJ AchievementUnlockModal (z-[100]) i LevelUpModal
    // (z-[110]) — odhaczanie rutyny tutaj nalicza XP, więc celebracje muszą
    // wjechać NAD ten ekran, nie odtworzyć się niewidocznie pod spodem.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Domknięcie dnia"
      className="fixed inset-0 z-[90] bg-forest-deep grain-linen animate-fade-in overflow-y-auto"
    >
      <div className="pointer-events-none absolute inset-6 border border-gold-light/40" />
      <div className="pointer-events-none absolute inset-9 border border-gold-light/15" />
      <div className="pointer-events-none absolute inset-12">
        <CornerBrackets size={20} tone="gold" weight={1} />
      </div>
      <div className="relative min-h-full flex flex-col items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs" as="div" className="text-center mb-6">
            Domknięcie dnia
          </SmallCaps>
          <h2 className="font-display text-ivory text-3xl text-center leading-tight mb-2">
            Wieczór należy do Ciebie.
          </h2>
          <p className="font-serif-body italic text-parchment text-[14px] text-center mb-8">
            zamknij dzień świadomie, nie w biegu.
          </p>

          {/* Rutyna wieczorna — te same pozycje i stan co checklista */}
          <div className="space-y-1.5 mb-7">
            {items.map(item => {
              const checked = done.includes(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggleRoutine(item.id, item.xp)}
                  className={clsx(
                    'w-full flex items-center gap-3.5 px-4 py-3 border text-left transition-all',
                    checked
                      ? 'border-gold/40 bg-gold/5'
                      : 'border-ivory/15 bg-forest/20 hover:bg-forest/40 hover:border-gold/40',
                  )}
                >
                  <Diamond size={6} className={checked ? 'text-gold' : 'text-ivory/30'} filled={checked} />
                  <span
                    className={clsx(
                      'font-serif-body text-[14px] leading-snug',
                      checked ? 'text-parchment/50 line-through' : 'text-parchment',
                    )}
                  >
                    {item.text}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Ostatni papieros dnia — deklaracja, nie blokada */}
          <div className="border border-ivory/15 px-4 py-4 mb-7">
            <SmallCaps tone="gold-light" tracking="luxury" size="xs" as="div" className="mb-2.5">
              Papieros
            </SmallCaps>
            {cigs.length === 0 ? (
              <>
                <p className="font-serif-body italic text-parchment text-[13.5px] leading-relaxed">
                  dziś zero. nie ma czego domykać — to już jest domknięcie.
                </p>
                {/* Osierocona deklaracja (papieros cofnięty po deklaracji) — droga odwrotu */}
                {markedAt !== null && (
                  <button
                    onClick={() => mark(false)}
                    disabled={marking}
                    className={clsx(
                      'mt-3 font-ui uppercase tracking-[0.22em] text-[9px] text-parchment/50 hover:text-parchment transition-colors',
                      marking && 'opacity-50 pointer-events-none',
                    )}
                  >
                    cofnij deklarację „ostatni na dziś"
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="font-serif-body italic text-parchment/80 text-[13px] leading-relaxed mb-3">
                  dzisiaj: {cigs.length}{lastCig && <> · ostatni o {fmtTime(lastCig.timestamp)}</>}
                </p>
                {markedAt === null ? (
                  <button
                    onClick={() => mark(true)}
                    disabled={marking}
                    className={clsx(
                      'w-full border border-gold/50 hover:bg-gold/10 px-4 py-2.5 font-ui uppercase tracking-[0.28em] text-[10px] text-gold-light transition-colors',
                      marking && 'opacity-50 pointer-events-none',
                    )}
                  >
                    to był ostatni na dziś
                  </button>
                ) : smokedAfterMark ? (
                  <>
                    <p className="font-serif-body italic text-parchment/70 text-[12.5px] leading-relaxed mb-3">
                      po deklaracji ({fmtTime(markedAt)}) dopisał się jeszcze papieros.
                      to dane, nie wyrok.
                    </p>
                    <button
                      onClick={() => mark(true)}
                      disabled={marking}
                      className={clsx(
                        'w-full border border-gold/50 hover:bg-gold/10 px-4 py-2.5 font-ui uppercase tracking-[0.28em] text-[10px] text-gold-light transition-colors',
                        marking && 'opacity-50 pointer-events-none',
                      )}
                    >
                      zadeklaruj ponownie
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2.5">
                      <Diamond size={5} className="text-gold" filled />
                      <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                        ostatni na dziś · {fmtTime(markedAt)}
                      </SmallCaps>
                    </span>
                    <button
                      onClick={() => mark(false)}
                      disabled={marking}
                      className={clsx(
                        'font-ui uppercase tracking-[0.22em] text-[9px] text-parchment/50 hover:text-parchment transition-colors',
                        marking && 'opacity-50 pointer-events-none',
                      )}
                    >
                      cofnij
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <GoldRule variant="diamond" tone="gold" className="max-w-xs mx-auto mb-5" />

          {/* Status domknięcia */}
          <div className="text-center mb-8">
            {allDone ? (
              <>
                <Fleuron size={18} className="text-gold mx-auto mb-3 inline-block" />
                <p className="font-serif-body italic text-parchment text-[14px]">
                  wieczór domknięty. możesz odpocząć.
                </p>
              </>
            ) : (
              <p className="font-serif-body italic text-parchment/70 text-[13px]">
                do domknięcia: {remaining} {remaining === 1 ? 'pozycja' : remaining >= 2 && remaining < 5 ? 'pozycje' : 'pozycji'}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full text-center font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors"
          >
            zamknij  ◆
          </button>
        </div>
      </div>
    </div>
  )
}
