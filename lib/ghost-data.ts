import type { GhostCategory } from '@/types'

// ─── Ghost Protocol, wersja po zablokowaniu ──────────────────────
// Rdzeń przesunięty z "nie pisać" na "nie sprawdzać" (kontakt odcięty
// świadomą decyzją). Środek ciężkości: zastąpienie, wartość, strach
// o przyszłość. Prawda o przemocy i o huśtawce (intermittent
// reinforcement) wpleciona w reframe tam, gdzie trzeba.
//
// Każda akcja "co teraz" niesie test Natalii: czy ta myśl gdzieś
// mnie prowadzi, czy tylko się kręci. Jeśli się kręci, wolno ją
// przerwać (zdjęcie ręki z pieca, nie ucieczka). Nie wypychać siłą,
// tylko nie karmić pełną uwagą i wrócić do czegoś fizycznego.

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
  // Fallback reframe, gdyby subkategoria nie miała własnego.
  intervention: string
}

export const INTENSITY_LABELS: Record<number, { name: string; description: string }> = {
  1: { name: 'Pyknięcie',    description: 'Ledwie zauważalne, przejdzie samo' },
  2: { name: 'Chmurka',      description: 'Wyraźne, ale nie zagrażające' },
  3: { name: 'Fala',         description: 'Ciało reaguje, chcę coś zrobić' },
  4: { name: 'Tsunami',      description: 'Jestem blisko impulsu' },
  5: { name: 'Krytycznie',   description: 'Palec nad odblokowaniem albo sprawdzeniem' },
}

