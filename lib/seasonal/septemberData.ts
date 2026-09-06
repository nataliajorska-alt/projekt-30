import type { AprilQuest } from './aprilData'

// WRZESIEŃ 2026 — LEKKOŚĆ (trzeci, domykający miesiąc fazy 2)
// Hasło: „Nie wszystko musi być po coś." Zakres: 6–30.09, dwadzieścia pięć questów, JEDEN na dzień.
// Sidequestów nie ma w puli miesiąca — te losujesz sama.
//
// Definicja miesiąca: to nie jest „lepsza Natalia", tylko ta sama na innym zasilaniu.
// Wartość, która nie potrzebuje dowodu: robię rzeczy bez cudzego zatwierdzenia, znoszę
// bycie w czymś kiepską, nie pytam o zgodę i potrafię mieć dzień, który nic nie wyprodukował.
//
// Cztery mięśnie (pole `muscles`, litera widoczna na karcie questa — quest bez uzasadnienia
// to zajęcie, nie zmiana):
//   A — BEZ ZATWIERDZENIA: decyduję i działam, nie pytając o zgodę (wektor roku).
//   B — BEZ DOWODU: robię rzeczy, które nic nie dają i nic nie znaczą (hasło miesiąca).
//   C — ZE SOBĄ: czuję zamiast produkować (Cel 1 — jedyny nieruszony cel roku).
//   D — BEZ ODDAWANIA STERU: praca mnie nie zjada, McKinsey nie zostaje nowym EY.
// Rozkład: A ×4, B ×7, C ×12, D ×4. Suma 27 > 25, bo dwa questy (18 i 24.09) robią dwa
// mięśnie naraz. C dominuje celowo — Wnętrze stało na dwójce przez cały Q2.
//
// Zasady zaliczania (z planera, wpięte w apkę tam, gdzie się dało):
//   1. Quest zaliczony to ruch wykonany, nie efekt osiągnięty. Gwiazda liczy się po 20 minutach prób.
//   2. Niezrobiony quest NIE przechodzi na jutro — patrz NO_ROLLOVER w aprilData (brak „zaległych").
//   3. Wpisane questy się dzieją, niewpisane nie. Blok tygodnia wklepujesz w niedzielę, 5 minut.
//   4. Trzy stałe biegną pod spodem i NIE są questami: slot Wnętrza nd 19:00, check-in nastroju
//      przy ładowarce, sufit papierosów na warszawskich dniach roboczych.
//   5. Porażka to kontakt albo sprawdzanie. Kropka. Tęsknota nie jest porażką.
//
// Kalendarz: 6.09 lot do Budapesztu, 7–11.09 szkolenie McKinsey, 12.09 powrót,
// od 14.09 pierwszy pełny tydzień pracy w Warszawie, 30.09 domknięcie Fazy 2.
// Cykl: owulacja ~5–8.09 (najlepsze paliwo ląduje na szkoleniu — tam idą najodważniejsze questy),
// STREFA SZTORMOWA 14–19.09 (późna lutealna — ani jednego questu wymagającego odwagi),
// okres ~20.09, folikularna od ~25.09.
// Numeracja z planera: `wrz-06`…`wrz-30` = `sep_06_1`…`sep_30_1` (id trzyma konwencję apki).

export const SEPTEMBER_MOTTO = 'Nie wszystko musi być po coś.'
export const SEPTEMBER_NAME = 'LEKKOŚĆ'

