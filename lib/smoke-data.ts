import type { CigaretteContext, SmokingPhase } from '@/types'

// Filozofia (patrz PLAN_PALENIE.md): nie wróg. Spokojny licznik kilometrów.
// Ten plik NIGDY nie używa czerwonych alertów, pożaru, języka „relapse".
// Interwencje są zaproszeniami, nie blokadami — Smoke Protocol nigdy nie zatrzymuje siłą.

export interface CigaretteContextMeta {
  id: CigaretteContext
  label: string
  sublabel: string
  icon: string                   // emoji — pasuje do estetyki Ghost Protocol
  // Mikro-interwencje dopasowane do intensity (1-2 / 3 / 4-5).
  // Krótkie, konkretne, bez ocen.
  micro: string                  // intensity 1-2: 5 minut przerwy + drobiazg
  redirect: string               // intensity 3: konkretna mikro-nagroda
  permission: string             // intensity 4-5: „OK, zapal, ale zaloguj kontekst"
}

// Te same labels co Ghost Protocol — spójność języka.
export const SMOKE_INTENSITY_LABELS: Record<number, { name: string; description: string }> = {
  1: { name: 'Pyknięcie',  description: 'Ledwie zauważalne, przejdzie samo' },
  2: { name: 'Chmurka',    description: 'Wyraźne, ale nie zagrażające' },
  3: { name: 'Fala',       description: 'Ciało reaguje, sięgam po paczkę' },
  4: { name: 'Tsunami',    description: 'Jestem blisko, paczka w ręku' },
  5: { name: 'Krytycznie', description: 'Zapaliłabym za chwilę bez pytania' },
}

