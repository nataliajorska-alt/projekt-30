import type { AprilQuest } from './aprilData'

// LIPIEC 2026 — WŁASNE PIÓRO (start fazy 2: Widoczność i wejście do obiegu)
// Hasło robocze: "Odzyskuję pióro. Moją wartość piszę ja, nie cudze reakcje."
// Intencja: "Najpierw mój werdykt." Anty-słowo: aprobata / sprawdzanie.
// Pytanie miesiąca: "Czyim piórem dziś pisałam swoją wartość?"
// Marzenie: urlop, z którego wracam zakorzeniona, do nowej pracy wchodzę jako ktoś, kto pasuje.
// Zakres: 1–22.07 (urlop). 23–31.07 do osobnej decyzji.

export const JULY_MOTTO = 'Odzyskuję pióro. Moją wartość piszę ja, nie cudze reakcje.'
export const JULY_NAME = 'Własne pióro'

export const JULY_QUESTS: AprilQuest[] = [
  // ── TYDZIEŃ 1 (1–7.07) "Mieszkanie i miękkie lądowanie" ────────

  // ── 1 lipca, środa | późna lutealna / PMS | projekt: mieszkanie ──
  { id: 'jul_01_1', date: '2026-07-01', title: 'Rama urlopu + mapa wartości', description: 'Wpisz do kalendarza ramę 1–22.07 (T1 mieszkanie, T2 biznes-research, T3 rozbieg do pracy), 3 sloty Wnętrza (niedz 5/12/19.07), miesiączka od 4.07. I wypisz 3 przecieki wartości (analizowanie cudzych zachowań, strach przed odrzuceniem, strach o opinie) + co znaczy dla Ciebie "odzyskać pióro" w lipcu.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_01_2', date: '2026-07-01', title: 'Mieszkanie — najłatwiejsza strefa, 60 min', description: 'Jedna strefa, najmniej obciążająca na start. Nie cała chata. Dajesz sobie dobre miejsce, bo jesteś tego warta.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_01_3', date: '2026-07-01', title: '10 min porannego światła bez telefonu', description: 'Zaraz po wstaniu, telefon poza ręką. Konfiguruje cykl dobowy i nastrój.', pillar: 'cialo', xp: 60 },

  // ── 2 lipca, czwartek | PMS | mieszkanie ──
  { id: 'jul_02_1', date: '2026-07-02', title: 'Dowód dla siebie', description: 'Rano jedna konkretna obietnica dana sobie, wieczorem odhacz, czy dotrzymana. Zaufanie do siebie buduje się dowodami, nie afirmacjami.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_02_2', date: '2026-07-02', title: 'Mieszkanie — druga strefa, 45–60 min', description: 'Krótko i konkretnie. Domknij, nie rozgrzebuj kolejnej.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_02_3', date: '2026-07-02', title: 'Wieczór bez scrolla od 21:30', description: 'Telefon do innego pokoju.', pillar: 'cialo', xp: 60 },

  // ── 3 lipca, piątek | PMS na progu | mieszkanie ──
  { id: 'jul_03_1', date: '2026-07-03', title: 'Stop-analiza', description: 'Gdy łapiesz się na rozkładaniu czyjegoś zachowania na części: nazwij "analizuję" i przekieruj jednym pytaniem "a co JA o tym myślę". Wieczorem zapisz, ile razy.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_03_2', date: '2026-07-03', title: 'Spacer 30 min bez telefonu', description: 'Świadomie 5 rzeczy zmysłami: drzewo, ptak, zapach, dźwięk, faktura.', pillar: 'cialo', xp: 60 },
  { id: 'jul_03_3', date: '2026-07-03', title: 'Magnez + ciepły prysznic, sen przed 23', description: 'Troska o ciało pod okres.', pillar: 'cialo', xp: 60 },

  // ── 4 lipca, sobota | MIESIĄCZKA START | odpoczynek ──
  { id: 'jul_04_1', date: '2026-07-04', title: 'Tryb minimum + jedno zdanie', description: 'Twarz, zęby, 10 min na powietrzu, normalnie zjeść, jedno zdanie: "dziś odpoczywam, bo jestem tego warta, nie bo zasłużyłam". Zero agendy mieszkaniowej.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_04_2', date: '2026-07-04', title: 'Świadomy odpoczynek', description: 'Pierwszy dzień okresu = najniższa energia. Minimum bodźców, ciepło na brzuch.', pillar: 'cialo', xp: 60 },
  { id: 'jul_04_3', date: '2026-07-04', title: 'Magnez + wieczorny rytuał', description: 'Kąpiel, książka, sen.', pillar: 'cialo', xp: 60 },

  // ── 5 lipca, niedziela | SLOT WNĘTRZA 1 | miesiączka d2 ──
  { id: 'jul_05_1', date: '2026-07-05', title: 'Slot Wnętrza 60 min — wartość w centrum', description: 'Journaling RAIN (Recognize, Allow, Investigate, Nurture) o jednym przecieku, np. strachu przed odrzuceniem. Skąd się bierze, czyje to pióro.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_05_2', date: '2026-07-05', title: 'Plan tygodnia 6–12.07', description: '3 priorytety, ruch wpisany. Tydzień biznes-research.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_05_3', date: '2026-07-05', title: 'Wieczorny rytuał, sen przed 23', description: 'Domknięcie dnia.', pillar: 'cialo', xp: 60 },

  // ── 6 lipca, poniedziałek | miesiączka d3 | mieszkanie ──
  { id: 'jul_06_1', date: '2026-07-06', title: 'Mój werdykt', description: 'Przed sprawdzeniem czyjejkolwiek reakcji na cokolwiek dziś, najpierw wystaw własną ocenę i zapisz ją.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_06_2', date: '2026-07-06', title: 'Mieszkanie — trzecia strefa, lekko', description: 'Tylko jeśli energia jest. Przy okresie wolno odpuścić.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jul_06_3', date: '2026-07-06', title: '30 min lekkiego spaceru', description: 'Ruch i światło, bez telefonu.', pillar: 'cialo', xp: 60 },

  // ── 7 lipca, wtorek | miesiączka d4 | koniec T1 ──
  { id: 'jul_07_1', date: '2026-07-07', title: 'Przegląd dowodów wartości — tydzień 1', description: 'Co w tym tygodniu pokazało, że można na sobie polegać. Spisz 3 dowody.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_07_2', date: '2026-07-07', title: 'Mieszkanie — domknij jedną strefę do końca', description: 'Poczucie "skończone" w jednym miejscu, zamiast pięciu rozgrzebanych.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jul_07_3', date: '2026-07-07', title: 'Wieczór bez scrolla + 20 min czytania', description: 'Książka z półki, nie nowy zakup. Zero emocjonalnych zakupów.', pillar: 'tozsamosc', xp: 60 },

  // ── TYDZIEŃ 2 (8–14.07) "Biznes na smyczy i odwaga" ────────────

  // ── 8 lipca, środa | folikularna | projekt: biznes-research ──
  { id: 'jul_08_1', date: '2026-07-08', title: 'Mini-ekspozycja', description: 'Jedna rzecz mimo ryzyka cudzej dezaprobaty: wyrażone zdanie, prośba, "nie". Zapisz: czego się bałaś vs co się realnie stało.', pillar: 'milosc', xp: 80 },
  { id: 'jul_08_2', date: '2026-07-08', title: 'Biznes na smyczy — 45 min, "co by było gdyby"', description: 'Wypisz pomysł(y) bez zobowiązań. Pozwolenie sobie na marzenie jest dowodem wartości. To eksploracja, nie launch.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_08_3', date: '2026-07-08', title: 'Spacer 30 min bez telefonu', description: 'Ruch, oddech.', pillar: 'cialo', xp: 60 },

  // ── 9 lipca, czwartek | folikularna | biznes-research ──
  { id: 'jul_09_1', date: '2026-07-09', title: 'Dowód dla siebie', description: 'Obietnica sobie rano, odhaczenie wieczorem.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_09_2', date: '2026-07-09', title: 'Biznes — jeden kierunek, 45 min', description: 'Kto już to robi, co Cię realnie ciągnie. Bez decyzji, sam research.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_09_3', date: '2026-07-09', title: 'Aktywność fizyczna tygodnia (1)', description: 'Joga, dłuższy spacer, jazda konna. Korzystaj z rosnącej energii folikularnej.', pillar: 'cialo', xp: 80 },

  // ── 10 lipca, piątek | folikularna | biznes-research ──
  { id: 'jul_10_1', date: '2026-07-10', title: 'Stop-analiza → "czego ja chcę"', description: 'Przekieruj analizowanie cudzych zachowań na własne pragnienia. Jedno zdanie: czego chcę w tej sytuacji.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_10_2', date: '2026-07-10', title: 'Biznes — twarda smycz, 30 min', description: 'Zapisz "czego NIE robię z tym pomysłem w te wakacje". Granica chroni urlop i nową pracę przed wypaleniem.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jul_10_3', date: '2026-07-10', title: 'Wieczór łagodny', description: 'Telefon poza sypialnią.', pillar: 'cialo', xp: 60 },

  // ── 11 lipca, sobota | folikularna ──
  { id: 'jul_11_1', date: '2026-07-11', title: 'Mini-ekspozycja społeczna', description: '1 kontakt na żywo, w którym mówisz coś szczerze albo o coś prosisz. Wartość nie zależy od tego, czy się spodoba.', pillar: 'kapital', xp: 80 },
  { id: 'jul_11_2', date: '2026-07-11', title: '90 min sam ze sobą bez bodźców', description: 'Bez podcastów, muzyki, scrolla. Spacer / kawa / siedzenie.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_11_3', date: '2026-07-11', title: 'Wieczorny rytuał', description: 'Kąpiel, książka.', pillar: 'cialo', xp: 60 },

  // ── 12 lipca, niedziela | SLOT WNĘTRZA 2 | folikularna ──
  { id: 'jul_12_1', date: '2026-07-12', title: 'Slot Wnętrza 60 min — list dowodów', description: 'Spisz 10 faktów z życia, które są dowodem Twojej wartości NIEZALEŻNIE od cudzych reakcji. Wracaj do tej listy, gdy pióro próbuje przejąć ktoś inny.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_12_2', date: '2026-07-12', title: 'Plan tygodnia 13–19.07', description: '3 priorytety. Tydzień rozbiegu do pracy + owulacja.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_12_3', date: '2026-07-12', title: 'Wieczorny rytuał, sen przed 23', description: 'Domknięcie tygodnia.', pillar: 'cialo', xp: 60 },

  // ── 13 lipca, poniedziałek | folikularna | biznes-research ──
  { id: 'jul_13_1', date: '2026-07-13', title: 'Mój werdykt', description: 'Najpierw własna ocena, potem cudza reakcja (jeśli w ogóle).', pillar: 'pozycja', xp: 80 },
  { id: 'jul_13_2', date: '2026-07-13', title: 'Biznes — domknięcie eksploracji', description: 'Jedno zdanie "czego dowiedziałam się o tym marzeniu" i odłóż do września. Smycz spięta.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_13_3', date: '2026-07-13', title: 'Spacer + światło', description: 'Bez telefonu.', pillar: 'cialo', xp: 60 },

  // ── 14 lipca, wtorek | folikularna ku owulacji | koniec T2 ──
  { id: 'jul_14_1', date: '2026-07-14', title: 'Przegląd dowodów wartości — tydzień 2 + telefon do osoby stałej', description: '3 dowody z tygodnia. Plus świadomy kontakt (babcia / przyjaciółka), nie pasywny scroll w wiadomościach.', pillar: 'kapital', xp: 80 },
  { id: 'jul_14_2', date: '2026-07-14', title: 'Aktywność fizyczna tygodnia (2)', description: 'Energia rośnie ku owulacji, można mocniej.', pillar: 'cialo', xp: 80 },
  { id: 'jul_14_3', date: '2026-07-14', title: 'Wieczór bez scrolla + czytanie', description: 'Telefon poza sypialnią.', pillar: 'tozsamosc', xp: 60 },

  // ── TYDZIEŃ 3 (15–22.07) "Owulacja, widoczność, rozbieg" ───────

  // ── 15 lipca, środa | owulacja blisko | projekt: rozbieg do pracy ──
  { id: 'jul_15_1', date: '2026-07-15', title: 'Mini-ekspozycja odważniejsza', description: 'Coś widocznego, co mówisz/publikujesz BEZ sprawdzania reakcji potem. Trening pod fazę 2 "widoczność".', pillar: 'pozycja', xp: 80 },
  { id: 'jul_15_2', date: '2026-07-15', title: 'Nowa praca — warstwa 1 (kim wchodzę)', description: 'Wypisz, jaką profesjonalistką chcesz tam wejść 1.09. NIE co wkuć. Z pozycji "pasuję", nie "jestem wdzięczna, że mnie wpuścili".', pillar: 'kariera', xp: 80 },
  { id: 'jul_15_3', date: '2026-07-15', title: 'Spacer 30 min', description: 'Korzystaj z energii.', pillar: 'cialo', xp: 60 },

  // ── 16 lipca, czwartek | owulacja | rozbieg do pracy ──
  { id: 'jul_16_1', date: '2026-07-16', title: 'Mój werdykt + dowód dla siebie', description: 'Połączenie: własna ocena przed cudzą, plus jedna dotrzymana obietnica sobie.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_16_2', date: '2026-07-16', title: 'Nowa praca — warstwa 2 (lekko)', description: 'Jeśli jest coś merytorycznego, co Cię uspokoi, max 1h. Nadmierne przygotowanie to lęk, nie gotowość.', pillar: 'kariera', xp: 80 },
  { id: 'jul_16_3', date: '2026-07-16', title: 'Aktywność fizyczna — szczyt energii', description: 'Owulacja, wykorzystaj.', pillar: 'cialo', xp: 80 },

  // ── 17 lipca, piątek | OWULACJA SZCZYT ──
  { id: 'jul_17_1', date: '2026-07-17', title: 'Największa mini-ekspozycja tygodnia', description: 'Rzecz, której najbardziej boisz się pod kątem cudzej opinii, w bezpiecznej skali. Zrób ją w szczycie energii. Zapisz, co się realnie stało.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_17_2', date: '2026-07-17', title: 'Standardy relacyjne — przegląd', description: 'Odśwież 5 standardów i 5 zachowań wyłączonych z 27.06. Sprawdź, czy żyjesz zgodnie z nimi. "Nie negocjuję."', pillar: 'milosc', xp: 100 },
  { id: 'jul_17_3', date: '2026-07-17', title: 'NSDR 10 min / box breathing', description: 'Regulacja po dniu pełnym ekspozycji.', pillar: 'cialo', xp: 60 },

  // ── 18 lipca, sobota | owulacja ──
  { id: 'jul_18_1', date: '2026-07-18', title: '1 kontakt społeczny na żywo', description: 'Widoczna i swobodna, bez monitorowania, jak wypadasz. Kolacja, spotkanie, długa rozmowa.', pillar: 'kapital', xp: 80 },
  { id: 'jul_18_2', date: '2026-07-18', title: '90 min czegoś przyjemnego dla ciała', description: 'Coś, co robisz dla siebie, nie dla efektu na zewnątrz.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_18_3', date: '2026-07-18', title: 'Wieczorny rytuał', description: 'Kąpiel, książka.', pillar: 'cialo', xp: 60 },

  // ── 19 lipca, niedziela | SLOT WNĘTRZA 3 | owulacja → lutealna ──
  { id: 'jul_19_1', date: '2026-07-19', title: 'Slot Wnętrza 60 min — czyim piórem piszę', description: 'Porównaj, jak czułaś się na początku urlopu vs teraz. Czyim piórem piszesz dziś swoją wartość. Spisz 3 zmiany.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_19_2', date: '2026-07-19', title: 'Plan ostatnich dni urlopu 20–22.07', description: 'Plus jak wejść w resztę lipca (23–31) i utrzymać nawyki.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_19_3', date: '2026-07-19', title: 'Wieczorny rytuał, sen przed 23', description: 'Domknięcie tygodnia.', pillar: 'cialo', xp: 60 },

  // ── 20 lipca, poniedziałek | wczesna lutealna ──
  { id: 'jul_20_1', date: '2026-07-20', title: 'Przegląd dowodów wartości — tydzień 3', description: '3 dowody, że można na sobie polegać.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_20_2', date: '2026-07-20', title: 'Nowa praca — domknięcie przygotowań', description: 'Jedno zdanie "wchodzę 1.09 jako...". Zamknij temat, nie rozgrzebuj do września.', pillar: 'kariera', xp: 80 },
  { id: 'jul_20_3', date: '2026-07-20', title: 'Spacer łagodny', description: 'Energia schodzi, łagodnie.', pillar: 'cialo', xp: 60 },

  // ── 21 lipca, wtorek | lutealna ──
  { id: 'jul_21_1', date: '2026-07-21', title: 'Mój werdykt — utrwalenie', description: 'Zapisz, jak przez te 3 tygodnie zmienił się Twój odruch sprawdzania cudzych reakcji.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_21_2', date: '2026-07-21', title: 'Mieszkanie — ostatni rzut oka', description: 'Domknij, co wisi. Przestrzeń jako lustro tego, jak się traktujesz.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jul_21_3', date: '2026-07-21', title: 'Wieczór łagodny + czytanie', description: 'Telefon poza sypialnią.', pillar: 'tozsamosc', xp: 60 },

  // ── 22 lipca, środa | KONIEC URLOPU | lutealna ──
  { id: 'jul_22_1', date: '2026-07-22', title: 'Domknięcie urlopu — wielkie podsumowanie', description: 'Spisz: lekcje 3 tygodni o własnej wartości, 3 dowody, że odzyskałaś pióro, oraz 1 zdanie "co teraz wiem o sobie, czego nie wiedziałam 1.07".', pillar: 'pozycja', xp: 200 },
  { id: 'jul_22_2', date: '2026-07-22', title: 'Jak utrzymać to po urlopie', description: 'Wybierz, które 2 nawyki wartości zabierasz w resztę lipca i od września. Konkretnie, kiedy i jak.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_22_3', date: '2026-07-22', title: 'Rytuał zakończenia urlopu', description: 'Świeca, coś dobrego, wdzięczność za miesiąc dany sobie. Zapis 3 zdań.', pillar: 'pozycja', xp: 60 },
]
