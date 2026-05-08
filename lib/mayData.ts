import type { AprilQuest } from './aprilData'

// MAJ 2026 — UKOJENIE
// Hasło: "Nie uciekam od bólu, ale już nie pozwalam mu prowadzić mojego życia."
// Pytanie miesiąca: "Za co dzisiaj mogę być naprawdę wdzięczna?"
//
// Quest typu AprilQuest reużywany — zostanie zrefaktoryzowany na MonthlyQuest
// w późniejszej iteracji (razem z hookiem useAprilQuests → useMonthlyQuests).

export const MAY_MOTTO = 'Nie uciekam od bólu, ale już nie pozwalam mu prowadzić mojego życia.'
export const MAY_NAME = 'Ukojenie'

export const MAY_QUESTS: AprilQuest[] = [
  // ── 1 maja, piątek — Wejście w maj bez karania się za kwiecień ──
  { id: 'may_01_1', date: '2026-05-01', title: 'Manifest maja', description: 'Napisz: w maju chcę… 3 rzeczy, które zostawiasz w kwietniu. 3 rzeczy, które bierzesz z kwietnia jako siłę.', pillar: 'pozycja', xp: 100 },
  { id: 'may_01_2', date: '2026-05-01', title: 'Wybierz rytuał ukojenia tygodnia', description: 'Spacer solo, domowe spa, książka, cisza, modlitwa, kawiarnia bez scrolla, długi prysznic. Zaplanuj kiedy.', pillar: 'pozycja', xp: 60 },

  // ── 2 maja, sobota — Ciało jako kotwica ──
  { id: 'may_02_1', date: '2026-05-02', title: 'Jedna aktywność ruchowa', description: 'Taniec, pilates, stretching, joga, szarfy, spacer dynamiczny, bouldering, squash. Po ruchu ma być lżej, nie idealnie.', pillar: 'cialo', xp: 80 },
  { id: 'may_02_2', date: '2026-05-02', title: 'Wyjdź z domu', description: 'Choćby na kawę albo spacer. Włosy, skóra, makijaż w wersji „mogę wyjść". Bez spektaklu.', pillar: 'styl', xp: 60 },

  // ── 3 maja, niedziela — Duchowość i reset ──
  { id: 'may_03_1', date: '2026-05-03', title: 'Kościół albo 20 min modlitwy/ciszy', description: 'Pierwsza niedziela maja. Cisza też jest formą powrotu do siebie.', pillar: 'pozycja', xp: 80 },
  { id: 'may_03_2', date: '2026-05-03', title: 'Plan tygodnia 4–10 maja', description: 'Top 3 zadania na poniedziałek. Przygotuj 3 outfity na tydzień.', pillar: 'pozycja', xp: 80 },

  // ── 4 maja, poniedziałek — Ster tygodnia ──
  { id: 'may_04_1', date: '2026-05-04', title: 'Top 3 priorytety tygodnia', description: '1. psychika/sen, 2. kariera/finanse, 3. ciało/relacje. Wypisz konkretnie.', pillar: 'pozycja', xp: 80 },
  { id: 'may_04_2', date: '2026-05-04', title: '30-min check finansowy', description: 'Saldo, wydatki, karta/dług, co ograniczasz w tym tygodniu. Bez oceniania siebie.', pillar: 'kariera', xp: 80 },
  { id: 'may_04_3', date: '2026-05-04', title: 'Jedna rzecz zawodowa', description: 'Oferta, CV, wiadomość, research, pipeline. Mały konkretny ruch.', pillar: 'kariera', xp: 60 },

  // ── 5 maja, wtorek — Kariera, nie chaos ──
  { id: 'may_05_1', date: '2026-05-05', title: 'Sprawdź 5 ofert, wybierz 1–2', description: 'Sensowne role do aplikowania albo przygotowania w tym tygodniu.', pillar: 'kariera', xp: 100 },
  { id: 'may_05_2', date: '2026-05-05', title: 'Dopracuj CV pod 1 kierunek', description: 'Jedna konkretna wersja CV pod konkretny typ roli. 30–45 min ruchu w ciągu dnia.', pillar: 'kariera', xp: 60 },

  // ── 6 maja, środa — Dzień ochronny ──
  { id: 'may_06_1', date: '2026-05-06', title: 'Lżejszy wieczór + pielęgnacja', description: 'Spokojniejszy wieczór, telefon poza łóżkiem 30 min przed snem. Mała rzecz estetyczna w domu albo przy sobie.', pillar: 'styl', xp: 60 },
  { id: 'may_06_2', date: '2026-05-06', title: '20 min spaceru', description: 'Bez analizy przeszłości, wspólnych znajomych ani sygnałów. Ciało, oddech, krok.', pillar: 'cialo', xp: 60 },

  // ── 7 maja, czwartek — Relacje wspierające ──
  { id: 'may_07_1', date: '2026-05-07', title: 'Odezwij się do 2 osób', description: 'Jedna bliska/stabilna, jedna ciekawa do odświeżenia. Umów jedno spotkanie na maj.', pillar: 'kapital', xp: 80 },
  { id: 'may_07_2', date: '2026-05-07', title: 'Lista 5 osób, przy których jesteś sobą', description: 'Twoja prawdziwa mapa relacji. Nie kto „się wybił", tylko przy kim oddychasz.', pillar: 'kapital', xp: 60 },

  // ── 8 maja, piątek — Kultura i rozmowa ──
  { id: 'may_08_1', date: '2026-05-08', title: '45 min kapitału kulturowego', description: 'Sztuka, historia, wino, etykieta, filozofia, ekonomia. Jeden temat, w głąb.', pillar: 'tozsamosc', xp: 80 },
  { id: 'may_08_2', date: '2026-05-08', title: '5 rzeczy do opowiedzenia przy kolacji', description: 'Spisz. Plus 10 min ćwiczenia mówienia: wolniej, mniej chaosu, pełniejsze zdania.', pillar: 'tozsamosc', xp: 60 },

  // ── 9 maja, sobota — Jakościowe wyjście #1 ──
  { id: 'may_09_1', date: '2026-05-09', title: 'Jakościowe wyjście #1', description: 'Kawa, wystawa, spacer w ładnej okolicy, lunch, taniec. Ubierz się świadomie.', pillar: 'kapital', xp: 120 },
  { id: 'may_09_2', date: '2026-05-09', title: 'Ćwicz postawę i obecność', description: 'Kontakt wzrokowy, spokojny uśmiech, bycie obecną bez udowadniania.', pillar: 'styl', xp: 60 },

  // ── 10 maja, niedziela — Podsumowanie tygodnia + miękki reset ──
  { id: 'may_10_1', date: '2026-05-10', title: 'Podsumowanie tygodnia 1', description: 'Co wzmocniło / rozregulowało? Czy pilnowałaś snu? Czy nie oddawałaś energii przeszłości?', pillar: 'pozycja', xp: 100 },
  { id: 'may_10_2', date: '2026-05-10', title: 'Plan tygodnia 11–17 maja', description: 'Top 3 na poniedziałek. Przygotuj ubrania na początek tygodnia.', pillar: 'pozycja', xp: 60 },

  // ── 11 maja, poniedziałek — Finanse bez paniki ──
  { id: 'may_11_1', date: '2026-05-11', title: 'Cotygodniowy check finansowy', description: 'Wpisz wydatki do trackera. Sprawdź czy trzymasz limit. Wybierz jedną rzecz do ograniczenia.', pillar: 'kariera', xp: 100 },
  { id: 'may_11_2', date: '2026-05-11', title: 'Mała rzecz dla kariery', description: 'Aplikacja, follow-up, wiadomość, research. Plus zapisz: pierwszy cel finansowy do końca czerwca.', pillar: 'kariera', xp: 60 },

  // ── 12 maja, wtorek — Aplikacje i pozycja zawodowa ──
  { id: 'may_12_1', date: '2026-05-12', title: 'Wyślij 1 dobrą aplikację albo wiadomość networkingową', description: 'Konkretny ruch, nie research bez końca.', pillar: 'kariera', xp: 120 },
  { id: 'may_12_2', date: '2026-05-12', title: 'Przejrzyj pipeline + 30–45 min ruchu', description: 'Statusy + kolejne kroki. Plus jedna historia interview do przećwiczenia.', pillar: 'kariera', xp: 60 },

  // ── 13 maja, środa — Skóra, styl, postawa ──
  { id: 'may_13_1', date: '2026-05-13', title: 'Pełna rutyna pielęgnacyjna + 10 min postawy', description: 'Rano i wieczorem. Barki w dół, szyja długa, klatka otwarta.', pillar: 'styl', xp: 80 },
  { id: 'may_13_2', date: '2026-05-13', title: 'Przegląd 5 rzeczy z szafy', description: 'Noszę / sprzedaję / poprawiam / oddaję. Plus jeden outfit na najbliższe wyjście.', pillar: 'styl', xp: 60 },

  // ── 14 maja, czwartek — Kapitał społeczny bez desperacji ──
  { id: 'may_14_1', date: '2026-05-14', title: 'Odezwij się do 2 osób + zaproponuj termin', description: 'Jednej osobie zaproponuj konkretny termin spotkania. Bez „kiedyś coś zrobimy".', pillar: 'kapital', xp: 100 },
  { id: 'may_14_2', date: '2026-05-14', title: 'Sprawdź 2 wydarzenia na końcówkę maja/czerwiec', description: 'Plus zapisz: gdzie warto wracać regularnie, żeby budować obieg.', pillar: 'kapital', xp: 60 },

  // ── 15 maja, piątek — Serce i standard relacyjny (BLOK SERCE) ──
  { id: 'may_15_1', date: '2026-05-15', title: 'List do dawnej relacji, którego nie wyślesz', description: 'Wylej wszystko brzydko, smutno, dramatycznie. Notatki przyjmą wszystko. Lepsze niż wysyłanie dumy kurierem do przeszłości.', pillar: 'milosc', xp: 120 },
  { id: 'may_15_2', date: '2026-05-15', title: '5 zachowań, których już nie chcesz w relacjach', description: 'Plus pytanie: jak wygląda miłość, w której nie muszę błagać? Wieczorem coś łagodnego: kąpiel, spacer, modlitwa, cisza.', pillar: 'milosc', xp: 80 },

  // ── 16 maja, sobota — Jakościowe doświadczenie ──
  { id: 'may_16_1', date: '2026-05-16', title: 'Jedno doświadczenie poza domem', description: 'Wydarzenie, sport, kawa, spacer, muzeum, spotkanie. Dopracowany wygląd.', pillar: 'kapital', xp: 120 },
  { id: 'may_16_2', date: '2026-05-16', title: 'Jedna chwila pełnej obecności', description: 'Jedna rozmowa, w której naprawdę jesteś — bez planowania kolejnych zdań w głowie.', pillar: 'pozycja', xp: 60 },

  // ── 17 maja, niedziela — Reset po połowie miesiąca ──
  { id: 'may_17_1', date: '2026-05-17', title: 'Ocena 1–10 w 6 obszarach', description: 'Psychika, sen, ciało, kariera, finanse, relacje. Bez bicia się — diagnoza.', pillar: 'pozycja', xp: 100 },
  { id: 'may_17_2', date: '2026-05-17', title: 'Plan drugiej połowy maja', description: 'Co tniesz jeśli za ciężko, co zostawiasz, co dokładasz. Top 3 na poniedziałek.', pillar: 'pozycja', xp: 80 },

  // ── 18 maja, poniedziałek — Nowy tydzień, mniejsza presja ──
  { id: 'may_18_1', date: '2026-05-18', title: 'Plan tygodnia + check finansowy', description: 'Bez upychania trzech dni w jeden. Stabilność buduje się powrotem.', pillar: 'pozycja', xp: 80 },
  { id: 'may_18_2', date: '2026-05-18', title: 'Jedna rzecz dla psychiki', description: 'Spacer, terapia, journaling, modlitwa, rozmowa z osobą stabilną. Co dziś realnie reguluje.', pillar: 'pozycja', xp: 60 },

  // ── 19 maja, wtorek — Kariera i odwaga ──
  { id: 'may_19_1', date: '2026-05-19', title: '1–2 aplikacje albo wiadomości zawodowe', description: 'Konkret. Nie planowanie, nie research — wysłane.', pillar: 'kariera', xp: 100 },
  { id: 'may_19_2', date: '2026-05-19', title: '30 min przygotowania do rozmów', description: 'Case, autoprezentacja. Sprawdź LinkedIn i jedną osobę, z którą warto się połączyć.', pillar: 'kariera', xp: 60 },

  // ── 20 maja, środa — Dzień ochronny II ──
  { id: 'may_20_1', date: '2026-05-20', title: 'Lżejszy wieczór + 30 min bez telefonu przed snem', description: 'Pielęgnacja. Zero social mediów, jeśli czujesz porównywanie.', pillar: 'styl', xp: 60 },
  { id: 'may_20_2', date: '2026-05-20', title: 'Porządek w jednym miejscu', description: 'Biurko, łazienka, szafa, stolik, torba. 20 min spokojnego ruchu.', pillar: 'cialo', xp: 60 },

  // ── 21 maja, czwartek — Relacje i zaproszenia ──
  { id: 'may_21_1', date: '2026-05-21', title: 'Zaproś jedną osobę na spotkanie', description: 'Konkretna data, konkretne miejsce. Plus 2 lekkie wiadomości do osób, z którymi warto utrzymać kontakt.', pillar: 'kapital', xp: 100 },
  { id: 'may_21_2', date: '2026-05-21', title: '3 wydarzenia czerwcowe budujące obieg', description: 'Lista. Plus 3 zdania, jak przedstawiasz się nowej osobie bez napinki.', pillar: 'kapital', xp: 60 },

  // ── 22 maja, piątek — Kapitał kulturowy i lekkość ──
  { id: 'may_22_1', date: '2026-05-22', title: '45 min nauki', description: 'Wino, sztuka, historia, ekonomia, hiszpański, angielski. Jeden temat, w głąb.', pillar: 'tozsamosc', xp: 80 },
  { id: 'may_22_2', date: '2026-05-22', title: '5 zdań notatki + 2 min nagrania mówienia', description: 'Jak opowiadasz o tym, czego się uczysz. Wieczorem coś przyjemnego, ale nie destrukcyjnego.', pillar: 'tozsamosc', xp: 60 },

  // ── 23 maja, sobota — Widoczność z klasą ──
  { id: 'may_23_1', date: '2026-05-23', title: 'Wyjście / aktywność dająca poczucie życia', description: 'Stylizacja świadoma, nie przebraniowa. Jeśli publikujesz: naturalne, subtelne, bez sygnałów do przeszłości.', pillar: 'kapital', xp: 100 },
  { id: 'may_23_2', date: '2026-05-23', title: 'Jedna dobra rozmowa albo kontakt', description: 'Bez udowadniania. Z energii „mam życie", nie „patrz, co straciłeś".', pillar: 'kapital', xp: 60 },

  // ── 24 maja, niedziela — Podsumowanie i prawda ──
  { id: 'may_24_1', date: '2026-05-24', title: 'Tygodniowy przegląd + impulsy', description: 'Ile razy miałaś impuls do kontaktu/analizowania? Czy pisałaś? Co triggerowało, co pomogło?', pillar: 'pozycja', xp: 100 },
  { id: 'may_24_2', date: '2026-05-24', title: 'Plan tygodnia 25–31 maja', description: 'Co musi być domknięte przed końcem miesiąca?', pillar: 'pozycja', xp: 60 },

  // ── 25 maja, poniedziałek — Domykanie finansów maja ──
  { id: 'may_25_1', date: '2026-05-25', title: 'Check finansowy maja', description: 'Ile wydałaś w maju. Co rozsądne, co emocjonalne, co zmieniasz w czerwcu.', pillar: 'kariera', xp: 120 },
  { id: 'may_25_2', date: '2026-05-25', title: 'Cel finansowy na czerwiec + 1 rzecz zawodowa', description: 'Konkretny, mierzalny cel. Plus jeden ruch zawodowy dziś.', pillar: 'kariera', xp: 60 },

  // ── 26 maja, wtorek — Kariera, kolejny poziom ──
  { id: 'may_26_1', date: '2026-05-26', title: 'Aktualizacja pipeline + 1 aplikacja/follow-up', description: 'Pełen rytm. Przećwicz jedną rozmowę rekrutacyjną.', pillar: 'kariera', xp: 100 },
  { id: 'may_26_2', date: '2026-05-26', title: 'Lista 5 firm „Projekt 30 career fit"', description: 'Gdzie zawodowo naprawdę chcesz być. I gdzie nie chcesz być za rok.', pillar: 'kariera', xp: 60 },

  // ── 27 maja, środa — Wizerunek i ciało ──
  { id: 'may_27_1', date: '2026-05-27', title: 'Pełna pielęgnacja + 10 min postawy', description: 'Środa-podtrzymanie. Bez wyciskania, ale z dbałością.', pillar: 'styl', xp: 80 },
  { id: 'may_27_2', date: '2026-05-27', title: '5 outfit formulas na czerwiec', description: 'Plus przegląd, czego realnie brakuje w garderobie — bez kupowania od razu.', pillar: 'styl', xp: 60 },

  // ── 28 maja, czwartek — Kapitał społeczny i czerwcowe wejścia ──
  { id: 'may_28_1', date: '2026-05-28', title: '3 wydarzenia/miejsca na czerwiec', description: 'Wybierz konkretne, zapisz daty. Które relacje pogłębiać, a które utrzymywać lekko.', pillar: 'kapital', xp: 80 },
  { id: 'may_28_2', date: '2026-05-28', title: 'Odezwij się do 2 osób + 1 wiadomość do osoby „mostu"', description: 'Ktoś, kto zna ciekawych ludzi. Plus umów minimum jedno spotkanie/aktywność.', pillar: 'kapital', xp: 60 },

  // ── 29 maja, piątek — Miłość i standard, bez iluzji ──
  { id: 'may_29_1', date: '2026-05-29', title: 'Lista standardów relacyjnych', description: 'Co nadal idealizujesz? Co było naprawdę trudne? Czego nie chcesz powtarzać? Po czym poznajesz, że jesteś wybierana?', pillar: 'milosc', xp: 100 },
  { id: 'may_29_2', date: '2026-05-29', title: '5 zdań „Jestem kobietą, która…"', description: 'Twoja deklaracja tożsamości w miłości. Pytanie bonusowe: tęsknisz za nim, czy za tym, kim czułaś się przy nim?', pillar: 'milosc', xp: 80 },

  // ── 30 maja, sobota — Jakościowe wyjście #2/#3 ──
  { id: 'may_30_1', date: '2026-05-30', title: 'Wyjście zgodne z przyszłą wersją siebie', description: 'Kultura, ruch, spotkanie, dobre miejsce, doświadczenie. Ubierz się jak kobieta, która nie czeka na zaproszenie do życia.', pillar: 'kapital', xp: 120 },
  { id: 'may_30_2', date: '2026-05-30', title: 'Jedna chwila obecności + jedna obserwacja', description: 'Mała refleksja, zdjęcie albo notatka. Nie musi być publikowane.', pillar: 'pozycja', xp: 60 },

  // ── 31 maja, niedziela — Wielkie podsumowanie maja ──
  { id: 'may_31_1', date: '2026-05-31', title: 'Wielkie podsumowanie maja', description: 'Przegląd 7 filarów: wnętrze, ciało, styl, kapitał społeczny, kariera/finanse, tożsamość, miłość. Plus: 10 rzeczy zrobionych dobrze, 5 rzeczy do czerwca, 3 rzeczy zostawiam, 1 zdanie podsumowania.', pillar: 'pozycja', xp: 200 },
]