export const CIGARETTE_CONTEXTS: CigaretteContextMeta[] = [
  {
    id: 'kawa',
    label: 'Po kawie',
    sublabel: 'Klasyczny pakiet poranny',
    icon: '☕',
    micro:
      'Dopij kawę bez papierosa. Wypij szklankę wody zaraz po. Wstań od stołu — niech kawa skończy się w innym miejscu niż zaczęła.',
    redirect:
      'Druga kawa w ładnej filiżance. Jedna piosenka tylko dla siebie. Skropienie się perfumami zanim zdążysz pomyśleć.',
    permission:
      'OK. Zapal, ale po skończeniu wróć i zaloguj. To są dane, nie porażka.',
  },
  {
    id: 'posilek',
    label: 'Po posiłku',
    sublabel: 'Domknięcie jedzenia',
    icon: '🍽️',
    micro:
      'Wstań od stołu. Umyj zęby albo wypij coś zimnego. Trzy oddechy nosem.',
    redirect:
      'Mocna herbata albo gorzka czekolada — coś o wyraźnym smaku. Krótki spacer, nawet 5 minut.',
    permission:
      'Trawienie wciąż się dzieje. Zapal, jeśli musisz, i wróć z notatką co czujesz po.',
  },
  {
    id: 'quest',
    label: 'Po queście',
    sublabel: 'Nagroda za zrobione',
    icon: '✓',
    micro:
      '15 minut przerwy. Aplikacja zapyta jeszcze raz. Tymczasem: perfumy, jedna strona książki, ulubiona piosenka.',
    redirect:
      'Świadoma mikro-nagroda: kawa w ładnej filiżance, kwiat dla siebie, krótka rozmowa z przyjaciółką. To samo dopamine, inny nośnik.',
    permission:
      'Zapal. To była twoja pętla od dawna. Ale zaloguj — żebyś po miesiącu wiedziała ile z paczki idzie na questy.',
  },
  {
    id: 'stres',
    label: 'Stres',
    sublabel: 'Coś ścisnęło',
    icon: '🌩️',
    micro:
      'Pudełkowy oddech: 4 sekundy wdech, 4 trzymanie, 4 wydech, 4 trzymanie. Powtórz trzy razy. To zajmuje minutę i naprawdę działa.',
    redirect:
      'Wyjdź na 5 minut na powietrze bez papierosa. Zadzwoń do kogoś bliskiego — głos, nie wiadomość. Pisanie tego co czujesz w notatkach.',
    permission:
      'Stres nie zniknie od papierosa — ale wiem, że teraz tego nie chcesz słyszeć. Zapal, wróć, zaloguj kontekst „stres". Po fazie 1 zobaczysz, co naprawdę go wywołuje.',
  },
  {
    id: 'nuda',
    label: 'Nuda',
    sublabel: 'Pusta chwila',
    icon: '🌀',
    micro:
      'Wstań. Zrób cokolwiek przez 2 minuty: ścierka po blacie, jedno ułożenie, jedna rzecz odłożona na miejsce. Nuda zwykle nie przeżyje 2 minut ruchu.',
    redirect:
      'Wybierz konkretne mikro-zadanie z listy: ścielenie łóżka, krótkie ćwiczenie, jeden mail do napisania. Albo świadoma przyjemność: kąpiel, muzyka, podcast.',
    permission:
      'Nuda + papieros to najgłębiej zakorzeniona pętla — bo papieros wypełnia czas. Zapal, ale wróć z myślą: co zrobiłaby tu Natalia 30, której nie nudzi się przy sobie?',
  },
  {
    id: 'impreza',
    label: 'Impreza',
    sublabel: 'Wieczór towarzyski',
    icon: '🥂',
    micro:
      'Wypij szklankę wody między drinkami. Wyjdź na 5 minut bez papierosa — sprawdź czy wciąż chcesz po powrocie.',
    redirect:
      'Trzymaj coś w ręku: kieliszek, telefon, drink. Połowa palenia na imprezie to potrzeba zajęcia rąk.',
    permission:
      'Impreza ma swoje prawa. Zapal świadomie, wróć następnego dnia do 0. To jest cel fazy 5: papieros wybierany z radością, nie z głodu.',
  },
  {
    id: 'wieczor_z_kims',
    label: 'Wieczór z kimś',
    sublabel: 'Wino, rozmowa, blisko',
    icon: '🌙',
    micro:
      'Pij wino wolniej. Skup się na rozmowie — papieros zwykle pojawia się gdy myślą uciekasz.',
    redirect:
      'Zaproponuj drugą butelkę zamiast wyjścia na balkon. Albo wyjdźcie razem — ale bez papierosa, tylko popatrzeć.',
    permission:
      'To jest jeden z najcenniejszych kontekstów — bliskość, intymność. Zapal jeśli to wzmacnia wieczór, nie jeśli ucieka od niego.',
  },
  {
    id: 'samochod',
    label: 'W samochodzie',
    sublabel: 'Nuda + zamknięta przestrzeń',
    icon: '🚗',
    micro:
      'Włącz konkretny podcast albo playlistę. Otwórz okno bez palenia — sam powiew zmienia stan.',
    redirect:
      'Guma do żucia, mocne miętówki, woda. Cokolwiek do ust co nie jest papierosem.',
    permission:
      'Samochód to kontener z którego nie da się wyjść. Zapal jeśli musisz, ale w fazie 3 ten kontekst odetnij całkowicie (papieros tylko na zewnątrz, świadomie, z kurtką).',
  },
  {
    id: 'inne',
    label: 'Coś innego',
    sublabel: 'Nie wiem co to było',
    icon: '·',
    micro:
      'Zatrzymaj się. Co właściwie poczułaś chwilę temu? Nazwij to jednym słowem — nawet jeśli to „nie wiem".',
    redirect:
      'Trzy oddechy. Szklanka wody. Jeśli za 5 minut nadal chcesz — zapal i wróć opisać kontekst dokładniej.',
    permission:
      'Każdy zapalony z „nie wiem" to dane. Po dwóch tygodniach zobaczysz wzorzec, którego teraz nie widzisz.',
  },
]

