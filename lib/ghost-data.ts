import type { GhostCategory } from '@/types'

// ─── Intensywność → próg interwencji ─────────────────────────────
// 1–2 = low (lekkie), 3 = mid (średnie), 4–5 = high (krytyczne).
// Akcja ("co teraz") skaluje się progiem: im wyżej, tym bardziej
// somatycznie i bezpośrednio. Reframe ("co czytam") zależy od
// konkretnej subkategorii, nie od intensywności.

export type IntensityTier = 'low' | 'mid' | 'high'

export function intensityTier(intensity: number): IntensityTier {
  if (intensity >= 4) return 'high'
  if (intensity === 3) return 'mid'
  return 'low'
}

// ─── Subkategoria: etykieta + reframe pod TĘ sytuację ────────────

export interface GhostSubcategory {
  text: string        // etykieta do wyboru
  reframe: string     // miękkie "co czytam" pod konkretną sytuację
}

export interface GhostCategoryMeta {
  id: GhostCategory
  label: string
  sublabel: string
  icon: string
  subcategories: GhostSubcategory[]
  // Twarda instrukcja "co teraz", dobierana progiem intensywności.
  actions: Record<IntensityTier, string>
  // Fallback reframe, gdyby subkategoria nie miała własnego (nie powinno się zdarzyć).
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
    intervention:
      'Jego aktywność w internecie to nie twoja sprawa i nie twoja wartość. To algorytm i przypadek.',
    subcategories: [
      {
        text: 'Zobaczyłam, co lajkuje',
        reframe:
          'Lajk to jego palec i algorytm, nie wiadomość do ciebie i nie informacja o twojej wartości. Nadajesz znaczenie czemuś, co znaczenia nie ma.',
      },
      {
        text: 'Zobaczyłam jego zdjęcie lub story',
        reframe:
          'Zobaczyłaś kadr, który ktoś wybrał, ustawił i przyciął, czyli pół sekundy reżyserii, nie życie. Porównujesz swoje kulisy do cudzego plakatu.',
      },
      {
        text: 'Zobaczyłam, że jest aktywny',
        reframe:
          'Zielona kropka mówi tylko tyle, że ktoś trzyma telefon. Nie mówi nic o tobie ani o tym, czy o tobie myśli.',
      },
      {
        text: 'Zobaczyłam jego komentarz u wspólnego znajomego',
        reframe:
          'Wszedł w cudzy wątek, nie w twój. To, że istnieje w tym samym internecie, nie jest sygnałem skierowanym do ciebie.',
      },
      {
        text: 'Zobaczyłam, że ktoś go otagował',
        reframe:
          'Cudzy tag to cudza historia, kadr z perspektywy osoby, której nie znasz. Jesteś tu widzem sceny, w której nie grasz.',
      },
    ],
    actions: {
      low:
        'Wycisz albo ogranicz to konto teraz, nie "później". Jeden ruch: mute, restrict albo unfollow. Bodziec, którego nie widzisz, nie woła. Telefon na 10 minut do drugiego pokoju.',
      mid:
        'Powiedz na głos jedno zdanie: "mam teraz impuls, żeby sprawdzać". Samo nazwanie ścina napięcie. Potem zamknij apkę i zrób jedną rzecz rękami: szklanka wody, otwarte okno, umyte naczynie.',
      high:
        'Telefon do drugiego pokoju, ekranem w dół. Zimna woda na twarz przez 30 sekund albo kostka lodu w dłoni: tętno spada w kilkadziesiąt sekund i palec schodzi z ekranu. Potem 6 wydechów dłuższych niż wdech. Decyzję podejmujesz dopiero, gdy ciało zejdzie.',
    },
  },
  {
    id: 'zycie_rownolegla',
    label: 'Życie równoległe',
    sublabel: 'Wydarzenie, które byłoby Wasze',
    icon: '🌙',
    intervention:
      'To nie nostalgia, to żal za wersją wieczoru, której nie ma. Masz prawo go poczuć.',
    subcategories: [
      {
        text: 'Wydarzenie, na które byśmy poszli razem',
        reframe:
          'Tęsknisz nie za nim, tylko za wieczorem, który sobie wyobraziłaś. Ten wieczór nie istnieje, więc nie da się go stracić. Żal jest prawdziwy, ale to nie dowód, że masz wracać.',
      },
      {
        text: 'Miejsce, w którym byśmy byli',
        reframe:
          'To miejsce nie jest jego. Jest twoje i świata. Możesz tam pójść sama i zrobić z tego swój kadr, nie wasz.',
      },
      {
        text: 'Data o znaczeniu (rocznica, urodziny)',
        reframe:
          'Data ma tylko taką moc, jaką jej dasz. Kalendarz nie wie, że dziś masz boleć. Możesz zdjąć z tego dnia obowiązek bólu.',
      },
      {
        text: 'Jego publiczny sukces lub porażka',
        reframe:
          'Jego sukces nie odejmuje nic tobie, jego porażka nie dodaje nic tobie. To już dwie osobne linie.',
      },
      {
        text: 'Wspólne święto',
        reframe:
          'Pierwsze święta po rozstaniu są najcięższe i to normalne. Każde kolejne waży mniej, jeśli teraz go nie dokarmisz kontaktem.',
      },
    ],
    actions: {
      low:
        'Najpierw uznanie: "tak, to boli, i mam prawo to czuć". Nie naprawiaj, nie tłumacz. Potem zaplanuj jedną konkretną rzecz dla siebie na ten czas: film, kąpiel, telefon do kogoś, kto cię lubi.',
      mid:
        'Zrób dokładnie to, co odwrotne do impulsu. Impuls mówi "siedź i rozpamiętuj" albo "napisz". Ty wstań, zmień pokój, wyjdź na 15 minut, włącz głośno muzykę. Ruch przerywa pętlę.',
      high:
        'Ta fala wzbiera i opada, zwykle w 20–30 minut, jeśli jej nie nakarmisz kontaktem. Minutnik na 20 minut: w tym czasie zero decyzji o napisaniu. Wydech dłuższy niż wdech, kilka razy. Zadzwoń do bezpiecznej osoby zamiast do niego.',
    },
  },
  {
    id: 'flashback',
    label: 'Flashback',
    sublabel: 'Wspomnienie wróciło',
    icon: '🌊',
    intervention:
      'Pamięć jest montażystką. Pokazuje same dobre ujęcia.',
    subcategories: [
      {
        text: 'Przypomniało mi się coś miłego, co zrobił',
        reframe:
          'Pamięć jest montażystką: trzyma najlepsze ujęcia, wycina resztę. To prawdziwe wspomnienie, ale niepełne. Dla równowagi dołóż to, co było tydzień później.',
      },
      {
        text: 'Nasze miejsce lub rytuał',
        reframe:
          'Rytuał był wasz wtedy. Teraz możesz go odzyskać dla siebie albo zostawić. Nie jesteś winna miejscu lojalności.',
      },
      {
        text: 'Piosenka, zapach, smak',
        reframe:
          'Zmysły mają krótszą drogę do emocji niż myśli, dlatego uderza tak szybko. To odruch ciała, nie znak z wszechświata. Przepłynie, jeśli pozwolisz.',
      },
      {
        text: 'Sen o nim',
        reframe:
          'Sen to twój mózg porządkujący stare pliki, nie wiadomość i nie przepowiednia. Nie odpowiadasz za to, co śni ci się w nocy.',
      },
      {
        text: 'Zdjęcie lub stara wiadomość',
        reframe:
          'To zapis przeszłej wersji was obojga, a tamtych dwoje już nie istnieje. Czytasz list od ludzi, których nie ma.',
      },
      {
        text: 'Przeczytałam coś, co nas przypomniało',
        reframe:
          'Skojarzenie podpięło tekst do niego w ułamku sekundy. To pokazuje, jak głęboki był ślad, a nie że masz z tym coś robić.',
      },
    ],
    actions: {
      low:
        'Dokończ wspomnienie uczciwie: dopowiedz w myślach jedno zdanie o tym, co było trudne albo dlaczego to się skończyło. Pełny obraz gasi tęsknotę szybciej niż walka z nią.',
      mid:
        'Zauważ, że to myśl, nie teraźniejszość: powiedz w głowie "mam wspomnienie o…", zamiast wchodzić w nie jak w film. To robi dystans. Potem zmień bodziec: inna piosenka, inny zapach, inne pomieszczenie.',
      high:
        'Wróć do ciała techniką 5-4-3-2-1: 5 rzeczy, które widzisz, 4 które słyszysz, 3 których dotykasz, 2 które czujesz węchem, 1 którą smakujesz. To wyciąga z głowy do tu i teraz. Potem kilka wydechów dłuższych niż wdech.',
    },
  },
  {
    id: 'brak_gestu',
    label: 'Brak gestu',
    sublabel: 'Czegoś nie zrobił, a mogłaś liczyć',
    icon: '🤍',
    intervention:
      'To jest ta osoba, od której nie dostaniesz tego, czego potrzebujesz. Wiesz to.',
    subcategories: [
      {
        text: 'Nie złożył życzeń urodzinowych',
        reframe:
          'To boli, i jednocześnie jest spójną informacją: to ta sama osoba, która już wcześniej nie dawała ci tego, czego potrzebowałaś. Brak gestu to nie pomyłka, to wzorzec.',
      },
      {
        text: 'Nie napisał w rocznicę lub święta',
        reframe:
          'Czekanie na gest od kogoś, kto pokazał, że go nie wykona, boli bardziej niż sam brak. Masz prawo przestać czekać.',
      },
      {
        text: 'Nie zareagował na mój sukces',
        reframe:
          'Twój sukces jest twój niezależnie od tego, kto go zauważył. Jego cisza nie zmniejsza go o gram.',
      },
      {
        text: 'Nie zapytał, gdy miałam trudny moment',
        reframe:
          'Osoba, która nie pyta w trudnym momencie, właśnie odpowiedziała ci, kim jest. Wolno ci uwierzyć tej odpowiedzi, nawet jeśli jest smutna.',
      },
      {
        text: 'Nie odezwał się, gdy coś ważnego się działo',
        reframe:
          'Jego nieobecność w ważnym momencie to nie przypadek, to dane. Ból jest realny, ale nie wymaga od ciebie ruchu w jego stronę.',
      },
    ],
    actions: {
      low:
        'Połóż dłoń na mostku i powiedz do siebie tak, jak do przyjaciółki: "należało mi się więcej, i to nie moja wina, że tego nie dostałam". Życzliwość do siebie robi tu to, czego cudzy gest i tak by nie zrobił.',
      mid:
        'Napisz jedno zdanie, ale do siebie, nie do niego: czego konkretnie ci zabrakło. Zamknij zeszyt. Tę potrzebę zaspokoisz u kogoś, kto potrafi, nie u kogoś, kto już pokazał, że nie.',
      high:
        'Nie pisz do niego, żeby wymusić reakcję. Nawet jeśli przyjdzie, nie zaleczy braku, tylko go pogłębi. Zadzwoń teraz do osoby, która realnie się tobą interesuje. Niech twoją potrzebę odbierze ktoś, kto umie ją unieść.',
    },
  },
  {
    id: 'proximity',
    label: 'Bliskość',
    sublabel: 'Wiesz, gdzie jest fizycznie',
    icon: '🗺️',
    intervention:
      'To miasto było twoje, zanim był on. Masz do niego pełne prawo.',
    subcategories: [
      {
        text: 'Wiem, że jest w moim mieście',
        reframe:
          'Miasto było twoje, zanim był on. Jego obecność w tych samych granicach nie zmniejsza twojego prawa do niego.',
      },
      {
        text: 'Jestem blisko jego miejsca',
        reframe:
          'Bliskość na mapie to nie bliskość w życiu. Kilkaset metrów i przepaść to teraz to samo.',
      },
      {
        text: 'Idę w miejsce, gdzie może być',
        reframe:
          '"Może być" to nie "będzie". Idziesz tam dla siebie i dla planu, który miałaś, nie po to, żeby na niego trafić.',
      },
      {
        text: 'Wspólny znajomy powiedział, gdzie jest',
        reframe:
          'Dostałaś informację, której nie szukałaś. Nie masz obowiązku nic z nią robić. Może zostać tylko faktem na mapie.',
      },
      {
        text: 'Zobaczyłam go z daleka lub na żywo',
        reframe:
          'Ciało zareagowało, zanim zdążyłaś pomyśleć, to normalne i przejdzie. Zobaczyć kogoś to nie zobowiązanie do kontaktu.',
      },
    ],
    actions: {
      low:
        'Zmień bodziec, jeśli możesz: inna trasa, inna kawiarnia, inny wagon. To nie ucieczka, to higiena. Mniej zbiegów okoliczności, mniej fal.',
      mid:
        'Zrób ruch przeciwny do "sprawdzę, podejdę, poczekam": odwróć się, słuchawki na uszy, idź w swoją stronę z konkretnym celem. W stronę siebie, nie jego.',
      high:
        'Widzisz go i czujesz, że płyniesz: nie podchodź, nie decyduj w pierwszej minucie. Zaciśnij i rozluźnij pięści kilka razy albo zimna woda na twarz, żeby ciało zeszło z napięcia. Zmień lokalizację i zadzwoń do bezpiecznej osoby.',
    },
  },
  {
    id: 'kontakt_zewnetrzny',
    label: 'Ktoś go wspomniał',
    sublabel: 'Ktoś inny wprowadził go do Twojego dnia',
    icon: '👤',
    intervention:
      'Ktoś o nim mówił. To nie jest znak. To jest statystyka rozmów w małym świecie.',
    subcategories: [
      {
        text: 'Wspólny znajomy o nim mówił',
        reframe:
          'Ktoś wpuścił go do twojego dnia, ty go nie zaprosiłaś. To statystyka rozmów w małym świecie, nie znak.',
      },
      {
        text: 'Rodzina zapytała lub wspomniała',
        reframe:
          'Pytanie rodziny mówi o ich ciekawości albo nawyku, nie o tym, co masz czuć. Możesz odpowiedzieć krótko i wrócić do siebie.',
      },
      {
        text: 'Spotkałam kogoś, kto nas pamięta razem',
        reframe:
          'Cudza pamięć trzyma starą wersję was. Nie masz obowiązku jej potwierdzać ani prostować. To już nieaktualne.',
      },
      {
        text: 'Ktoś pokazał stare zdjęcie lub wiadomość',
        reframe:
          'Ktoś inny wyciągnął archiwum, nie ty. Możesz spojrzeć i odłożyć, bez schodzenia w dół.',
      },
      {
        text: 'Terapeutka lub przyjaciółka rozgrzebała temat',
        reframe:
          'Ból, który wypływa w bezpiecznym miejscu, jest po to, żeby go przerobić, nie żeby do niego pisać. Rozgrzebanie to praca, nie nawrót.',
      },
    ],
    actions: {
      low:
        'Miej gotowe jedno zdanie domykające temat, ćwiczone na zimno: "u mnie dobrze, a co u ciebie?". Przekieruj rozmowę na siebie albo na drugą osobę.',
      mid:
        'Po rozmowie nazwij, co się podniosło: "czuję teraz tęsknotę / złość / smutek". Jedno zdanie. Nazwanie emocji ścina jej napięcie. Nie musisz z tym nic robić poza nazwaniem.',
      high:
        'Jeśli cudza wzmianka odpaliła silną falę, nie odpowiadaj na nią kontaktem z nim. Odsuń się na chwilę fizycznie (łazienka, balkon), kilka wydechów dłuższych niż wdech, wróć dopiero gdy ciało zejdzie. Decyzję o czymkolwiek odkładasz o 20 minut.',
    },
  },
  {
    id: 'chce_podzielic',
    label: 'Chcę powiedzieć',
    sublabel: 'Masz coś do powiedzenia — jemu',
    icon: '💬',
    intervention:
      'On już nie jest tą osobą, która umie to z tobą przeżyć. Kiedyś była, teraz nie jest.',
    subcategories: [
      {
        text: 'Mam sukces, którym chcę się pochwalić',
        reframe:
          'Pierwsza myśl "jemu" to stary nawyk, nie realna potrzeba. Twój sukces zasługuje na kogoś, kto ucieszy się bez bagażu.',
      },
      {
        text: 'Mam gorszy moment, chcę wsparcia',
        reframe:
          'Sięgasz po niego, bo kiedyś był schronieniem. Już nie jest. Wsparcie od kogoś, kto odszedł, zostawia gorzej niż brak wsparcia.',
      },
      {
        text: 'Chcę pokazać, jak mi dobrze',
        reframe:
          'Jeśli musisz mu pokazać, że jest ci dobrze, część ciebie wciąż gra dla niego. Prawdziwe "dobrze" nie potrzebuje jego widowni.',
      },
      {
        text: 'Chcę, żeby żałował',
        reframe:
          'Żal, którego oczekujesz, nie nakarmi cię, nawet jeśli przyjdzie. Tę energię możesz włożyć w siebie zamiast w jego reakcję.',
      },
      {
        text: 'Chcę mu podziękować za coś z przeszłości',
        reframe:
          'Wdzięczność możesz poczuć i zatrzymać, nie musisz jej dostarczać. Często "podziękowanie" to tylko pretekst, żeby otworzyć drzwi.',
      },
      {
        text: 'Chcę zamknąć rozdział słowami',
        reframe:
          'Domknięcie nie przychodzi z jego odpowiedzi, tylko z twojej decyzji. Rozdziały zamyka się od środka, nie cudzą repliką.',
      },
    ],
    actions: {
      low:
        'Napisz to, ale nie do niego. Otwórz notatki i wylej tam całą wiadomość. Potrzeba "powiedzenia" zostaje zaspokojona, adresat się zmienia. Nie wysyłasz.',
      mid:
        'Ruch przeciwny do impulsu: zamiast do niego, napisz albo zadzwoń do kogoś, komu naprawdę zależy. Ta sama energia, lepszy odbiorca, zero kaca rano.',
      high:
        'Palec nad "wyślij" to szczyt fali, a fala opada w 20–30 minut, jeśli jej nie nakarmisz. Odłóż telefon, minutnik na 20 minut, zero wysyłania. Jeśli po tym czasie wciąż chcesz, przeczytasz to najpierw na zimno. Zwykle już nie chcesz.',
    },
  },
  {
    id: 'stan_wewnetrzny',
    label: 'Stan wewnętrzny',
    sublabel: 'Nic się nie stało, po prostu wróciło',
    icon: '🌑',
    intervention:
      'To nie o nim. To jest twój stan, który szuka obiektu.',
    subcategories: [
      {
        text: 'Tęsknię bez powodu',
        reframe:
          'Tęsknota bez wyzwalacza to zwykle stan ciała szukający obiektu, a nie sygnał o nim. Mózg bierze pierwszą znajomą twarz, żeby podpiąć pod nią napięcie.',
      },
      {
        text: 'Nuda, pustka',
        reframe:
          'Pustka woła o wypełnienie i podsuwa najłatwiejszy stary nawyk: jego. To nie tęsknota za nim, to głód bodźca.',
      },
      {
        text: 'Samotność',
        reframe:
          'Czujesz samotność, nie brak konkretnie jego. Dowód: ulgę da ci każdy ciepły kontakt, nie tylko on. To znaczy, że chodzi o połączenie, nie o niego.',
      },
      {
        text: 'Alkohol lub zmęczenie obniżyło obrony',
        reframe:
          'To nie ty mówisz, to spadek zasobów. Zmęczony i podpity mózg sięga po stare ścieżki. Rano nie chciałabyś tego, czego chcesz teraz.',
      },
      {
        text: 'Chwila słabości, niskie poczucie wartości',
        reframe:
          'Niska wartość szuka potwierdzenia tam, gdzie kiedyś je dostawała. Jego odpowiedź nie podniesie cię trwale, najwyżej na chwilę, a potem zostawi niżej.',
      },
      {
        text: 'Lęk lub niepokój',
        reframe:
          'Lęk chce czegoś znajomego, żeby się uspokoić, a on jest znajomy. Znajome nie znaczy dobre dla ciebie.',
      },
      {
        text: 'Cykl hormonalny',
        reframe:
          'Część tej tęsknoty pisze teraz faza cyklu, nie ty i nie wasza historia. To realne uczucie z przewidywalnej, biologicznej przyczyny. Minie wraz z fazą.',
      },
    ],
    actions: {
      low:
        'Szybki przegląd ciała, zanim cokolwiek: głodna, zmęczona, samotna, spięta? Zaspokój to, co znajdziesz: jedzenie, woda, drzemka, ciepły kontakt, ruch. Stan, który nakarmisz, przestaje wołać jego imieniem.',
      mid:
        'Nazwij na głos, co naprawdę czujesz: "jestem teraz samotna / pusta / niespokojna". To nie tęsknota za nim, to ten stan. Potem daj ciału jedną prostą rzecz, której potrzebuje, zamiast sięgać po telefon.',
      high:
        'To stan, nie decyzja, a w takim stanie, zwłaszcza po alkoholu albo bez snu, decyzji się nie podejmuje. Dziś zero kontaktu. Zimna woda na twarz albo ciepły prysznic, magnez, telefon do bezpiecznej osoby, sen. Wrócisz do tego jutro, na zimno.',
    },
  },
]

export const getGhostCategory = (id: GhostCategory): GhostCategoryMeta =>
  GHOST_CATEGORIES.find(c => c.id === id) ?? GHOST_CATEGORIES[0]
