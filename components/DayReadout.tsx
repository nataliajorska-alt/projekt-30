'use client'
import { formatDayLong } from '@/lib/gameLogic'

/**
 * „Wiersz księgi" — stały odczyt wybranego dnia pod kalendarzem
 * (tap-to-read zamiast hover-tooltipa; hover nie istnieje na telefonie).
 * Wspólny dla YearHeatmap i YearRosette: min-h rezerwuje miejsce, więc
 * wybór dnia nie skacze layoutem.
 */
export default function DayReadout({
  day,
  placeholder,
}: {
  day: { date: string; xp: number; moment?: string; future?: boolean } | null
  placeholder: string
}) {
  return (
    <div className="min-h-[44px] mt-3 pt-3 border-t border-border/60 flex items-center">
      {day ? (
        <div className="flex items-baseline gap-3 flex-wrap w-full">
          <span className="font-serif-body italic text-dark text-[13.5px]">
            {formatDayLong(day.date)}
          </span>
          {day.future ? (
            <span className="font-serif-body italic text-muted-light text-[13.5px]">
              ten dzień jeszcze przed Tobą
            </span>
          ) : (
            <>
              <span className="font-display text-gold-deep text-[15px]">
                {day.xp.toLocaleString('pl-PL')} XP
              </span>
              {day.moment && (
                <span className="inline-flex items-baseline gap-1.5 min-w-0">
                  <span aria-hidden className="self-center w-[5px] h-[5px] rotate-45 shrink-0 bg-gold-deep" />
                  <span className="font-serif-body italic text-gold-deep text-[13.5px]">
                    {day.moment}
                  </span>
                </span>
              )}
            </>
          )}
        </div>
      ) : (
        <p className="font-serif-body italic text-muted-light text-[12.5px]">
          {placeholder}
        </p>
      )}
    </div>
  )
}