// Faza → soft target → krótki tekst który aplikacja może spokojnie pokazać.
// Nie używaj jako presji — tylko jako kontekst gdy ktoś pyta „gdzie jestem?".
export const PHASE_GENTLE_HINT: Record<SmokingPhase, string> = {
  1: 'Tylko liczymy. Bez celu, bez limitu. Każdy zapalony to dane.',
  2: 'Sufit miesięczny, nie cel: „nie więcej niż tyle". Schodzisz po jednym papierosie co circa trzy tygodnie — z liczby, która i tak już spada.',
  3: 'Kontekst schodzi przed liczbą. Papieros tylko na zewnątrz, świadoma decyzja.',
  4: 'Coraz więcej dni na zero. Zostają tylko te najbardziej „twoje".',
  5: 'Ostatnia prosta do 5 kwietnia. Sufit 2 → 0, wybór z radością, nie z głodu.',
}

// ── Faza 2: reguły środowiskowe + zamienniki funkcji ─────────────────────
// Zasada przewodnia: podmieniasz FUNKCJĘ papierosa, nie samą liczbę. Papieros
// coś robi (nagradza, reguluje) — odejmujesz go, gdy jego robotę przejmuje co
// innego. Reguła środowiskowa > postanowienie: „w aucie się nie pali", nie
// „będę mniej palić w aucie". Zero negocjacji w locie.

export interface EnvRule {
  icon: string
  rule: string
  why: string
}

export const ENVIRONMENTAL_RULES: EnvRule[] = [
  { icon: '🚗', rule: 'Auto = strefa bez papierosa.',  why: 'Jedna decyzja zdejmuje ~1 dziennie. Kontekst, nie walka w momencie.' },
  { icon: '☕', rule: 'Kawa bez papierosa.',            why: 'Rozłączasz parę, którą łatwo rozłączyć — nisko wisi (2% udziału).' },
  { icon: '🌀', rule: 'Nuda ma inny ruch.',            why: '„Bo nic" = sygnał na 2 minuty czegokolwiek: woda, okno, krótki spacer.' },
]

// Za nagrodę (po queście): inny znacznik „zrobione" niż papieros — to samo
// domknięcie, inny nośnik. Od października: papieros-nagroda tylko po realnym
// kamieniu milowym, nie po każdym odhaczeniu.
export const REWARD_REPLACEMENTS: string[] = [
  'łyk dobrej kawy albo herbaty — świadomie, bez papierosa',
  'wpis „done" — jedno słowo w notatkach',
  'trzy głębokie oddechy',
  'krótkie przeciągnięcie się, rozluźnienie ramion',
]

// Za stres: masz już te narzędzia w rutynie — nic nie trzeba wymyślać.
// Papieros gasi napięcie na 4 minuty i wraca; narzędzie realnie reguluje.
export const STRESS_TOOLS: string[] = [
  'box breathing 4-4-4-4 (minuta, naprawdę działa)',
  'NSDR / yoga nidra 10 min',
  'spacer bez telefonu',
  '„name it to tame it" — nazwij emocję jednym zdaniem',
  'journaling — wypisz, co ściska',
]

// Pomocnicze do logiki interwencji — która warstwa interwencji dla danej intensity.
export function pickIntervention(
  meta: CigaretteContextMeta,
  intensity: 1 | 2 | 3 | 4 | 5,
): { tier: 'micro' | 'redirect' | 'permission'; text: string } {
  if (intensity <= 2) return { tier: 'micro',      text: meta.micro }
  if (intensity === 3) return { tier: 'redirect',   text: meta.redirect }
  return { tier: 'permission', text: meta.permission }
}

export function getContextMeta(id: CigaretteContext): CigaretteContextMeta {
  return CIGARETTE_CONTEXTS.find(c => c.id === id) ?? CIGARETTE_CONTEXTS[CIGARETTE_CONTEXTS.length - 1]
}
