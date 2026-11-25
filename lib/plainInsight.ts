// Zwykły język dla zdań silnika wzorców tygodnia (lib/weeklyHypotheses).
//
// Szablony mówią językiem statystyki: „(n=182, średnia siła)", „ρ=0,19",
// „Effect size ε² = 0,05", angielskie „mood". Do czytania na co dzień to szum —
// siłę i pewność sygnału pokazuje etykieta (pewny / wstępny / słaby), a liczby
// zostają w szczegółach. Działa też na tekstach zapisanych wcześniej w cache'u
// (Firestore), więc nie zależy od wersji szablonów.
export function plainInsight(text: string): string {
  return text
    // nawiasy ze statystyką: (n=182, średnia siła) · (ρ=0,19, n=182) · (3,4 vs 3,0, n=120)
    .replace(/\s*\([^()]*(?:n=|ρ=|ε²)[^()]*\)/g, '')
    // „Effect size 0,23 — słaba." · „Effect size ε² = 0,05." · „Effect 0,31 — średnia."
    .replace(/\s*Effect(?: size)?\s[^.]*\./gi, '')
    // „Siła efektu słaba." — siłę niesie etykieta pewności
    .replace(/\s*Siła efektu \S+\./g, '')
    .replace(/\bmoodu\b/g, 'nastroju')
    .replace(/\bmood\b/g, 'nastrój')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.,?])/g, '$1')
    .trim()
}

/** Fragmenty zdania z zaznaczeniem *akcentu* (markdown-owe gwiazdki w pytaniach). */
export function emphasisParts(text: string): { text: string; em: boolean }[] {
  const out: { text: string; em: boolean }[] = []
  const re = /\*([^*]+)\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), em: false })
    out.push({ text: m[1], em: true })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), em: false })
  return out
}
