'use client'
import Link from 'next/link'

// Cichy, stały link do /mostek. Świadomie bez badge'a, bez liczby, bez XP —
// Mostek niczego nie liczy, więc jego wejście też nie krzyczy.
export default function MostekCard() {
  return (
    <Link
      href="/mostek"
      className="grid grid-cols-[auto_1fr] gap-4 items-center mt-4 mb-4 px-5 py-3.5 border border-hairline bg-cream/40 hover:border-gold transition-colors group"
    >
      <span className="w-9 h-9 flex items-center justify-center border border-hairline text-gold text-[13px] group-hover:border-gold transition-colors">
        ❖
      </span>
      <div className="min-w-0">
        <h4 className="font-display text-dark text-lg leading-none tracking-tight">
          Mostek
        </h4>
        <p className="font-serif-body italic text-muted text-[13.5px] mt-1 leading-snug">
          ciężar w klatce, mimo że głowa już sobie poradziła — oddech, nie analiza
        </p>
      </div>
    </Link>
  )
}
