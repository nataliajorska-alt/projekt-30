import type { AprilQuest } from './aprilData'

// SIERPIEŃ 2026 — ZAUFANIE SOBIE (drugi miesiąc fazy 2: „Widoczność z pełni, nie z głodu. Najpierw fundament.")
// Hasło: ZAUFANIE SOBIE. Intencja: „Wiem, co jest dla mnie dobre. Nie muszę pytać o zgodę."
// Anty-zdanie: „A jak myślisz?" Marzenie miesiąca: domknięcie otwartych pętli.
// Pytanie miesiąca: „Czy doświadczam radości, będąc tu i teraz?"
// Pytanie kontrolne przy decyzjach: „Czyja to jest decyzja?" Kotwica na trudne: „Jestem w dobrych rękach."
// Gęstość: Etap 1 (1–13.08) i lądowanie (28–31.08) po 3 questy, Bali (14–27.08) po 2, 24.08 jeden.
// Zasada z lipca zostaje: maksymalnie JEDEN „projekt" dziennie, w Bali zero. Jeśli dzień rośnie — tnij.
// Zakres: 1–31.08. Cykl (okres potwierdzony 28.07, cykl 25 dni): okres 28.07–1.08 (ogon),
// folikularna 2–10, owulacja 11–13, lutealna 14–21 (Bali), okres ~22–26 (Bali), folikularna 27–31.
// Kalendarz: 13.08 ostatni dzień Etapu 1, 14.08 lot, BALI z mamą 15–27.08, 31.08 ostatni dzień w EY.

export const AUGUST_MOTTO = 'Wiem, co jest dla mnie dobre. Nie muszę pytać o zgodę.'
export const AUGUST_NAME = 'ZAUFANIE SOBIE'

