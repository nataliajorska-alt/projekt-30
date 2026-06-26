'use client'
import { useState } from 'react'
import { pickPozwolenie } from '@/lib/pozwolenie-data'

// Cicha karta „Pozwolenie na dziś" na dashboardzie (sekcja IV „na marginesie").
// Świadomie NIC nie utrwala — brak logu, licznika, serii, XP, badge'a (wzór /mostek).
// pull, nie push: domyślnie pokazuje tylko zaproszenie, dopóki sama nie zajrzysz.
// Brak przycisku „zrobione" — to pozwolenie, nie zadanie. Wolno ją zostawić.
export default function PozwolenieCard() {
  const [pozwolenie, setPozwolenie] = useState<string | null>(null)

  // ── Zwinięte: samo zaproszenie. Nic nie podsuwa, dopóki nie dotkniesz. ──
  if (pozwolenie === null) {
    return (
      <button
        type="button"
        onClick={() => setPozwolenie(pickPozwolenie())}
        className="w-full text-left grid grid-cols-[auto_1fr] gap-4 items-center mt-4 mb-4 px-5 py-3.5 border border-hairline bg-cream/40 hover:border-gold transition-colors group"
      >
        <span className="w-9 h-9 flex items-center justify-center border border-hairline text-gold text-[13px] group-hover:border-gold transition-colors">
          ✿
        </span>
        <div className="min-w-0">
          <h4 className="font-display text-dark text-lg leading-none tracking-tight">
            Pozwolenie na dziś
          </h4>
          <p className="font-serif-body italic text-muted text-[13.5px] mt-1 leading-snug">
            coś małego, tylko dla przyjemności
          </p>
        </div>
      </button>
    )
  }

  // ── Odsłonięte: jeden życioumilacz. Zero „zrobione", zero liczenia. ──
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 items-start mt-4 mb-4 px-5 py-3.5 border border-hairline bg-cream/40">
      <span className="w-9 h-9 flex items-center justify-center border border-hairline text-gold text-[13px]">
        ✿
      </span>
      <div className="min-w-0">
        <p className="font-serif-body text-dark text-[15px] leading-snug">
          {pozwolenie}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => setPozwolenie(pickPozwolenie())}
            className="font-serif-body italic text-gold-deep text-[13px] hover:text-gold transition-colors"
          >
            inne
          </button>
          <span className="text-muted text-[13px]">·</span>
          <button
            type="button"
            onClick={() => setPozwolenie(null)}
            className="font-serif-body italic text-muted text-[13px] hover:text-dark transition-colors"
          >
            zostaw na inny dzień
          </button>
        </div>
      </div>
    </div>
  )
}
