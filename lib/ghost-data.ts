import type { GhostCategory } from '@/types'

export interface GhostCategoryMeta {
  id: GhostCategory
  label: string
  sublabel: string
  icon: string
  subcategories: string[]
  intervention: string
}

export const INTENSITY_LABELS: Record<number, { name: string; description: string }> = {
  1: { name: 'Pyknięcie',    description: 'Ledwie zauważalne, przejdzie samo' },
  2: { name: 'Chmurka',      description: 'Wyraźne, ale nie zagrażające' },
  3: { name: 'Fala',         description: 'Ciało reaguje, chcę coś zrobić' },
  4: { name: 'Tsunami',      description: 'Jestem blisko impulsu' },
  5: { name: 'Krytycznie',   description: 'Palec nad przyciskiem wyślij' },
}

export const GHOST_CATEGORIES: GhostCategoryMeta[] = [
  {
    id: 'social_slady',
    label: 'Social media',
    sublabel: 'Widzisz jego ślady online',
    icon: '📱',
    subcategories: [
      'Zobaczyłam, co lajkuje',
      'Zobaczyłam jego zdjęcie lub story',
      'Zobaczyłam, że jest aktywny',
      'Zobaczyłam jego komentarz u wspólnego znajomego',
      'Zobaczyłam, że ktoś go otagował',
    ],
    intervention:
      'Jego aktywność w internecie to nie Twoja sprawa i nie Twoja wartość. To algorytm i przypadek.\n\nZamknij to. Telefon do drugiego pokoju. Minuta ciszy.',
  },
  {
    id: 'zycie_rownolegla',
    label: 'Życie równoległe',
    sublabel: 'Wydarzenie, które byłoby Wasze',
    icon: '🌙',
    subcategories: [
      'Wydarzenie, na które byśmy poszli razem',
      'Miejsce, w którym byśmy byli',
      'Data o znaczeniu (rocznica, urodziny)',
      'Jego publiczny sukces lub porażka',
      'Wspólne święto',
    ],
    intervention:
      'To nie nostalgia — to żal za wersją wieczoru, której nie ma. Masz prawo go poczuć.\n\nNalej sobie czegoś dobrego. Włącz muzykę. Daj sobie 15 minut.',
  },
  {
    id: 'flashback',
    label: 'Flashback',
    sublabel: 'Wspomnienie wróciło',
    icon: '🌊',
    subcategories: [
      'Przypomniało mi się coś miłego, co zrobił',
      'Nasze miejsce lub rytuał',
      'Piosenka, zapach, smak',
      'Sen o nim',
      'Zdjęcie lub stara wiadomość',
      'Przeczytałam coś, co nas przypomniało',
    ],
    intervention:
      'Pamięć jest montażystką. Pokazuje same dobre ujęcia.\n\nDodaj w myślach: a co było dzień później? Wróć do teraz. Jeden głęboki oddech.',
  },
  {
    id: 'brak_gestu',
    label: 'Brak gestu',
    sublabel: 'Czegoś nie zrobił, a mogłaś liczyć',
    icon: '🤍',
    subcategories: [
      'Nie złożył życzeń urodzinowych',
      'Nie napisał w rocznicę lub święta',
      'Nie zareagował na mój sukces',
      'Nie zapytał, gdy miałam trudny moment',
      'Nie odezwał się, gdy coś ważnego się działo',
    ],
    intervention:
      'To jest ta osoba, od której nie dostaniesz tego, czego potrzebujesz. Wiesz to.\n\nNapisz sobie jedno zdanie: co Ci się należało. Nie jemu — sobie.',
  },
  {
    id: 'proximity',
    label: 'Bliskość',
    sublabel: 'Wiesz, gdzie jest fizycznie',
    icon: '🗺️',
    subcategories: [
      'Wiem, że jest w moim mieście',
      'Jestem blisko jego miejsca',
      'Idę w miejsce, gdzie może być',
      'Wspólny znajomy powiedział, gdzie jest',
      'Zobaczyłam go z daleka lub na żywo',
    ],
    intervention:
      'To miasto było Twoje zanim był on. Masz do niego pełne prawo.\n\nZaplanuj sobie 2 godziny w tym mieście — dla siebie. Kawiarnia, spacer, wystawa.',
  },
  {
    id: 'kontakt_zewnetrzny',
    label: 'Ktoś go wspomniał',
    sublabel: 'Ktoś inny wprowadził go do Twojego dnia',
    icon: '👤',
    subcategories: [
      'Wspólny znajomy o nim mówił',
      'Rodzina zapytała lub wspomniała',
      'Spotkałam kogoś, kto nas pamięta razem',
      'Ktoś pokazał stare zdjęcie lub wiadomość',
      'Terapeutka lub przyjaciółka rozgrzebała temat',
    ],
    intervention:
      'Ktoś o nim mówił. To nie jest znak. To jest statystyka rozmów w małym świecie.\n\nZmień temat na siebie — co dobrego dzieje się w Twoim życiu teraz?',
  },
  {
    id: 'chce_podzielic',
    label: 'Chcę powiedzieć',
    sublabel: 'Masz coś do powiedzenia — jemu',
    icon: '💬',
    subcategories: [
      'Mam sukces, którym chcę się pochwalić',
      'Mam gorszy moment, chcę wsparcia',
      'Chcę pokazać, jak mi dobrze',
      'Chcę, żeby żałował',
      'Chcę mu podziękować za coś z przeszłości',
      'Chcę zamknąć rozdział słowami',
    ],
    intervention:
      'On już nie jest tą osobą, która umie to z Tobą przeżyć. Kiedyś była, teraz nie jest.\n\nNapisz do kogoś, komu naprawdę zależy.',
  },
  {
    id: 'stan_wewnetrzny',
    label: 'Stan wewnętrzny',
    sublabel: 'Nic się nie stało, po prostu wróciło',
    icon: '🌑',
    subcategories: [
      'Tęsknię bez powodu',
      'Nuda, pustka',
      'Samotność',
      'Alkohol lub zmęczenie obniżyło obrony',
      'Chwila słabości, niskie poczucie wartości',
      'Lęk lub niepokój',
      'Cykl hormonalny',
    ],
    intervention:
      'To nie o nim. To jest Twój stan, który szuka obiektu.\n\nCo potrzebuje Twoje ciało teraz — sen, jedzenie, ruch, cisza, dotyk, towarzystwo?',
  },
]