export const GHOST_CATEGORIES: GhostCategoryMeta[] = [
  {
    id: 'chce_sprawdzic',
    label: 'Chcę sprawdzić',
    sublabel: 'Chcesz szukać informacji o nim albo o niej',
    icon: '🔍',
    intervention:
      'Każda informacja o nim to paliwo do ruminacji, nie ulga. Zablokowałaś go świadomie, żeby ból nie miał dokąd cię popchnąć.',
    subcategories: [
      {
        text: 'Chcę wejść na jego profil',
        reframe:
          'Każda informacja o nim to paliwo do ruminacji, nie ulga. Zablokowałaś go świadomie, żeby ból nie miał dokąd cię popchnąć. Wejście tam cofa twoją własną decyzję z chłodnej głowy.',
      },
      {
        text: 'Chcę zobaczyć ją albo jej profil',
        reframe:
          'To, jak ona wygląda i co publikuje, nie da ci ani jednej odpowiedzi, która przyniesie spokój. Da tylko obraz, który potem będziesz odganiać przez kolejne godziny.',
      },
      {
        text: 'Chcę odblokować, żeby tylko zobaczyć',
        reframe:
          '"Tylko zobaczyć" nie istnieje, to pierwszy stopień z powrotem na huśtawkę. Blokada to nie kara, to lina, którą sama sobie rzuciłaś. Nie przecinaj jej w najsłabszym momencie.',
      },
      {
        text: 'Chcę wypytać znajomych',
        reframe:
          'Wypytywanie zamienia znajomych w jego kronikę, a ciebie trzyma w roli widza jego życia. Nie potrzebujesz raportu z jego świata, żeby żyć w swoim.',
      },
      {
        text: 'Chcę wiedzieć, czy jest szczęśliwy',
        reframe:
          'Jego szczęście albo jego brak nic nie zmienia w twoim. To, że on nie płacze, nie znaczy, że przerobił, znaczy, że zagłusza. Nie ścigasz się w czymś, czego nawet nie chcesz wygrać.',
      },
      {
        text: 'Chcę szukać "dlaczego"',
        reframe:
          'Przy kimś, kto stosował przemoc, nie ma logicznej odpowiedzi, która da ci spokój. "Dlaczego" to pętla bez wyjścia. Pytanie, które ma sens, to "co teraz robię dla siebie", nie "co było z nim".',
      },
    ],
    actions: {
      low:
        'Zadaj sobie test: czy to pytanie gdzieś mnie prowadzi, czy tylko się kręci. Jeśli się kręci, wolno ci zdjąć rękę z pieca. Odłóż telefon na 10 minut do drugiego pokoju i zrób jedną rzecz rękami.',
      mid:
        'Nie wypychaj myśli siłą, bo wróci silniejsza. Powiedz na głos "mam impuls, żeby sprawdzać" i nie karm go pełną uwagą. Potem jedna fizyczna rzecz tu i teraz: szklanka wody, spacer po mieszkaniu, zimne dłonie pod kranem.',
      high:
        'To szczyt fali i opadnie, jeśli go nie nakarmisz informacją. Telefon do drugiego pokoju, ekranem w dół. Zimna woda na twarz 30 sekund, tętno spada w kilkadziesiąt sekund. Potem 6 wydechów dłuższych niż wdech. Nie odblokowujesz dziś niczego. Zadzwoń do bezpiecznej osoby.',
    },
  },
  {
    id: 'zastapienie',
    label: 'Obraz ich razem',
    sublabel: 'Czujesz, że zastąpił cię na lepsze',
    icon: '👥',
    intervention:
      'To, że szybko ma nową, nie mówi nic o twojej wartości. Mówi o jego niezdolności do bycia samemu i ze swoim bólem.',
    subcategories: [
      {
        text: 'Widzę ich razem w głowie',
        reframe:
          'To natrętny obraz, nie fakt teraźniejszy i nie wiadomość o tobie. Wyobraźnia montuje scenę, której nie oglądasz na żywo. Im mniej ją dokarmiasz uwagą, tym szybciej blednie.',
      },
      {
        text: 'Zastąpił mnie na lepsze, jakbym nie istniała',
        reframe:
          'To, że szybko ma nową, nie mówi nic o twojej wartości, mówi o jego niezdolności do bycia samemu i ze swoim bólem. To nie jest "lepsze", to jest ucieczka. Nie zostałaś przebita, on po prostu nie umie zostać sam.',
      },
      {
        text: 'Ona jest podobna do mnie, jest lepszą wersją mnie',
        reframe:
          'Podobna do ciebie nie znaczy lepsza od ciebie. Znaczy, że to ty byłaś wzorcem, którego on szuka. Ona nie dostała lepszego jego, jest na początku tej samej drogi, z której ty właśnie wyszłaś.',
      },
      {
        text: 'Zrobił to w jeden moment, jestem łatwa do wymiany',
        reframe:
          'Tempo, w jakim ktoś wskakuje w nowe, mierzy jego lęk przed pustką, nie twoją zastępowalność. Ty przerabiasz, on zapełnia. To dwie różne rzeczy, nie konkurs, który przegrałaś.',
      },
      {
        text: 'On wygląda na szczęśliwego, ja płaczę',
        reframe:
          'To, że ty płaczesz, a on nie, nie znaczy, że przegrałaś. Znaczy, że ty przeżywasz to naprawdę, a on zagłusza. Twoje łzy to przerabianie, nie porażka. Jego spokój to częściej fasada niż dowód.',
      },
    ],
    actions: {
      low:
        'Nazwij to, czym jest: "mam teraz obraz, nie fakt". Obraz nie jest meldunkiem z rzeczywistości. Wróć do jednej konkretnej rzeczy wokół ciebie i daj jej pełną uwagę na minutę.',
      mid:
        'Dołóż do obrazu prawdę, którą wiesz na zimno: wyszłaś z czegoś, co cię raniło, a nie straciłaś czegoś dobrego. Potem zmień bodziec fizycznie, bo z obrazem nie wygrasz wpatrywaniem się w niego: wyjdź z pokoju, włącz głośno muzykę, ruszaj się.',
      high:
        'Ten obraz tnie najmocniej, gdy stoisz w miejscu. Wstań, ruch albo mocny wysiłek przez 2 minuty, zimna woda na twarz, żeby ciało przejęło uwagę od głowy. Potem wydech dłuższy niż wdech. Zadzwoń do kogoś i powiedz na głos: "czuję się zastąpiona i to nieprawda o mojej wartości".',
    },
  },
  {
    id: 'nie_do_wybrania',
    label: 'Jestem nie do wybrania',
    sublabel: 'Skoro nie wybrał, to coś ze mną',
    icon: '🪞',
    intervention:
      'Wybór jednej osoby, w dodatku osoby, która stosowała przemoc, nie jest wyrokiem o twojej wartości.',
    subcategories: [
      {
        text: 'Skoro mnie nie wybrał, jestem nie do wybrania',
        reframe:
          'Wybór jednej osoby, w dodatku osoby, która stosowała przemoc, nie jest wyrokiem o twojej wartości. To, że ktoś niezdolny do zdrowej bliskości cię nie utrzymał, mówi o jego pojemności, nie o twojej cenie.',
      },
      {
        text: 'To ja byłam problemem',
        reframe:
          'Obwinianie siebie jest znajome, bo przy nim uczyłaś się, że to twoja wina, gdy wyzywał, machał, przypierał do ściany. To była jego przemoc, nie twój błąd. Nie bierz na siebie ciężaru, który nigdy nie był twój.',
      },
      {
        text: 'Byłam głupia, że wierzyłam',
        reframe:
          'Wiara w kogoś, kogo kochasz, nie jest głupotą. Huśtawka, raz blisko raz strach, uzależnia jak automat do gier, właśnie dlatego, że jest tak zaprojektowana, żeby trzymać. Zostałaś złapana w mechanizm, nie popełniłaś błędu charakteru.',
      },
      {
        text: 'Nikt mnie już tak nie pokocha',
        reframe:
          '"Tak" jak on to znaczy z przemocą i strachem. Nie chcesz, żeby ktokolwiek znowu tak cię kochał. To, że teraz nie wyobrażasz sobie innej miłości, to żałoba, która mówi, nie prognoza, która wie.',
      },
      {
        text: 'Zmienił się i dla niej będzie idealny',
        reframe:
          'Ludzie nie zmieniają się przez wymianę osoby obok, tylko przez pracę nad sobą, której on unika, uciekając w nowy związek. Ona nie dostała nowego jego. Dostała tego samego, tylko na wcześniejszym etapie.',
      },
    ],
    actions: {
      low:
        'Połóż dłoń na mostku i powiedz do siebie jak do przyjaciółki, której ktoś to zrobił: "to nie był twój błąd, byłaś w czymś, co raniło". Życzliwość do siebie robi tu to, czego samobiczowanie nigdy nie zrobi.',
      mid:
        'Złap tę myśl i sprawdź ją jak hipotezę, nie jak fakt: jaki masz realny dowód, że jesteś "nie do wybrania", poza słowami osoby, która cię krzywdziła? Wypisz jedno zdanie kontr-dowodu i zostaw zeszyt zamknięty.',
      high:
        'Ta myśl uderza najmocniej, gdy jesteś wyczerpana albo sama. Nie wyciągaj w niej żadnych wniosków o sobie. Zadzwoń teraz do kogoś, kto cię zna i lubi, i pozwól, żeby jego głos był chwilowo twoją pamięcią o tym, kim jesteś. Decyzję o swojej wartości odkładasz, aż ciało zejdzie.',
    },
  },
  {
    id: 'strach_przyszlosc',
    label: 'Strach o przyszłość',
    sublabel: 'Lęk, że będziesz sama i tracisz czas',
    icon: '🌫️',
    intervention:
      'Lęk maluje przyszłość w kolorach dzisiejszego bólu, ale dzisiejszy ból to nie prognoza.',
    subcategories: [
      {
        text: 'Będę samotna długo',
        reframe:
          'Lęk maluje przyszłość w kolorach dzisiejszego bólu, ale dzisiejszy ból to nie prognoza. Jesteś tydzień, nie dekadę, po ciosie. Samotność teraz to stan, nie wyrok na lata.',
      },
      {
        text: 'Tracę czas',
        reframe:
          'Czas włożony w wychodzenie z przemocy nie jest stracony, jest odzyskany. Gdybyś została, dopiero wtedy traciłabyś go naprawdę. Wyjście to inwestycja, nie koszt.',
      },
      {
        text: 'Marzenie o rodzinie się oddala',
        reframe:
          'Marzenie o rodzinie nie wymaga jego, wymaga zdrowej relacji, a z nim by jej nie było. Nie oddaliłaś się od marzenia, oddaliłaś się od wersji, która by je rozbiła.',
      },
      {
        text: 'Nigdy już nikogo tak nie pokocham',
        reframe:
          'To zdanie czuje się jak prawda, a jest objawem żałoby. Mózg po stracie nie umie wyobrazić sobie przyszłej bliskości, to normalne i mija. Nie podpisuj kontraktu na całe życie w najgorszym tygodniu.',
      },
    ],
    actions: {
      low:
        'Lęk żyje w przyszłości, ty żyjesz teraz. Wróć do dzisiaj: jedna rzecz, którą zrobisz w ciągu najbliższej godziny dla siebie. Przyszłości nie rozwiążesz dziś wieczorem, a ten wieczór tak.',
      mid:
        'Zadaj swój test: czy ta myśl o przyszłości gdzieś mnie prowadzi, czy tylko się kręci i straszy. Jeśli się kręci, to ruminacja, nie planowanie. Zdejmij rękę z pieca i wróć do ciała: spacer, oddech, coś ciepłego.',
      high:
        'Kiedy lęk o przyszłość zalewa, nie projektuj dekad, zwęź świat do najbliższych 24 godzin. 5-4-3-2-1: 5 rzeczy, które widzisz, 4 które słyszysz, 3 których dotykasz, 2 zapachy, 1 smak. Potem wydech dłuższy niż wdech. Jutro zajmiesz się jutrem.',
    },
  },
  {
    id: 'tesknota_hustawka',
    label: 'Tęsknota i huśtawka',
    sublabel: 'Brakuje ci jego albo intensywności',
    icon: '🎰',
    intervention:
      'Tęsknisz za huśtawką, nie za bezpieczeństwem, bo bezpieczeństwa przy nim nie miałaś.',
    subcategories: [
      {
        text: 'Tęsknię za nim, brakuje mi bliskości',
        reframe:
          'Tęsknisz za huśtawką, nie za bezpieczeństwem, bo bezpieczeństwa przy nim nie miałaś. Brakuje ci intensywności raz-blisko-raz-strach, która uzależnia mocniej niż spokój. To głód automatu, nie głód jego.',
      },
      {
        text: 'Tęsknię za intensywnością, za tym, co czuliśmy',
        reframe:
          'Intensywność to nie to samo co miłość. To, co czuliście, napędzał lęk i ulga na zmianę, czyli dokładnie mechanizm, który trzyma w przemocowej relacji. Spokój wyda się nudny, dopóki układ nerwowy się nie wyreguluje. To mija.',
      },
      {
        text: 'Pamiętam dobre momenty',
        reframe:
          'Pamięć trzyma najjaśniejsze klatki i wycina przyparcie do ściany, wyzwiska, ucieczkę z własnego mieszkania. Dobre momenty były prawdziwe i były przynętą między ciosami. Dołóż w myślach to, co było dzień później.',
      },
      {
        text: 'Brakuje mi go bez konkretnego powodu',
        reframe:
          'Tęsknota bez wyzwalacza to zwykle stan ciała szukający znajomego obiektu, nie sygnał, że masz wracać. Twój układ nerwowy odzwyczaja się od huśtawki i to boli jak odstawienie. Odstawienie mija, jeśli nie sięgniesz po dawkę.',
      },
    ],
    actions: {
      low:
        'Nazwij to bez wstydu: "to odstawienie od huśtawki, nie znak". Tęsknota ma prawo być i nie musisz nic z nią robić poza przeczekaniem. Daj ciału jedną prostą rzecz: ciepło, ruch, jedzenie, kontakt z kimś bezpiecznym.',
      mid:
        'Dokończ wspomnienie uczciwie: do dobrego momentu dołóż jeden trudny, ten, po którym uciekłaś albo się bałaś. Pełny obraz gasi tęsknotę szybciej niż walka z nią. Potem zmień bodziec fizycznie.',
      high:
        'Ta fala wzbiera i opada, zwykle w 20-30 minut, jeśli jej nie nakarmisz. Nie odblokowujesz, nie sprawdzasz, nie sięgasz po dawkę. Minutnik na 20 minut, w tym czasie zero decyzji. Wydech dłuższy niż wdech. Zadzwoń do bezpiecznej osoby zamiast wracać na huśtawkę.',
    },
  },
  {
    id: 'flashback',
    label: 'Flashback',
    sublabel: 'Wspomnienie wróciło samo',
    icon: '🌊',
    intervention:
      'To odruch ciała, nie znak z wszechświata i nie wezwanie. Przepłynie, jeśli pozwolisz.',
    subcategories: [
      {
        text: 'Piosenka, zapach, miejsce',
        reframe:
          'Zmysły mają krótszą drogę do emocji niż myśli, dlatego uderza bez ostrzeżenia. To odruch ciała, nie znak z wszechświata i nie wezwanie. Przepłynie, jeśli pozwolisz, zamiast w nie wchodzić.',
      },
      {
        text: 'Coś miłego, co zrobił',
        reframe:
          'Pamięć jest montażystką: trzyma najlepsze ujęcia i wycina resztę, w tym przemoc. To prawdziwe, ale niepełne wspomnienie. Dla równowagi przypomnij sobie, jaki był dzień albo tydzień później.',
      },
      {
        text: 'Sen o nim',
        reframe:
          'Sen to twój mózg porządkujący stare pliki, nie wiadomość i nie przepowiednia. Nie odpowiadasz za to, co śni ci się w nocy, ani nie musisz tego rano analizować.',
      },
      {
        text: 'Nasze miejsce albo rytuał',
        reframe:
          'Rytuał był wasz wtedy. Teraz możesz go odzyskać dla siebie albo zostawić. Nie jesteś winna miejscu ani nawykowi lojalności wobec relacji, z której wyszłaś.',
      },
    ],
    actions: {
      low:
        'Zauważ: to wspomnienie, nie teraźniejszość. Powiedz w głowie "mam wspomnienie o…", zamiast wchodzić w nie jak w film. Potem wróć do teraz jedną zmysłową rzeczą wokół ciebie.',
      mid:
        'Dołóż do wspomnienia pełny obraz: jedno zdanie o tym, dlaczego to się skończyło i przed czym uciekłaś. Potem zmień bodziec: inna piosenka, inny pokój, inny zapach. Z flashbackiem nie walczy się wpatrywaniem.',
      high:
        'Wróć do ciała techniką 5-4-3-2-1: 5 widzisz, 4 słyszysz, 3 dotykasz, 2 wąchasz, 1 smakujesz. To wyciąga z głowy do tu i teraz. Potem kilka wydechów dłuższych niż wdech, aż ciało zejdzie.',
    },
  },
  {
    id: 'kontakt_zewnetrzny',
    label: 'Ktoś go wspomniał',
    sublabel: 'Ktoś inny wprowadził go do twojego dnia',
    icon: '👤',
    intervention:
      'Ktoś wpuścił go do twojego dnia, ty go nie zaprosiłaś. To statystyka rozmów w małym świecie, nie znak.',
    subcategories: [
      {
        text: 'Dowiedziałam się czegoś przypadkiem',
        reframe:
          'Dostałaś informację, której nie szukałaś, i to nie twoja wina, że zabolała. Nie musisz z nią nic robić ani jej drążyć. Może zostać faktem, który mija, jeśli go nie rozgrzebujesz.',
      },
      {
        text: 'Znajomy o nim albo o niej mówił',
        reframe:
          'Ktoś wpuścił go do twojego dnia, ty go nie zaprosiłaś. To statystyka rozmów w małym świecie, nie znak. Masz prawo poprosić, żeby ten temat się przy tobie nie pojawiał.',
      },
      {
        text: 'Rodzina zapytała albo wspomniała',
        reframe:
          'Pytanie rodziny mówi o ich ciekawości albo nawyku, nie o tym, co masz czuć. Jedno krótkie zdanie wystarczy i wracasz do siebie. Nie jesteś nikomu winna relacji w formie aktualizacji.',
      },
      {
        text: 'Ktoś pokazał zdjęcie albo wspomnienie',
        reframe:
          'Ktoś inny wyciągnął archiwum, nie ty. Możesz spojrzeć i odłożyć, bez schodzenia w dół. Cudza pamięć trzyma starą wersję was, która już nie istnieje.',
      },
      {
        text: 'Słyszałam, jak ona wygląda',
        reframe:
          'Cudzy opis jej wyglądu to nie ranking, w którym stoisz. To, że jest podobna, nazwałaś już sama: byłaś wzorcem, nie zostałaś prześcignięta. Nie buduj jej obrazu w głowie z cudzych zdań.',
      },
    ],
    actions: {
      low:
        'Miej gotowe jedno zdanie domykające temat: "nie chcę o tym rozmawiać, opowiedz, co u ciebie". Przekieruj rozmowę na siebie albo na drugą osobę. Granica to nie niegrzeczność.',
      mid:
        'Po tym, jak ktoś go wspomniał, nazwij, co się podniosło: "czuję teraz smutek / złość / zazdrość". Jedno zdanie. Nazwanie emocji ścina jej napięcie. Nie musisz z nią nic robić poza nazwaniem.',
      high:
        'Jeśli cudza wzmianka odpaliła silną falę, nie goń jej sprawdzaniem ani wypytywaniem. Odsuń się na chwilę fizycznie, kilka wydechów dłuższych niż wdech, wróć dopiero gdy ciało zejdzie. Informacji, która zabolała, nie leczy się większą ilością informacji.',
    },
  },
]

export const getGhostCategory = (id: GhostCategory): GhostCategoryMeta =>
  GHOST_CATEGORIES.find(c => c.id === id) ?? GHOST_CATEGORIES[0]