export const AUGUST_QUESTS: AprilQuest[] = [
  // ── TYDZIEŃ 1 (1–2.08) „Miękki start, ustawiam miesiąc" ────────

  // ── 1 sierpnia, sobota | okres dzień 5, koniec ──
  { id: 'aug_01_1', date: '2026-08-01', title: 'Brain dump sierpnia + dwie kolumny', description: 'Kartka, 15 min: wszystko, co wisi. Potem dwie kolumny: pętle z unikania (Blanka, casting, winnica, finanse, EY) i procesy (sen, żałoba, poczucie wartości). Pierwszą kolumnę zamykasz w sierpniu, drugiej NIE — i to jest decyzja, nie porażka.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_01_2', date: '2026-08-01', title: 'Ogon okresu — dzień miękki', description: 'Magnez, ciepło, łagodny ruch albo świadomy odpoczynek. Sierpień startuje miękko.', pillar: 'cialo', xp: 60 },
  { id: 'aug_01_3', date: '2026-08-01', title: 'Daty dla pętli, nie intencje', description: 'Każdej pętli z pierwszej kolumny przypisz konkretny dzień między 3 a 13.08. Format: „jeśli jest wtorek 4.08 rano, to dzwonię do Blanki", nie „w tym tygodniu zadzwonię".', pillar: 'pozycja', xp: 60 },

  // ── 2 sierpnia, niedziela | SLOT WNĘTRZA 1/5 | folikularna start ──
  { id: 'aug_02_1', date: '2026-08-02', title: 'Slot Wnętrza 60 min (1/5) — list współczujący', description: 'Godzina na stałej porze. W środku list współczujący do siebie o sprawie Blanki, 15 min: co boli, że to zwyczajnie ludzkie, jeden życzliwy następny krok. Nie „jestem wspaniała", tylko „to jest trudne i wolno mi to czuć".', pillar: 'pozycja', xp: 100 },
  { id: 'aug_02_2', date: '2026-08-02', title: 'Plan tygodnia pętli 3–9.08', description: 'Na kartce: folikularna, trzy główne (Blanka, casting, winnica) plus trzy aktywności. Cała trudna robota w najlepszym oknie miesiąca.', pillar: 'pozycja', xp: 60 },
  { id: 'aug_02_3', date: '2026-08-02', title: 'Stała godzina pobudki na cały sierpień', description: 'Ustal i wpisz. To nie higiena snu, to kontrola bodźców — jedna z niewielu rzeczy, które na sen realnie działają.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 2 (3–9.08) „Tydzień pętli" ─────────────────────────

  // ── 3 sierpnia, poniedziałek | folikularna ──
  { id: 'aug_03_1', date: '2026-08-03', title: 'Przygotowanie eksperymentu: Blanka', description: 'Zapisz przewidywanie: „jeśli zadzwonię i powiem X, to Blanka…" plus procent, jak bardzo w to wierzysz. Wypisz zachowania zabezpieczające, które porzucasz: tłumaczenie się, przepraszanie, zmiękczanie, rekompensata. Zdefiniuj, co obaliłoby przewidywanie.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_03_2', date: '2026-08-03', title: 'Pierwsza aktywność tygodnia', description: 'Szarfy albo pole. Ciało wraca — jedyny filar, który w lipcu nie drgnął.', pillar: 'cialo', xp: 60 },
  { id: 'aug_03_3', date: '2026-08-03', title: 'Konstruktywne martwienie się, 15 min', description: 'Wczesnym wieczorem, minimum 2h przed snem: dwie kolumny — zmartwienie i następny krok. Kartkę złóż i zostaw obok łóżka. W nocy: „pracowałam nad tym o właściwej porze, o 2:00 nic lepszego nie wymyślę".', pillar: 'pozycja', xp: 60 },

  // ── 4 sierpnia, wtorek | folikularna | PĘTLA 1: BLANKA ──
  { id: 'aug_04_1', date: '2026-08-04', title: 'TELEFON DO BLANKI', description: 'Bez zachowań zabezpieczających z wczoraj. Po rozmowie od razu zapisz: co się faktycznie stało i na ile procent teraz wierzysz w przewidywanie. To jedno zdanie po jest ważniejsze niż cała rozmowa.', pillar: 'kapital', xp: 100 },
  { id: 'aug_04_2', date: '2026-08-04', title: 'Terapia: postaw sen jako temat', description: 'Jeśli sesja dziś — sen na stół. Praca z przekonaniami o śnie to najmocniejszy składnik leczenia bezsenności i jedyny, którego nie zrobisz questem.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_04_3', date: '2026-08-04', title: 'Po rozmowie: fala, nie instrukcja', description: 'Cokolwiek poczujesz, nie sprawdzaj jej profilu i nie analizuj tonu. To fala, nie instrukcja.', pillar: 'pozycja', xp: 60 },

  // ── 5 sierpnia, środa | folikularna | PĘTLA 2: CASTING ──
  { id: 'aug_05_1', date: '2026-08-05', title: 'Casting: odpowiedz dziś', description: 'Tak albo nie, ale odpowiedz dzisiaj — i bez pytania kogokolwiek o zdanie. Kandydatka na decyzję 1 z 3. Zapisz w Vault, co czułaś przed i po.', pillar: 'kariera', xp: 100 },
  { id: 'aug_05_2', date: '2026-08-05', title: 'EY: co znaczy „domknięte z klasą"', description: 'Wypisz konkretnie: kto, co, do kiedy. Po Bali zostaje jeden dzień roboczy — plan musi powstać teraz.', pillar: 'kariera', xp: 80 },
  { id: 'aug_05_3', date: '2026-08-05', title: 'Druga aktywność tygodnia', description: 'Ruch w folikularnej — najlepsze okno energii w Twoich danych.', pillar: 'cialo', xp: 60 },

  // ── 6 sierpnia, czwartek | folikularna | PĘTLA 3: WINNICA ──
  { id: 'aug_06_1', date: '2026-08-06', title: 'Winnica: decyzja, nie odkładanie', description: 'Albo kończysz w ten weekend, albo piszesz jedno zdanie, że nie kończysz. Oba domykają pętlę. Domknięcie to nie happy end — to koniec wiszenia w głowie.', pillar: 'kariera', xp: 100 },
  { id: 'aug_06_2', date: '2026-08-06', title: 'EY: kontakty i rekomendacje', description: 'Napisz do 3–5 osób, z którymi chcesz zostać w kontakcie, i poproś o rekomendację na LinkedIn teraz, póki jesteś świeża w ich pamięci. Za pół roku to już nie zadziała.', pillar: 'kapital', xp: 80 },
  { id: 'aug_06_3', date: '2026-08-06', title: 'Poranne światło + stała pobudka', description: '10 minut na zewnątrz zaraz po wstaniu.', pillar: 'cialo', xp: 60 },

  // ── 7 sierpnia, piątek | folikularna ──
  { id: 'aug_07_1', date: '2026-08-07', title: 'Trzecia aktywność — pełny rytm 3/3', description: 'Pierwszy tydzień z pełnym rytmem trzech aktywności od czerwca. Ruch nie musi być zasłużony.', pillar: 'cialo', xp: 80 },
  { id: 'aug_07_2', date: '2026-08-07', title: 'Jutro z listy wartości, nie przyjemności', description: 'Zaplanuj jutrzejszą aktywność z listy wartości (relacje, zdrowie, twórczość), z konkretną godziną i miejscem. Po niej oceń 0–10 nastrój i poczucie sprawstwa — oceny są robocze, nie ozdobne.', pillar: 'pozycja', xp: 60 },
  { id: 'aug_07_3', date: '2026-08-07', title: 'Życioumilacz z letniej listy', description: 'Kwiaty dla siebie albo książka w parku. Pozwolenie, nie zadanie.', pillar: 'styl', xp: 60 },

  // ── 8 sierpnia, sobota | folikularna ──
  { id: 'aug_08_1', date: '2026-08-08', title: 'Winnica: robota albo wolne bez winy', description: 'Jeśli kończysz — jeden dzień roboty i temat spada z listy. Jeśli nie — dzień wolny bez poczucia winy, bo decyzja zapadła w czwartek. Spokój po działaniu, nie przed.', pillar: 'kariera', xp: 80 },
  { id: 'aug_08_2', date: '2026-08-08', title: 'Kontakt społeczny z pełni', description: 'Jeden świadomy wieczór albo spotkanie. Obecność, nie analiza.', pillar: 'kapital', xp: 60 },
  { id: 'aug_08_3', date: '2026-08-08', title: 'Aparat analogowy — pierwsza klatka', description: 'Pierwsza klatka sierpnia.', pillar: 'tozsamosc', xp: 60 },

  // ── 9 sierpnia, niedziela | SLOT WNĘTRZA 2/5 | folikularna, koniec ──
  { id: 'aug_09_1', date: '2026-08-09', title: 'Slot Wnętrza 60 min (2/5) — trening konkretności', description: 'Weź jedną myśl, która się kręci, i przełóż ją z „dlaczego" na „jak": jak dokładnie to przebiegło, co konkretnie widziałaś i słyszałaś, co odróżnia tę sytuację od „zawsze" i „nigdy", jaki jest następny konkretny krok.', pillar: 'pozycja', xp: 100 },
  { id: 'aug_09_2', date: '2026-08-09', title: 'Plan 10–13.08 na kartce', description: 'Finanse, EY do końca, pakowanie, protokół jet lagu. Cztery dni, nie tydzień.', pillar: 'pozycja', xp: 60 },
  { id: 'aug_09_3', date: '2026-08-09', title: 'Kontrola bodźców wieczorem', description: 'Łóżko tylko do spania. Jeśli nie zasypiasz po ~20 minutach, wstań do drugiego pokoju przy przygaszonym świetle i wróć dopiero senna.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 3 (10–13.08) „Cztery dni na resztę i wylot" ────────

  // ── 10 sierpnia, poniedziałek | owulacja blisko | PĘTLA 4: FINANSE ──
  { id: 'aug_10_1', date: '2026-08-10', title: 'Finanse: 90 minut z arkuszem', description: 'Ile masz, ile kosztuje Bali i osobno policzony wrzesień: ostatnia pensja z EY wpada za sierpień, pierwsza z McKinseya najpewniej pod koniec września. Lepiej wiedzieć dziś niż 5 września.', pillar: 'kariera', xp: 100 },
  { id: 'aug_10_2', date: '2026-08-10', title: 'Dług po Patagonii: plan spłaty', description: 'Prosty plan na kartce. Zamknięta zakładka drenuje mniej niż otwarta, nawet jeśli kwota się nie zmienia.', pillar: 'kariera', xp: 60 },
  { id: 'aug_10_3', date: '2026-08-10', title: 'Pierwsza aktywność tygodnia', description: 'Ruch przed wylotem.', pillar: 'cialo', xp: 60 },

  // ── 11 sierpnia, wtorek | owulacja | PĘTLA 5: EY ──
  { id: 'aug_11_1', date: '2026-08-11', title: 'EY: domknięcie operacyjne', description: 'Sprzęt, formalności, świadectwo pracy, ustalone pożegnanie z zespołem. Sześć lat nie kończy się mailem.', pillar: 'kariera', xp: 100 },
  { id: 'aug_11_2', date: '2026-08-11', title: 'Terapia: umów termin powrotny już teraz', description: 'Sesja przed wylotem plus termin na ~28.08 zaklepany dziś. Ustal też, co bierzesz jako narzędzie na dwa tygodnie bez sesji. Sierpień to szczyt urlopów terapeutów — dziura bez terminu potrafi urosnąć do miesiąca.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_11_3', date: '2026-08-11', title: 'Jet lag: zaopatrzenie', description: 'Melatonina o natychmiastowym uwalnianiu 0,5–1 mg (nie przedłużonym, nie 5 mg — wyżej nie znaczy lepiej) i okulary przeciwsłoneczne, które faktycznie zaciemniają.', pillar: 'cialo', xp: 60 },

  // ── 12 sierpnia, środa | owulacja ──
  { id: 'aug_12_1', date: '2026-08-12', title: 'Pakowanie z głową', description: 'Rzeczy na okres (wypadnie w Bali ~22.08), magnez, apteczka, ubezpieczenie, klisze do aparatu.', pillar: 'cialo', xp: 80 },
  { id: 'aug_12_2', date: '2026-08-12', title: 'Druga aktywność tygodnia', description: 'Ruch w oknie energii.', pillar: 'cialo', xp: 60 },
  { id: 'aug_12_3', date: '2026-08-12', title: 'Afirmacja wartości, 15 min', description: 'Wybierz jedną najważniejszą wartość i napisz dwa akapity: dlaczego ma znaczenie i kiedy według niej zadziałałaś. Nie o Twoich cechach — o wartości. Schowaj kartkę: wyjmiesz ją 31 sierpnia wieczorem.', pillar: 'tozsamosc', xp: 80 },

  // ── 13 sierpnia, czwartek | owulacja | OSTATNI DZIEŃ ETAPU 1 ──
  { id: 'aug_13_1', date: '2026-08-13', title: 'Przegląd sześciu pętli', description: 'Która domknięta, która świadomie odpuszczona, która została i dlaczego. Uczciwie: „została, bo się bałam" i „została, bo świadomie ją odłożyłam" to dwie różne rzeczy — tylko jedna jest problemem.', pillar: 'pozycja', xp: 100 },
  { id: 'aug_13_2', date: '2026-08-13', title: 'McKinsey: tylko logistyka', description: 'Dokumenty, onboarding, garderoba, dojazd, plan pierwszego dnia. Zamknij temat i nie otwieraj go do 28.08.', pillar: 'kariera', xp: 80 },
  { id: 'aug_13_3', date: '2026-08-13', title: 'Preadaptacja bez fanatyzmu', description: 'Opcjonalnie: wstań godzinę wcześniej, rano wyjdź w mocne światło, wieczorem przygaś. Melatonina na miejscu zrobi więcej.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 4 (14–27.08) BALI — dwa questy dziennie, zero projektów ──
  // Tryb wyjazdowy w apce: zasada r1 zaliczona = dzień kompletny, nie nadrabiasz po powrocie.
  // Zero kodowania. Zero McKinseya. Dzień z zerem questów, bo życie się działo, też jest zaliczony.

  // ── 14 sierpnia, piątek | LOT | lutealna start ──
  { id: 'aug_14_1', date: '2026-08-14', title: 'Lot: zegarek na czas Bali', description: 'Przestaw od razu w samolocie i śpij według niego, nie według Warszawy.', pillar: 'cialo', xp: 60 },
  { id: 'aug_14_2', date: '2026-08-14', title: 'Nic nie musisz', description: 'To jest cały quest, nie żart.', pillar: 'pozycja', xp: 60 },

  // ── 15 sierpnia, sobota | PRZYLOT | Wniebowzięcie NMP | lutealna ──
  { id: 'aug_15_1', date: '2026-08-15', title: 'Protokół jet lagu, dzień 1', description: 'Rano unikaj mocnego światła mniej więcej do 10:30 czasu lokalnego (okulary, cień), potem wyjdź na pełne słońce. Wieczorem melatonina 0,5–1 mg o docelowej godzinie snu. Granicę światła przesuwaj o ~1,5h wcześniej każdego dnia.', pillar: 'cialo', xp: 60 },
  { id: 'aug_15_2', date: '2026-08-15', title: 'Wniebowzięcie NMP po swojemu', description: 'Jeśli chcesz, znajdź mszę (Kuta, Denpasar) albo zrób własny cichy moment. Twoja praktyka jedzie z Tobą.', pillar: 'pozycja', xp: 60 },

  // ── 16 sierpnia, niedziela | SLOT WNĘTRZA 3/5, wersja mini | lutealna ──
  { id: 'aug_16_1', date: '2026-08-16', title: 'Slot Wnętrza mini (3/5)', description: '15 minut: gdzie jestem, co czuję, czego chcę od tych dwóch tygodni. Jedno zdanie do Vault. Piętnaście minut dla siebie to nadal slot.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_16_2', date: '2026-08-16', title: 'Jet lag, dzień 2', description: 'Granica światła około 9:00, potem słońce. Melatonina o stałej godzinie snu.', pillar: 'cialo', xp: 60 },

  // ── 17 sierpnia, poniedziałek | lutealna ──
  { id: 'aug_17_1', date: '2026-08-17', title: 'Ruch, którego nie liczysz', description: 'Pływanie, długi spacer, joga — bo przyjemność, nie obowiązek. Ciało dostaje ten miesiąc za darmo i to jedyny sensowny sposób na filar, który nie drgnął w lipcu.', pillar: 'cialo', xp: 60 },
  { id: 'aug_17_2', date: '2026-08-17', title: 'Jedna klatka analogowa', description: 'Bali na kliszy.', pillar: 'tozsamosc', xp: 60 },

  // ── 18 sierpnia, wtorek | lutealna ──
  { id: 'aug_18_1', date: '2026-08-18', title: 'Mama: jedno prawdziwe zdanie', description: 'Jedna rozmowa, w której mówisz coś prawdziwego, nie tylko logistykę wyjazdu.', pillar: 'kapital', xp: 60 },
  { id: 'aug_18_2', date: '2026-08-18', title: 'Trzy drobiazgi + pytanie miesiąca', description: 'Zauważ trzy drobiazgi i zapisz jednym zdaniem. Czy doświadczam radości, będąc tu i teraz?', pillar: 'pozycja', xp: 60 },

  // ── 19 sierpnia, środa | lutealna | DECYZJA 2 z 3 ──
  { id: 'aug_19_1', date: '2026-08-19', title: 'Decyzja bez pytania nikogo (2 z 3)', description: 'Może być mała: gdzie idziesz, czego nie robisz, o której wstajesz, na co masz ochotę wbrew planowi. Im mniejsza stawka, tym czystszy trening. Zapisz w Vault, co czułaś przed i po.', pillar: 'tozsamosc', xp: 80 },
  { id: 'aug_19_2', date: '2026-08-19', title: 'Woda albo ruch', description: 'Ciało w rytmie wyspy.', pillar: 'cialo', xp: 60 },

  // ── 20 sierpnia, czwartek | lutealna ──
  { id: 'aug_20_1', date: '2026-08-20', title: 'Coś, czego nigdy nie robiłaś', description: 'Bali ma tego pod dostatkiem. Bucket, nie plan. Tożsamość buduje się doświadczeniem.', pillar: 'tozsamosc', xp: 60 },
  { id: 'aug_20_2', date: '2026-08-20', title: 'Wieczór bez ekranu', description: 'Regeneracja.', pillar: 'cialo', xp: 60 },

  // ── 21 sierpnia, piątek | późna lutealna, okres jutro ──
  { id: 'aug_21_1', date: '2026-08-21', title: 'Myśli po 21:00 odłóż do rana', description: 'Późna lutealna, łagodnie. Jeśli wieczorem przyjdzie myśl typu „jestem nie do wybrania" — to hormon z dostępem do mikrofonu, nie wgląd. Twoje dane mówią to samo od czterech cykli.', pillar: 'pozycja', xp: 60 },
  { id: 'aug_21_2', date: '2026-08-21', title: 'Miękko: magnez, ciepło, woda', description: 'Energia spada, Twoja wartość nie.', pillar: 'cialo', xp: 60 },

  // ── 22 sierpnia, sobota | OKRES START ──
  { id: 'aug_22_1', date: '2026-08-22', title: 'Okres na wakacjach: zmieniasz plan, nie siebie', description: 'Ciepło, magnez, wolniej — bez wyrzutów, że „marnujesz Bali".', pillar: 'cialo', xp: 60 },
  { id: 'aug_22_2', date: '2026-08-22', title: 'Jeden mały życioumilacz', description: 'Pozwolenie, nie zadanie.', pillar: 'styl', xp: 60 },

  // ── 23 sierpnia, niedziela | SLOT WNĘTRZA 4/5, wersja mini | okres ──
  { id: 'aug_23_1', date: '2026-08-23', title: 'Slot Wnętrza mini (4/5)', description: '15 minut: co ten wyjazd mi już dał. Jedno zdanie do Vault.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_23_2', date: '2026-08-23', title: 'Nic więcej. Naprawdę.', description: 'Połowa wyjazdu za Tobą i nic nie musisz nadrabiać.', pillar: 'pozycja', xp: 60 },

  // ── 24 sierpnia, poniedziałek | okres | JEDEN QUEST ──
  { id: 'aug_24_1', date: '2026-08-24', title: 'DZIEŃ BEZ TELEFONU', description: 'Wybrany z góry, nie improwizowany. Cały dowód obecności zamknięty w jednej decyzji. Świat poczeka.', pillar: 'tozsamosc', xp: 100 },

  // ── 25 sierpnia, wtorek | okres | EKSPERYMENT ──
  { id: 'aug_25_1', date: '2026-08-25', title: 'Eksperyment: „ja zrobię inaczej"', description: 'Rozmowa z mamą, w której mówisz „ja zrobię inaczej" i sprawdzasz, co się faktycznie dzieje. Najbezpieczniejsza możliwa wersja: osoba, która Cię kocha, mała stawka. Dokładnie ten sam mięsień co 4.08.', pillar: 'kapital', xp: 80 },
  { id: 'aug_25_2', date: '2026-08-25', title: 'Trzy drobiazgi', description: 'Zauważ i zapisz jednym zdaniem.', pillar: 'pozycja', xp: 60 },

  // ── 26 sierpnia, środa | okres ──
  { id: 'aug_26_1', date: '2026-08-26', title: 'Ostatni pełny dzień: szkoda-nie-zrobić', description: 'Zrób to, czego byłoby Ci szkoda nie zrobić. Nie to, co wypada.', pillar: 'tozsamosc', xp: 60 },
  { id: 'aug_26_2', date: '2026-08-26', title: 'Ostatnia klatka analogowa', description: 'Zamykasz wyjazd świadomie, nie w biegu.', pillar: 'styl', xp: 60 },

  // ── 27 sierpnia, czwartek | POWRÓT | folikularna ──
  { id: 'aug_27_1', date: '2026-08-27', title: 'Protokół powrotu', description: 'Zachód jest łatwiejszy niż wschód. W Warszawie: mocne światło wieczorem, unikaj mocnego światła wcześnie rano przez 2–3 dni, kładź się stopniowo później. Jesteś gotowa na 1 września, jeśli nie będziesz z tym walczyć.', pillar: 'cialo', xp: 60 },
  { id: 'aug_27_2', date: '2026-08-27', title: 'Nie planuj nic na jutro', description: 'Dzień 28 zostaje pusty. Wracasz bez nadrabiania.', pillar: 'pozycja', xp: 60 },

  // ── TYDZIEŃ 5 (28–31.08) „Lądowanie i próg" ────────────────────

  // ── 28 sierpnia, piątek | folikularna ──
  { id: 'aug_28_1', date: '2026-08-28', title: 'Lądowanie: zero projektów', description: 'Rozpakowanie, normalne jedzenie, spacer w popołudniowym świetle.', pillar: 'cialo', xp: 60 },
  { id: 'aug_28_2', date: '2026-08-28', title: 'Terapia po powrocie', description: 'Jeśli termin umówiony 11.08 — temat numer jeden: sen i to, co wydarzyło się w Bali.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_28_3', date: '2026-08-28', title: 'Kontrola bodźców wraca', description: 'Od dziś łóżko tylko do spania, od jutra stała pobudka.', pillar: 'cialo', xp: 60 },

  // ── 29 sierpnia, sobota | folikularna ──
  { id: 'aug_29_1', date: '2026-08-29', title: 'Przegląd sierpnia — część 1 (dane)', description: 'Pętle domknięte z sześciu, decyzje bez konsultacji z trzech, sloty Wnętrza z pięciu, aktywności tygodniowo, papierosy (sufit 12, tag „po queście"), Ghost Protocol, emocje.', pillar: 'pozycja', xp: 100 },
  { id: 'aug_29_2', date: '2026-08-29', title: 'Trzy lekcje sierpnia Twoimi słowami', description: 'Jak co miesiąc — i jak co miesiąc Twoje wersje są lepsze. Dane sierpnia to dane, nie ocena Ciebie.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_29_3', date: '2026-08-29', title: 'Aktywność — ciało wraca do rytmu', description: 'Przed wrześniem.', pillar: 'cialo', xp: 60 },

  // ── 30 sierpnia, niedziela | SLOT WNĘTRZA 5/5 | folikularna ──
  { id: 'aug_30_1', date: '2026-08-30', title: 'Slot Wnętrza 60 min (5/5) — rytuał zakończenia', description: 'Świeca i trzy zdania na kartce: co teraz wiem o sobie, czego nie wiedziałam 1.08. Kartka idzie do tej samej szuflady co czerwcowa.', pillar: 'pozycja', xp: 100 },
  { id: 'aug_30_2', date: '2026-08-30', title: 'Plan września na jednej kartce — chudo', description: 'Hasło i intencja, nic więcej. Pierwszy miesiąc w McKinseyu zje więcej energii, niż będziesz chciała przyznać, a wąskim gardłem jest energia, nie dyscyplina.', pillar: 'pozycja', xp: 80 },
  { id: 'aug_30_3', date: '2026-08-30', title: 'List do siebie na 1 października', description: 'Do Vault, zapieczętowany.', pillar: 'tozsamosc', xp: 60 },

  // ── 31 sierpnia, poniedziałek | OSTATNI DZIEŃ W EY | folikularna ──
  { id: 'aug_31_1', date: '2026-08-31', title: 'Ostatni dzień w EY — zaznacz go', description: 'Koniec rozdziału, który przez sześć lat trzymał Ci życie. Nie przemknij obok — to nie formalność.', pillar: 'kariera', xp: 100 },
  { id: 'aug_31_2', date: '2026-08-31', title: 'Wyjmij kartkę z 12.08 i przeczytaj', description: 'Jutro pierwszy dzień w McKinseyu — dokładnie ten moment, na który pisałaś afirmację wartości.', pillar: 'tozsamosc', xp: 60 },
  { id: 'aug_31_3', date: '2026-08-31', title: 'Wieczór: sen, ubranie, dojazd. Nie kucie', description: 'Sen o stałej godzinie, ubranie przygotowane, dojazd sprawdzony. Zatrudnili Cię 28 maja za to, kim jesteś, nie za to, co przeczytasz dziś wieczorem.', pillar: 'cialo', xp: 60 },
]
