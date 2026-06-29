// Brief na jutro — eksport danych dnia do zewnętrznego asystenta (np. Claude),
// który układa z nich plan godzina po godzinie. Czysta funkcja na wejściu
// zebranym przez komponent; zero hooków, łatwa do testu node'em.

export interface BriefingRoutineSection {
  label: string
  items: string[]
}

export interface BriefingQuest {
  title: string
  description: string
  pillar: string
}

export interface BriefingCycle {
  phaseName: string
  cycleDay: number
  energy: string          // 'niska' | 'rosnąca' | 'szczyt' | 'opadająca'
  description: string
  tips: string[]
  suggestMinimum: boolean
}

export interface BriefingMood {
  daysWithData: number
  avgEnergy: number | null  // 1–5, zaokrąglone do 0.1
  avgMood: number | null
}

export interface BriefingSmoking {
  phaseLabel: string
  softTarget: string
  avg7days: number | null
}

export interface BriefingInput {
  target: 'today' | 'tomorrow' // dla którego dnia układamy plan
  nowLabel: string | null      // aktualna godzina "13:45" — tylko dla 'today', do planu reszty dnia
  dateLabel: string          // np. "czwartek, 11 czerwca 2026"
  dayOfProject: number
  routineSections: BriefingRoutineSection[]
  quests: BriefingQuest[]
  rules: string[]
  cycle: BriefingCycle | null
  mood: BriefingMood
  currentStreak: number
  smoking: BriefingSmoking | null
}

const fmt1 = (v: number | null) => (v === null ? '—' : v.toFixed(1).replace('.', ','))

export function buildTomorrowBriefing(input: BriefingInput): string {
  const lines: string[] = []
  const isToday = input.target === 'today'
  const when = isToday ? 'dziś' : 'jutro'

  lines.push(`# Brief na ${when} — ${input.dateLabel} (dzień ${input.dayOfProject}/365 mojego rocznego projektu)`)
  lines.push('')
  if (isToday) {
    const odKiedy = input.nowLabel ? `od teraz (jest ${input.nowLabel})` : 'od teraz'
    lines.push(`Ułóż mi konkretny plan na resztę dzisiejszego dnia, godzina po godzinie — ${odKiedy} do snu.`)
  } else {
    lines.push('Ułóż mi konkretny plan jutrzejszego dnia, godzina po godzinie, od pobudki do snu.')
  }
  lines.push('')
  lines.push('## Jak planować — o mnie')
  if (isToday) {
    lines.push(`- **Planuję dzień w trakcie${input.nowLabel ? ` — jest ${input.nowLabel}` : ''}.** Zaplanuj realnie **resztę dnia od teraz**, nie cofaj się do pobudki. Część rutyny porannej mogłam już ogarnąć; co zostało z rutyny i posiłków, wpleć od bieżącej godziny.`)
  }
  lines.push('- Mam ADHD. Plan ma podawać **jedną rzecz naraz**: krótkie bloki (25–45 min), bufory między zadaniami, jasne „od–do”. Żadnych długich równoległych list.')
  lines.push('- Najtrudniejszą rzecz dnia wstaw tam, gdzie energia będzie najwyższa (kontekst ciała niżej).')
  lines.push('- **Przerwy wpisz do planu** jako osobne bloki z godzinami — są częścią planu, nie nagrodą.')
  lines.push('- Zaplanuj **4 posiłki** o konkretnych godzinach (śniadanie, obiad, przekąska, kolacja).')
  lines.push('- Wpleć **picie wody** w cały dzień — np. szklanka przy każdej zmianie bloku, wprost w planie.')
  lines.push('- Dodaj na końcu **wersję minimum**: 3 rzeczy, które ratują dzień, gdyby się posypał.')
  lines.push('- Wskaż jedną rzecz-kotwicę na sam początek dnia (łatwy start, bez decyzji).')
  lines.push('')

  lines.push('## Kontekst ciała i energii')
  if (input.cycle) {
    const c = input.cycle
    lines.push(`- Faza cyklu ${when}: **${c.phaseName}** (dzień ${c.cycleDay}) — energia: ${c.energy}. ${c.description}`)
    for (const tip of c.tips) lines.push(`  - ${tip}`)
    if (c.suggestMinimum) {
      lines.push('  - Ta faza sugeruje lżejszy dzień — planuj ambitnie tylko to, co konieczne.')
    }
  } else {
    lines.push('- Faza cyklu: brak danych.')
  }
  if (input.mood.daysWithData > 0) {
    lines.push(`- Ostatnie ${input.mood.daysWithData} dni z danymi: energia śr. ${fmt1(input.mood.avgEnergy)}/5, nastrój śr. ${fmt1(input.mood.avgMood)}/5.`)
  } else {
    lines.push('- Nastrój/energia: brak świeżych danych.')
  }
  if (input.currentStreak > 0) {
    lines.push(`- Mój streak: ${input.currentStreak} dni z rzędu — plan ma go chronić (wystarczy minimum rutyny, żeby nie pękł).`)
  }
  if (input.smoking) {
    const s = input.smoking
    const avg = s.avg7days !== null ? ` Średnia z 7 dni: ${fmt1(s.avg7days)}/dzień.` : ''
    lines.push(`- Papierosy: faza „${s.phaseLabel}”, cel miękki: ${s.softTarget}.${avg} Wpleć świadome przerwy zamiast palenia z automatu; bez moralizowania.`)
  }
  lines.push('')

  lines.push('## Stałe elementy z mojej aplikacji (wpleć w plan)')
  for (const section of input.routineSections) {
    if (section.items.length === 0) continue
    lines.push(`### ${section.label}`)
    for (const item of section.items) lines.push(`- ${item}`)
    lines.push('')
  }

  if (input.quests.length > 0) {
    lines.push(`### Questy dnia (zadania specjalne na ${when})`)
    for (const q of input.quests) {
      lines.push(`- **${q.title}** _(filar: ${q.pillar})_ — ${q.description}`)
    }
    lines.push('')
  }

  if (input.rules.length > 0) {
    lines.push('### Zasady dnia (trzymam codziennie, przypomnij o nich w podsumowaniu)')
    for (const r of input.rules) lines.push(`- ${r}`)
    lines.push('')
  }

  lines.push('## Moje rzeczy z kalendarza (dopisuję sama poniżej)')
  lines.push('- ')
  lines.push('- ')
  lines.push('')

  lines.push('## Czego oczekuję')
  lines.push('Plan godzina po godzinie z wpisanymi przerwami, 4 posiłkami i wodą, jedną kotwicą na rano, najtrudniejszą rzeczą w oknie najwyższej energii i wersją minimum na koniec.')
  lines.push('')
  lines.push('Ton planu: ma mnie nieść. Pisz ciepło i z wiarą we mnie — przy trudniejszych blokach dodaj jedno krótkie zdanie-zachętę, a na początku planu przypomnij mi w 1–2 zdaniach, dlaczego ten dzień ma znaczenie w moim rocznym projekcie. Bez suchego wykazu, ale też bez lania wody — każda zachęta konkretna i osobista.')

  return lines.join('\n')
}