export const SEPTEMBER_QUESTS: AprilQuest[] = [
  // ── TYDZIEŃ 1 (6–13.09) „Jestem tu, nie zdaję egzaminu" | Budapeszt, okno owulacyjne ──

  // ── 6 września, niedziela | LOT DO BUDAPESZTU ──
  { id: 'sep_06_1', date: '2026-09-06', title: 'Lot bez produktywności', muscles: ['B'],
    description: 'Cała podróż bez pracy, bez apki, bez przygotowywania się do szkolenia. Muzyka, okno, książka, drzemka. Cue: moment, w którym siadasz w fotelu. Lekkość zaczyna się od jednej godziny, w której niczego nie budujesz — quest odhaczasz wieczorem, nie w powietrzu.',
    pillar: 'pozycja', xp: 60 },

  // ── 7 września, poniedziałek | dzień 1 szkolenia | owulacja ──
  { id: 'sep_07_1', date: '2026-09-07', title: 'Pierwsza się przedstawiam (3 osoby)', muscles: ['A'],
    description: 'Trzy osoby, do których podchodzisz TY, na przerwach. Cue: pierwsza przerwa kawowa, trzy razy po dwie minuty. Istotą jest porzucenie zabezpieczeń, nie sama rozmowa: nie stój z telefonem w ręku, nie tłumacz się, że dopiero dołączyłaś, nie czekaj na pierwszy krok. Rana brzmi „jestem nie do wybrania" — jedyne, co w sierpniu zadziałało, to ruchy bez zatwierdzenia.',
    pillar: 'kapital', xp: 100 },

  // ── 8 września, wtorek | dzień 2 szkolenia | owulacja ──
  { id: 'sep_08_1', date: '2026-09-08', title: 'Slot podróżny, 3 minuty', muscles: ['C'],
    description: 'Self-compassion break na łóżku, cue: po odłożeniu telefonu na ładowarkę. Trzy kroki, dosłownie: „to jest trudne", „trudno jest każdemu, kto zaczyna od nowa", ręka na klatce piersiowej i „czego teraz potrzebuję?". Slot 0 na 5 w sierpniu, więc zaczynamy od wersji, której nie da się nie zrobić.',
    pillar: 'pozycja', xp: 60 },

  // ── 9 września, środa | dzień 3 szkolenia | owulacja ──
  { id: 'sep_09_1', date: '2026-09-09', title: 'Zdanie, którego nie zmiękczam', muscles: ['A'],
    description: 'Powiedz na szkoleniu jedną rzecz BEZ „może", „chyba", „nie znam się, ale", „a jak myślicie". Jedno zdanie w całym dniu wystarczy, dziesięć sekund. Cue: pierwsza sytuacja, w której masz zdanie i odruch je osłabić. „Oni wiedzą lepiej niż ja" żyje w gramatyce, zanim wejdzie w decyzje.',
    pillar: 'kariera', xp: 80 },

  // ── 10 września, czwartek | dzień 4 szkolenia ──
  { id: 'sep_10_1', date: '2026-09-10', title: 'Jedna rzecz bez powodu w obcym mieście', muscles: ['B'],
    description: 'Wieczorem coś, z czego nic nie wynika. Nie zwiedzanie z listy, nie networking, nie „skoro już tu jestem, to warto". Cue: koniec zajęć. Sierpień dał wulkan i imprezę samej, czyli rzeczy odważne — wrzesień prosi o trudniejsze: rzecz bezcelową.',
    pillar: 'tozsamosc', xp: 60 },

  // ── 11 września, piątek | dzień 5 szkolenia, powrót ──
  { id: 'sep_11_1', date: '2026-09-11', title: 'Notatka po Budapeszcie, 5 zdań', muscles: ['C'],
    description: 'Nie o tym, czego się nauczyłaś. O tym, JAK SIĘ CZUŁAŚ w tygodniu, w którym nikt Cię nie znał. Cue: lotnisko albo lot powrotny, dziesięć minut. W sierpniu było czternaście check-inów na dwadzieścia pięć dni, a w jedenastu dniach Bali dokładnie jeden — przez to nie da się rozstrzygnąć, czy „mniej dało więcej". 30.09 to jest materiał dowodowy.',
    pillar: 'pozycja', xp: 80 },

  // ── 12 września, sobota | powrót, weekend ──
  { id: 'sep_12_1', date: '2026-09-12', title: 'Termin terapii + zdanie o śnie', muscles: ['C'],
    description: 'Termin w kalendarzu, bez przerwy we wrześniu. Do tego jedno zdanie do przyniesienia na sesję: „chcę pracować nad snem". Cue: sobotnia kawa, piętnaście minut. Terapia to jedyna rzecz, która kiedykolwiek ruszyła Wnętrze z 2.0, a połowa września to jedyne okno w roku na restrykcję snu. Restrykcja snu działa (iOR 1.49), higiena snu nie (1.01) — nie wracaj do niej po raz czwarty.',
    pillar: 'pozycja', xp: 120 },

  // ── 13 września, niedziela | PIERWSZY PEŁNY SLOT ──
  { id: 'sep_13_1', date: '2026-09-13', title: 'Slot Wnętrza pełny + wklep tydzień', muscles: ['C'],
    description: 'Dwadzieścia minut, 19:00, telefon w drugim pokoju. Treść do wyboru, nie wszystko naraz: self-compassion break, przełożenie „dlaczego" na „jak", albo to, co samo zadziałało na Deep Reset. Na koniec pięć minut: wklep questy tygodnia 2 do apki. W sierpniu wpisane questy zrobiłaś w komplecie, niewpisane nie wydarzyły się ani razu — to cue, nie silna wola.',
    pillar: 'pozycja', xp: 120 },

  // ── TYDZIEŃ 2 (14–20.09) „Miękko. To fala, nie diagnoza" ────────
  // STREFA SZTORMOWA 14–19.09: późna lutealna + pierwszy pełny tydzień pracy.
  // Ani jednego questu wymagającego odwagi. To projekt, nie przypadek — wszystkie
  // klastry Ghost Protocola siedzą w ostatnim tygodniu przed okresem.

  // ── 14 września, poniedziałek | początek sztormu ──
  { id: 'sep_14_1', date: '2026-09-14', title: 'Godzina końca pracy, ustalona rano', muscles: ['D'],
    description: 'Rano wpisz w kalendarz godzinę, o której kończysz. Wieczorem jej nie negocjujesz. Cue: pierwsza kawa przy biurku, minuta. McKinsey nie zostaje nowym EY: praca bez nagrody była jednym z czterech największych drenów 2025, a zmieniłaś pracę, żeby to naprawić. Pierwszy miesiąc to nauka systemu, nie dowód wartości — rekrutowali Cię pół roku i już podjęli decyzję. Od dziś do 19.09 obowiązują wersje minimum wszystkiego.',
    pillar: 'kariera', xp: 80 },

  // ── 15 września, wtorek | sztorm ──
  { id: 'sep_15_1', date: '2026-09-15', title: 'Trzecia osoba', muscles: ['C'],
    description: 'Kiedy przyjdzie fala, mów do siebie po imieniu, nie „ja": „Natalia teraz czuje zazdrość. Co Natalia mogłaby teraz zrobić?". Cue: pierwsza fala dnia, kiedykolwiek przyjdzie, trzydzieści sekund. Dystans językowy obniża reaktywność, zanim zdążysz zbudować wokół uczucia historię.',
    pillar: 'pozycja', xp: 60 },

  // ── 16 września, środa | sztorm ──
  { id: 'sep_16_1', date: '2026-09-16', title: '„Dlaczego" na „jak"', muscles: ['C'],
    description: 'Kiedy głowa zaczyna kręcić „dlaczego on", „dlaczego ja", „dlaczego to niesprawiedliwe", przełóż to na jedno konkretne pytanie: „jak przejdę przez ten wieczór". Zapisz to zdanie. Cue: moment, w którym łapiesz się na „dlaczego", minuta. Front się przesunął: „nie napisać" jest rozwiązane, zostało „nie ruminować", a to inna umiejętność.',
    pillar: 'pozycja', xp: 60 },

  // ── 17 września, czwartek | sztorm ──
  { id: 'sep_17_1', date: '2026-09-17', title: '20 minut ruchu, obojętnie jakiego', muscles: ['C'],
    description: 'Tango, pole, szarfy albo zwykły spacer. Zero oceny formy, zero „to się nie liczy, bo tylko spacer". Cue: po pracy, przed kolacją. Forma nie jest celem 2026, tylko regulatorem — w sierpniu Ciało skoczyło z 2 na 5 w tydzień po powrocie do tanga. Nastrój nadąża za zachowaniem z opóźnieniem tygodnia lub dwóch, więc brak ulgi tego samego wieczoru nie jest dowodem, że nie działa.',
    pillar: 'cialo', xp: 60 },

  // ── 18 września, piątek | sztorm | DWA MIĘŚNIE ──
  { id: 'sep_18_1', date: '2026-09-18', title: 'Piątek bez odrabiania', muscles: ['B', 'D'],
    description: 'Nie nadrabiasz niczego. Ani w pracy, ani w apce, ani w projekcie, ani w głowie. Cue: koniec pracy, cały wieczór. 31 sierpnia, ostatni dzień sześciu lat w EY, skończył się wynikiem dwadzieścia XP i dwanaście papierosów. Zmęczenie nie jest długiem do spłaty i nie ma dnia, w którym trzeba je odpracować.',
    pillar: 'pozycja', xp: 60 },

  // ── 19 września, sobota | ostatni dzień sztormu ──
  { id: 'sep_19_1', date: '2026-09-19', title: 'Trzy rzeczy trudne, które nie są moją winą', muscles: ['C'],
    description: 'Wypisz trzy. Bez rozwiązywania ich, bez planu naprawczego, bez wniosków. Sama lista, pięć minut, kiedykolwiek w ciągu dnia. W jednym tygodniu sierpnia system trzy razy zapisał uczucie jako porażkę — Twój system nie ma rubryki na „zrobiłam wszystko dobrze i i tak bolało", więc ból ląduje w rubryce winy. To jest ta brakująca rubryka.',
    pillar: 'pozycja', xp: 60 },

  // ── 20 września, niedziela | okres, slot ──
  { id: 'sep_20_1', date: '2026-09-20', title: 'Slot Wnętrza miękki + wklep tydzień', muscles: ['C'],
    description: '19:00. Dziś wolno zrobić wersję trzyminutową i liczy się jako pełny slot — od 3 do 20 minut, Twój wybór. Plus pięć minut na wklepanie questów tygodnia 3. Pierwszy dzień okresu: w sierpniu, w pierwszym dniu okresu, w obcym kraju, poszłaś sama na imprezę i wiedziałaś po co. Dziś nie musisz nikomu niczego udowadniać, łącznie z sobą.',
    pillar: 'pozycja', xp: 80 },

  // ── TYDZIEŃ 3 (21–27.09) „Rytm, nie zryw" | folikularna od ~25.09 ──

  // ── 21 września, poniedziałek ──
  { id: 'sep_21_1', date: '2026-09-21', title: 'Pierwszy papieros z opóźnieniem 10 min', muscles: ['D'],
    description: 'Kiedy przyjdzie ochota na pierwszego papierosa dnia, odczekaj dziesięć minut. Nie zakaz, opóźnienie. Zapisz, ile razy w tygodniu się udało. Cue: pierwsza ochota po przebudzeniu. W sierpniu palenie przeniosło się na rano (33% przedpołudniem), a stres skoczył z 20 na 51% wyzwalaczy — palisz z lęku antycypacyjnego przed dniem, nie z rozładowania po nim. Sufit jest narzędziem obserwacji, nie strategią rzucania: 5.04.2027 musi być prawdziwą datą.',
    pillar: 'cialo', xp: 60 },

  // ── 22 września, wtorek | MARZENIE MIESIĄCA ──
  { id: 'sep_22_1', date: '2026-09-22', title: 'Gwiazda, próba pierwsza', muscles: ['B'],
    description: 'Dwadzieścia minut. W parku, w domu, na sali. Filmik dla siebie, NIE na Instagram. Cue: po pracy. Marzenie miesiąca — i mały guardrail: w chwili, w której gwiazda trafia na Instagram, przestaje być rzeczą bez powodu, a staje się widocznością, i traci całą funkcję. Quest zaliczony po dwudziestu minutach prób, niezależnie od tego, czy stanęłaś.',
    pillar: 'cialo', xp: 80 },

  // ── 23 września, środa ──
  { id: 'sep_23_1', date: '2026-09-23', title: 'Decyzja bez konsultacji (procent przed i po)', muscles: ['A'],
    description: 'Jedna decyzja, dowolnej wielkości. Przed: zapisz, czego się spodziewasz i na ile procent jesteś pewna. Po: przelicz, co się faktycznie stało. Cue: pierwsza decyzja dnia, przy której łapiesz odruch zapytania kogoś. Sam procent to połowa skuteczności — bez niego głowa po fakcie przepisze historię na „przecież wiedziałam, że będzie dobrze". Telefon do Blanki jest tego dowodem: bałaś się miesiąc, rozmowa trwała kilkanaście minut.',
    pillar: 'tozsamosc', xp: 120 },

  // ── 24 września, czwartek | DWA MIĘŚNIE ──
  { id: 'sep_24_1', date: '2026-09-24', title: 'Bez trzeciego sprawdzenia', muscles: ['A', 'B'],
    description: 'Jedna rzecz w pracy wysłana po dwóch przejściach zamiast po pięciu. Bez dopieszczania, bez maila zaczynającego się od „przepraszam, że dopiero teraz". Cue: pierwsza rzecz, którą masz wysłać — oszczędzasz czas, nie tracisz. Rana brzmi „muszę zasłużyć", a pierwszy miesiąc w nowej firmie to najbardziej naturalne miejsce, żeby ją odegrać, i dlatego najlepsze miejsce, żeby jej nie odegrać.',
    pillar: 'kariera', xp: 120 },

  // ── 25 września, piątek ──
  { id: 'sep_25_1', date: '2026-09-25', title: 'Check finansowy, raz w miesiącu', muscles: ['D'],
    description: 'Trzydzieści minut: pierwsza wypłata z McKinseya, co realnie robi z długiem i z miesiącem. Cue: piątek, po pracy. RAZ, nie co tydzień. Brak finansowego oddechu był jednym z czterech głównych drenów 2025, a to pierwszy miesiąc, w którym liczba faktycznie się zmienia — warto ją zobaczyć, zamiast się jej domyślać. To higiena, nie interwencja: działa przez zamknięcie otwartej zakładki.',
    pillar: 'kariera', xp: 80 },

  // ── 26 września, sobota ──
  { id: 'sep_26_1', date: '2026-09-26', title: 'Jedna rzecz z życioumilaczy', muscles: ['B'],
    description: 'Kwiaty kupione sobie, kawa w oknie bez telefonu, targ, antykwariat, wystawa, taniec w kuchni do jednej piosenki. Cue: sobotni poranek, ile chcesz. WAŻNE: odhacz quest, ale nie opisuj w apce, co to było. Rzecz bez powodu, która zostaje udokumentowana, przestaje być bez powodu — apka jest zbudowana wokół nagrody i wszystko, co do niej wpadnie, robi się poważne.',
    pillar: 'styl', xp: 60 },

  // ── 27 września, niedziela ──
  { id: 'sep_27_1', date: '2026-09-27', title: 'Slot Wnętrza pełny + pytanie kontrolne', muscles: ['C'],
    description: 'Dwadzieścia minut, 19:00. Na koniec jedno pytanie na kartce, nie w apce: „Co w tym miesiącu zrobiłam, bo chciałam, a nie dlatego, że się opłacało?". Plus pięć minut na wklepanie ostatnich questów. To próbna wersja pytania, które padnie 30.09 — lepiej, żeby nie zaskoczyło Cię przy ceremonii.',
    pillar: 'pozycja', xp: 120 },

  // ── TYDZIEŃ 4 (28–30.09) „Zamykam fazę" | folikularna, energia rośnie ──

  // ── 28 września, poniedziałek ──
  { id: 'sep_28_1', date: '2026-09-28', title: 'Gwiazda, próba druga', muscles: ['B'],
    description: 'Dwadzieścia minut. Wyjdzie albo nie wyjdzie, i jedno, i drugie jest w porządku. Marzenie miesiąca ma klauzulę, której nie miało żadne poprzednie: jeśli 30.09 gwiazda nadal nie wychodzi, marzenie jest spełnione, o ile próbowałaś. To nie ustępstwo, tylko treść hasła — miesiąc lekkości z marzeniem na zaliczenie byłby sprzeczny sam ze sobą.',
    pillar: 'cialo', xp: 80 },

  // ── 29 września, wtorek ──
  { id: 'sep_29_1', date: '2026-09-29', title: 'Wyjmij kartkę, nie otwieraj', muscles: ['C'],
    description: 'Wyjmij kartkę spisaną 27 czerwca z miejsca, w którym leży, i połóż ją ZAMKNIĘTĄ na stole. Zostaw do jutra. Minuta. Kartka pracuje w ciszy od trzech miesięcy; jutro sprawdzisz, ile z tamtych trzech zdań jest nadal prawdą. Dziś tylko przypominasz sobie, że istnieje. Nie zaglądaj.',
    pillar: 'tozsamosc', xp: 60 },

  // ── 30 września, środa | DOMKNIĘCIE FAZY 2 ──
  { id: 'sep_30_1', date: '2026-09-30', title: 'Ceremonia + przegląd kwartalny + kartka', muscles: ['C'],
    description: 'Blok w kalendarzu, dwie godziny, wieczór. Trzy rzeczy w tej kolejności: ceremonia września w apce plus oceny siedmiu filarów; przegląd kwartalny lipiec–wrzesień, czyli koniec Fazy 2, z pytaniem fazy „czy moja wartość stoi, kiedy życie znów się wypełnia?"; otwierasz kartkę z 27.06 i sprawdzasz, ile z tych trzech zdań jest nadal prawdą. Plus pytanie, którego nie było w żadnym poprzednim miesiącu: „czy potrafię wskazać choć jedną rzecz z tego miesiąca, która do niczego nie posłużyła?". Jeśli tak, wrzesień się udał, niezależnie od reszty tabelki.',
    pillar: 'pozycja', xp: 200 },
]
