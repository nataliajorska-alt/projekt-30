'use client'
import Link from 'next/link'
import { useCBT } from '@/hooks/useCBT'
import { XP_VALUES } from '@/lib/gameLogic'

// Liczebnik PL: 1 wpis · 2–4 wpisy · 5+ wpisów (z wyjątkiem 12–14).
function plWpis(n: number): string {
  const t = n % 10, h = n % 100
  if (n === 1) return 'wpis'
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return 'wpisy'
  return 'wpisów'
}

// Cicha karta wejścia do /mysli na dashboardzie (sekcja IV „na marginesie").
// Pokazuje dzisiejszą aktywność; gdy nic dziś — delikatne „+10" (dzienny capture).
export default function CBTCard() {
  const { loading, todayCount } = useCBT()
  if (loading) return null

  const sub = todayCount > 0
    ? `${todayCount} ${plWpis(todayCount)} dziś — wróć, gdy coś znów zawiruje`
    : 'złap dzisiejszą myśl albo rozłóż emocję na czynniki'

  return (
    <Link
      href="/mysli"
      className="grid grid-cols-[auto_1fr_auto] gap-4 items-center mt-4 mb-4 px-5 py-3.5 border border-hairline bg-cream/40 hover:border-gold transition-colors group"
    >
      <span className="w-9 h-9 flex items-center justify-center border border-hairline text-gold text-[13px] group-hover:border-gold transition-colors">
        ❧
      </span>

      <div className="min-w-0">
        <h4 className="font-display text-dark text-lg leading-none tracking-tight">
          Myśli i emocje
        </h4>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-1 leading-snug">
          {sub}
        </p>
      </div>

      {todayCount === 0 && (
        <div className="text-right shrink-0">
          <div className="font-display italic text-gold-deep text-lg whitespace-nowrap">
            <span className="mr-0.5">◆</span> +{XP_VALUES.cbtCapture}
          </div>
        </div>
      )}
    </Link>
  )
}
