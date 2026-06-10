import type { AprilQuest } from './aprilData'

// CZERWIEC 2026 — ZAKORZENIENIE
// Hasło: "Ufam sobie. Najpierw odzyskuję siebie, potem zwiększam zasięg."
// Intencja: "Ufaj sobie" (też intencja roku). Anty-słowo: ucieczka.
// Pytanie miesiąca: "Co dziś dało mi grunt pod nogami?"
// Marzenie miesiąca: występ na szarfach 20.06. Ostatni miesiąc fazy 1.
//
// Quest typu AprilQuest reużywany — refaktor na MonthlyQuest planowany
// w późniejszej iteracji (razem z hookiem useAprilQuests → useMonthlyQuests).

export const JUNE_MOTTO = 'Ufam sobie. Najpierw odzyskuję siebie, potem zwiększam zasięg.'
export const JUNE_NAME = 'Zakorzenienie'

export const JUNE_QUESTS: AprilQuest[] = [
  // ── TYDZIEŃ 1 (1–7.06) "Otwarcie" ─────────────────────────────

  // ── 1 czerwca, poniedziałek | K, W | lutealna późna ──
  { id: 'jun_01_1', date: '2026-06-01', title: 'Twarde punkty czerwca do kalendarza', description: 'Wpisz: Dzień Zakorzenienia 4.06, 4 sloty Wnętrza (niedz 19–20), 12 aktywności fizycznych, wesele 13.06, występ 20.06, mid-month review 22.06, przegląd Q2 29–30.06. Infrastruktura zanim przyjdzie ochota na improwizację.', pillar: 'pozycja', xp: 100 },
  { id: 'jun_01_2', date: '2026-06-01', title: '10 min porannego światła', description: 'Zaraz po wstaniu, bez telefonu w ręku. Balkon albo spacer dookoła bloku. Światło konfiguruje cykl dobowy i nastrój.', pillar: 'cialo', xp: 60 },
  { id: 'jun_01_3', date: '2026-06-01', title: '3 dowody zakorzenienia na 30.06', description: 'Spisz krótko, po jednym zdaniu, jakie 3 dowody zakorzenienia chcesz mieć na koniec miesiąca.', pillar: 'pozycja', xp: 80 },

  // ── 2 czerwca, wtorek | K, W | lutealna, PMS w drodze ──
  { id: 'jun_02_1', date: '2026-06-02', title: 'Dokumentacja menedżera EY — warstwa 1', description: 'Kartka A4: daty + 3 najcięższe sytuacje, surowo, bez emocji. Domknij fakty zanim zacznie pracować HR.', pillar: 'kariera', xp: 100 },
  { id: 'jun_02_2', date: '2026-06-02', title: 'Wieczorny brain dump 10 min', description: 'Kartka A4: wszystko, co krąży w głowie, bez sortowania. Niedomknięte zakładki drenują.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_02_3', date: '2026-06-02', title: 'Wieczór bez scrolla od 21:30', description: 'Telefon do innego pokoju. Telefon w sypialni pogarsza sen mierzalnie.', pillar: 'cialo', xp: 60 },

  // ── 3 czerwca, środa | C, T | hiszpański + szarfy ──
  { id: 'jun_03_1', date: '2026-06-03', title: 'Hiszpański w sztywnym slocie', description: 'Zaplanowany, bez przedłużania. Powtarzalność > zrywy.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jun_03_2', date: '2026-06-03', title: 'Szarfy — pierwszy trening pod występ', description: 'Uważność na ciało, nie na perfekcję. Nie porównuj się z innymi w sali.', pillar: 'cialo', xp: 80 },
  { id: 'jun_03_3', date: '2026-06-03', title: 'Telefon z mamą 10 min', description: 'Sprawdź, co wie o McKinseyu i o wypowiedzeniu. Bez tego niedziela 14.06 w domu rodzinnym wejdzie w chaos.', pillar: 'kariera', xp: 60 },

  // ── 4 czerwca, czwartek (Boże Ciało) | DZIEŃ ZAKORZENIENIA | W, T ──
  { id: 'jun_04_1', date: '2026-06-04', title: '4–6h offline w naturze', description: 'Las, woda, duży park poza centrum. Telefon w tryb lotu. Spokój przychodzi po działaniu, nie przed.', pillar: 'pozycja', xp: 120 },
  { id: 'jun_04_2', date: '2026-06-04', title: 'Wieczorny journaling 30 min', description: '"Co dziś dało mi grunt pod nogami?" + 3 rzeczy, które dziś zauważyłaś jednym z 5 zmysłów.', pillar: 'pozycja', xp: 80 },
  { id: 'jun_04_3', date: '2026-06-04', title: 'Cały dzień bez sprawdzania reakcji', description: 'Nie sprawdzasz reakcji na to, co opublikowałaś w ostatnich 7 dniach. Wewnętrzny barometr odłączony od zewnętrznego zasilania.', pillar: 'pozycja', xp: 80 },

  // ── 5 czerwca, piątek | W, C | PMS na progu ──
  { id: 'jun_05_1', date: '2026-06-05', title: 'Spacer 30 min bez telefonu', description: 'Świadomie zauważ 5 rzeczy w naturze: drzewo, ptak, zapach, dźwięk, faktura.', pillar: 'cialo', xp: 80 },
  { id: 'jun_05_2', date: '2026-06-05', title: 'Wieczór bez scrolla od 21:30 + książka 20 min', description: 'Telefon poza zasięgiem, książka zamiast ekranu.', pillar: 'cialo', xp: 60 },
  { id: 'jun_05_3', date: '2026-06-05', title: 'Plan weselnego weekendu na kartce', description: 'Do kieszeni: godziny wyjścia, limit alkoholu (max 3 drinki), 1 osoba do telefonu w razie GP, gotowa odpowiedź na "co z Jankiem" (1 zdanie ćwiczone na zimno). Nie improwizuj pod presją.', pillar: 'milosc', xp: 80 },

  // ── 6 czerwca, sobota | W, R | PMS ──
  { id: 'jun_06_1', date: '2026-06-06', title: '90 min sam ze sobą bez bodźców', description: 'Bez podcastów, muzyki, scrolla. Spacer / kawa / siedzenie. Weekend bez choreografii = ryzyko Ghost Protocol.', pillar: 'pozycja', xp: 80 },
  { id: 'jun_06_2', date: '2026-06-06', title: 'Druga aktywność fizyczna tygodnia', description: 'Jazda konna, dłuższy spacer, joga — do wyboru. Ciało wpisane jako wydarzenie.', pillar: 'cialo', xp: 80 },
  { id: 'jun_06_3', date: '2026-06-06', title: '1 kontakt społeczny', description: 'Telefon do osoby stałej albo kawa. Samotny weekend = ryzyko GP.', pillar: 'kapital', xp: 60 },

  // ── 7 czerwca, niedziela | SLOT WNĘTRZA 1 | W, T | PMS ──
  { id: 'jun_07_1', date: '2026-06-07', title: 'Slot Wnętrza 60 min', description: 'Do wyboru: sound healing, strukturalny journaling z RAIN (Recognize, Allow, Investigate, Nurture), terapia jeśli umówiona, spacer w ciszy. Filar bez slotu się nie dzieje.', pillar: 'pozycja', xp: 100 },
  { id: 'jun_07_2', date: '2026-06-07', title: 'Plan tygodnia 8–14.06', description: '3 priorytety, ruch wpisany, plan na wesele 13.06.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_07_3', date: '2026-06-07', title: 'Wieczorny rytuał weekendowy', description: 'Kąpiel, książka, sen przed 23:00.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 2 (8–14.06) "Rytm i wesele" ───────────────────────

  // ── 8 czerwca, poniedziałek | K, W | PMS ──
  { id: 'jun_08_1', date: '2026-06-08', title: 'Dokumentacja menedżera EY — warstwa 2', description: 'Dorzuć kontekst i konkretne cytaty / maile, jeśli są.', pillar: 'kariera', xp: 100 },
  { id: 'jun_08_2', date: '2026-06-08', title: '"Name it to tame it" 5 min', description: '3 emocje z dnia, każda nazwana jednym zdaniem. Nazwanie emocji obniża aktywność ciała migdałowatego.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_08_3', date: '2026-06-08', title: 'Box breathing 4 min przed snem', description: 'Wdech 4, zatrzymanie 4, wydech 4, zatrzymanie 4. Lutealna i PMS wymagają regulacji.', pillar: 'cialo', xp: 60 },

  // ── 9 czerwca, wtorek | W, R | okres tuż przed ──
  { id: 'jun_09_1', date: '2026-06-09', title: 'Telefon do babci', description: 'Stały slot rodzinny. Buduj weekend społecznie.', pillar: 'kapital', xp: 60 },
  { id: 'jun_09_2', date: '2026-06-09', title: '20 min ekspresywnego pisania o ciele', description: 'Co mu obiecujesz w czerwcu, czego potrzebuje pod okresem i występem.', pillar: 'cialo', xp: 80 },
  { id: 'jun_09_3', date: '2026-06-09', title: 'Wieczór bez scrolla od 21:30', description: 'Telefon poza sypialnią.', pillar: 'cialo', xp: 60 },

  // ── 10 czerwca, środa | OKRES START | C (modyfikowany), T ──
  { id: 'jun_10_1', date: '2026-06-10', title: 'Hiszpański — tylko Duolingo 15 min', description: 'Zasada z maja: środa przy okresie się skraca, nie znika. Powtarzalność > perfekcjonizm.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jun_10_2', date: '2026-06-10', title: 'Szarfy w wersji łagodnej', description: 'Rozciąganie, bez nowych elementów. Troska o ciało pod okresem.', pillar: 'cialo', xp: 60 },
  { id: 'jun_10_3', date: '2026-06-10', title: 'Magnez (glycinate) + ciepły prysznic', description: 'Przed snem. Troska o ciało w okresie.', pillar: 'cialo', xp: 60 },

  // ── 11 czerwca, czwartek | W, K | okres dzień 2 ──
  { id: 'jun_11_1', date: '2026-06-11', title: 'Tryb minimum dnia (obowiązkowy)', description: 'Twarz, zęby, 10 min na powietrzu, normalnie zjeść, jedno zdanie: "dziś było trudno, ale nie zostawiłam siebie". Nie wymuszaj więcej.', pillar: 'pozycja', xp: 80 },
  { id: 'jun_11_2', date: '2026-06-11', title: '30 min lekkiego spaceru po pracy', description: 'Bez telefonu. Ruch i światło.', pillar: 'cialo', xp: 60 },
  { id: 'jun_11_3', date: '2026-06-11', title: 'Wieczór 30 min czytania', description: 'Telefon w drugim pokoju.', pillar: 'tozsamosc', xp: 60 },

  // ── 12 czerwca, piątek | R, W | okres dzień 3, wyjazd do domu rodzinnego ──
  { id: 'jun_12_1', date: '2026-06-12', title: 'Spakuj się rano, nie wieczorem', description: 'Organizacja > improwizacja.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_12_2', date: '2026-06-12', title: 'Plan weselny w kieszeni — przejrzany', description: 'Ponownie: limit alkoholu, godzina wyjścia, telefon w razie pytań, godzina spania.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_12_3', date: '2026-06-12', title: '5 min self-compassion przed wyjazdem', description: '"To będzie trudne, idę z miłością do siebie, nie z lękiem. Mam prawo poczuć ból i mam prawo wyjść z imprezy, kiedy chcę."', pillar: 'pozycja', xp: 80 },

  // ── 13 czerwca, sobota (WESELE) | R, K | OKRES, dzień podwyższonego ryzyka GP ──
  { id: 'jun_13_1', date: '2026-06-13', title: 'Trzymaj plan weselny', description: 'Limit alkoholu max 3, godzina wyjścia ustalona, telefon do bezpiecznej osoby przy pytaniach o Janka. Zewnętrzne pytania nie zmieniają wewnętrznego stanu.', pillar: 'milosc', xp: 120 },
  { id: 'jun_13_2', date: '2026-06-13', title: '5-4-3-2-1 grounding co 2h', description: 'Lub kiedy poczujesz, że płynie: 5 widzę, 4 słyszę, 3 czuję, 2 wącham, 1 smakuję.', pillar: 'cialo', xp: 80 },
  { id: 'jun_13_3', date: '2026-06-13', title: '3 zdania po powrocie do pokoju', description: '1 co dało dziś siłę, 1 co było trudne, 1 czego dowiedziałaś się o sobie.', pillar: 'pozycja', xp: 60 },

  // ── 14 czerwca, niedziela (dom rodzinny) | SLOT WNĘTRZA 2 | W, R | okres dzień 4 ──
  { id: 'jun_14_1', date: '2026-06-14', title: 'Slot Wnętrza 60 min w domu rodzinnym', description: 'Długi spacer w ciszy, długi prysznic, strukturalny journaling. Slot nie spada nawet w gościach.', pillar: 'pozycja', xp: 100 },
  { id: 'jun_14_2', date: '2026-06-14', title: 'Rozmowa z mamą o McKinseyu i EY', description: 'Tonem informującym, nie pytającym o jej zgodę. Odzyskanie steru.', pillar: 'kariera', xp: 80 },
  { id: 'jun_14_3', date: '2026-06-14', title: 'Wieczorny rytuał — sen przed 23:00', description: 'Telefon poza sypialnią.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 3 (15–21.06) "Mobilizacja i występ" ────────────────

  // ── 15 czerwca, poniedziałek | C, K | folikularna start ──
  { id: 'jun_15_1', date: '2026-06-15', title: 'Zimna woda na twarz 30 sek rano', description: 'Miska + lód lub kran. Stymulacja nerwu błędnego, dopaminowy reset po okresie.', pillar: 'cialo', xp: 60 },
  { id: 'jun_15_2', date: '2026-06-15', title: '30 min spaceru po pracy', description: 'Bez telefonu.', pillar: 'cialo', xp: 60 },
  { id: 'jun_15_3', date: '2026-06-15', title: 'Dokumentacja HR — przegląd i decyzja', description: 'Przejrzyj i potnij warstwy. Decyzja: rozmowa z HR w lipcu czy później. Zapisz decyzję + termin.', pillar: 'kariera', xp: 100 },

  // ── 16 czerwca, wtorek | T, W | folikularna ──
  { id: 'jun_16_1', date: '2026-06-16', title: '"Future self" letter 20 min', description: 'List od siebie z 30. urodzin (kwiecień 2027): co dziś zrobiłaś, że dotarłaś tam jako kobieta z pozycją. Wpisz w /vault jako typ "future" — wróci do Ciebie falą kwartalną (5.07 / 5.10 / 5.01 / 5.04, zależnie od kolejności listów).', pillar: 'tozsamosc', xp: 100 },
  { id: 'jun_16_2', date: '2026-06-16', title: 'Mikro-krok finansowy', description: 'Sprawdź saldo karty 12k, wypisz konkretny plan spłaty z perspektywą McKinseya od września: kwoty miesięczne, termin spłaty.', pillar: 'kariera', xp: 80 },
  { id: 'jun_16_3', date: '2026-06-16', title: 'Wieczór bez scrolla od 21:30', description: 'Telefon poza sypialnią.', pillar: 'cialo', xp: 60 },

  // ── 17 czerwca, środa | C, T | próby do występu ──
  { id: 'jun_17_1', date: '2026-06-17', title: 'Hiszpański w slocie', description: 'Zaplanowany.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jun_17_2', date: '2026-06-17', title: 'Szarfy — drugi trening pod występ', description: 'Uważność na ciało.', pillar: 'cialo', xp: 80 },
  { id: 'jun_17_3', date: '2026-06-17', title: 'NSDR 10 min wieczorem', description: 'Yoga nidra (do znalezienia na YT). Regulacja przed tygodniem szczytu.', pillar: 'cialo', xp: 60 },

  // ── 18 czerwca, czwartek | C, W | folikularna ──
  { id: 'jun_18_1', date: '2026-06-18', title: 'Trzecia aktywność fizyczna tygodnia', description: 'Regenerująca, nie szarpana: joga, dłuższy spacer, pływanie.', pillar: 'cialo', xp: 80 },
  { id: 'jun_18_2', date: '2026-06-18', title: 'Journaling 10 min', description: 'Co dziś dało mi grunt, co mnie trzymało.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_18_3', date: '2026-06-18', title: 'Sen przed 23:00 + magnez', description: 'Pod występem sen krytyczny.', pillar: 'cialo', xp: 60 },

  // ── 19 czerwca, piątek | W, T | dzień przed występem ──
  { id: 'jun_19_1', date: '2026-06-19', title: 'Box breathing 10 min wieczorem', description: 'Cisza, świece, bez telefonu. Regulacja kortyzolu przed występem.', pillar: 'cialo', xp: 80 },
  { id: 'jun_19_2', date: '2026-06-19', title: 'Plan występu na kartce', description: 'Czego potrzebujesz rano, godzina wyjścia, co bierzesz, co po występie (z kim, co jesz, kiedy spanie).', pillar: 'pozycja', xp: 80 },
  { id: 'jun_19_3', date: '2026-06-19', title: 'Sen przed 22:30', description: 'Krytyczne pod występem — niedobór snu pogarsza wydolność i nastrój.', pillar: 'cialo', xp: 60 },

  // ── 20 czerwca, sobota | WYSTĘP | T, C | folikularna szczyt ──
  { id: 'jun_20_1', date: '2026-06-20', title: 'Poranek z protokołem', description: '10 min światła słonecznego + ciepły prysznic + 5 min self-compassion: "występuję dla siebie, nie dla oceny. Wartość mojej obecności nie zależy od reakcji widowni."', pillar: 'pozycja', xp: 100 },
  { id: 'jun_20_2', date: '2026-06-20', title: 'Twoja scena, Twoja godzina', description: 'Wejdź jako kobieta, która już wie, że nie potrzebuje aprobaty, żeby błyszczeć. Świadomość ciała od pierwszej do ostatniej sekundy. Wartość Twojej obecności nie zależy od reakcji widowni.', pillar: 'tozsamosc', xp: 200 },
  { id: 'jun_20_3', date: '2026-06-20', title: 'Po występie — 1 zdanie', description: '"Co mi się dzisiaj udało, niezależnie od oceny innych?"', pillar: 'pozycja', xp: 60 },

  // ── 21 czerwca, niedziela (dzień po występie) | SLOT WNĘTRZA 3 | W, C ──
  { id: 'jun_21_1', date: '2026-06-21', title: 'Slot Wnętrza 60 min — dekompresja', description: 'Obowiązkowo: sound healing, kąpiel, spacer w naturze. Spokój przychodzi po działaniu.', pillar: 'pozycja', xp: 100 },
  { id: 'jun_21_2', date: '2026-06-21', title: 'Świadomy spokój dnia', description: 'Zero zobowiązań społecznych, minimum aktywności, ruch tylko jeśli ciało prosi. Weekend post-event = ryzyko GP.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_21_3', date: '2026-06-21', title: '"Name it to tame it" 5 min', description: 'Jak czuję się dzień po występie, bez oceny czy "powinnam czuć inaczej".', pillar: 'pozycja', xp: 60 },

  // ── TYDZIEŃ 4 (22–28.06) "Regeneracja i lekcja" ────────────────

  // ── 22 czerwca, poniedziałek | W, T | post-event prevention ──
  { id: 'jun_22_1', date: '2026-06-22', title: 'Mid-month review tygodniowy', description: 'Co działa, co spada, korekta na T4–T5. 15 min, kartka.', pillar: 'pozycja', xp: 100 },
  { id: 'jun_22_2', date: '2026-06-22', title: 'Telefon do osoby stałej', description: 'Kontakt świadomy, nie pasywny scroll w wiadomościach.', pillar: 'kapital', xp: 60 },
  { id: 'jun_22_3', date: '2026-06-22', title: 'NSDR 10 min wieczorem', description: 'Yoga nidra, regulacja.', pillar: 'cialo', xp: 60 },

  // ── 23 czerwca, wtorek | C, K | folikularna ku owulacji ──
  { id: 'jun_23_1', date: '2026-06-23', title: 'Spacer 30 min bez telefonu', description: 'Ruch, oddech, krok.', pillar: 'cialo', xp: 60 },
  { id: 'jun_23_2', date: '2026-06-23', title: '30 min czytania', description: 'Książka, nie scroll. Z półki, nie nowy zakup — zero emocjonalnych zakupów.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jun_23_3', date: '2026-06-23', title: 'Box breathing 5 min przed snem', description: 'Regulacja przed snem.', pillar: 'cialo', xp: 60 },

  // ── 24 czerwca, środa (owulacja) | C, T | energia szczyt ──
  { id: 'jun_24_1', date: '2026-06-24', title: 'Hiszpański — pełny slot', description: 'Jeśli energia jest dobra, można rozszerzyć.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jun_24_2', date: '2026-06-24', title: 'Szarfy w trybie "po występie"', description: 'Lekka eksploracja, bez presji wynikowej. Regeneracja czynna.', pillar: 'cialo', xp: 60 },
  { id: 'jun_24_3', date: '2026-06-24', title: 'Drugi telefon do babci w miesiącu', description: 'Jeśli nie był wcześniej.', pillar: 'kapital', xp: 60 },

  // ── 25 czerwca, czwartek | W, K | wczesna lutealna ──
  { id: 'jun_25_1', date: '2026-06-25', title: 'Dokumentacja HR — warstwa 3', description: 'Wypisz konkretny ask, plan timing. Decyzja: rozmowa z HR w lipcu (tydzień, dzień).', pillar: 'kariera', xp: 100 },
  { id: 'jun_25_2', date: '2026-06-25', title: '20 min ekspresywnego pisania — retro do maja', description: 'Jak się czuję po McKinseyu, po występie i po decyzji.', pillar: 'pozycja', xp: 80 },
  { id: 'jun_25_3', date: '2026-06-25', title: 'Wieczór bez scrolla', description: 'Telefon poza sypialnią.', pillar: 'cialo', xp: 60 },

  // ── 26 czerwca, piątek | W, R | lutealna ──
  { id: 'jun_26_1', date: '2026-06-26', title: 'Spacer 30 min w naturze', description: 'Świadome zmysły — 5 rzeczy zauważonych.', pillar: 'cialo', xp: 60 },
  { id: 'jun_26_2', date: '2026-06-26', title: '1 kontakt społeczny — nie online', description: 'Kolacja, spotkanie, długa rozmowa.', pillar: 'kapital', xp: 80 },
  { id: 'jun_26_3', date: '2026-06-26', title: 'Wieczór łagodny', description: 'Telefon poza sypialnią.', pillar: 'cialo', xp: 60 },

  // ── 27 czerwca, sobota | W, T | lutealna ──
  { id: 'jun_27_1', date: '2026-06-27', title: 'Standardy relacyjne', description: 'Wypisz 5 standardów, jak ma cię traktować mężczyzna, oraz 5 zachowań wyłączonych, których już nie akceptujesz. "Nie negocjuję miłości."', pillar: 'milosc', xp: 100 },
  { id: 'jun_27_2', date: '2026-06-27', title: '90 min sam ze sobą bez podcastów', description: 'Spacer / kawa / siedzenie.', pillar: 'pozycja', xp: 80 },
  { id: 'jun_27_3', date: '2026-06-27', title: 'Wieczorny rytuał', description: 'Kąpiel, książka.', pillar: 'cialo', xp: 60 },

  // ── 28 czerwca, niedziela | SLOT WNĘTRZA 4 | W, T | lutealna ──
  { id: 'jun_28_1', date: '2026-06-28', title: 'Slot Wnętrza 60 min — refleksyjny', description: 'Co czerwiec mi pokazał, czego nauczyły mnie 4 tygodnie. Spisz 3 lekcje.', pillar: 'pozycja', xp: 100 },
  { id: 'jun_28_2', date: '2026-06-28', title: 'Plan tygodnia 29.06–5.07', description: 'Plus termin przeglądu Q2 — kiedy go robimy w pełnej wersji.', pillar: 'pozycja', xp: 60 },
  { id: 'jun_28_3', date: '2026-06-28', title: 'Wieczorny rytuał, sen przed 23:00', description: 'Domknięcie tygodnia.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 5 (29–30.06) "Próg fazy 2" ─────────────────────────

  // ── 29 czerwca, poniedziałek | W, K | lutealna ──
  { id: 'jun_29_1', date: '2026-06-29', title: 'Przegląd Q2 — część 1: dane', description: 'Otwórz Przegląd → Kwartalny: XP kwartału, streak, oceny 7 filarów, Ghost Protocol, papierosy — wszystko policzone, z porównaniem do poprzedniego kwartału.', pillar: 'pozycja', xp: 120 },
  { id: 'jun_29_2', date: '2026-06-29', title: '3 dowody zakorzenienia — czy dowiezione', description: 'Z 1.06: 4 sloty Wnętrza, 3 aktywności tygodniowo, Miłość drgnęła z 1 (średnia tygodniowa ≥2).', pillar: 'pozycja', xp: 80 },
  { id: 'jun_29_3', date: '2026-06-29', title: 'Wizualizacja lipca 10 min', description: 'Jak ma wyglądać start fazy 2 "Widoczność i wejście do obiegu".', pillar: 'tozsamosc', xp: 60 },

  // ── 30 czerwca, wtorek | KONIEC FAZY 1 | W, T | lutealna ──
  { id: 'jun_30_1', date: '2026-06-30', title: 'Przegląd Q2 — część 2: lekcje i most do fazy 2', description: 'W Przegląd → Kwartalny domknij kwartał: lekcje fazy 1, otwarte fronty, most do fazy 2 i 1 zdanie „Co zmieniło się we mnie". Zapis przyzna XP i wyląduje w Archiwum.', pillar: 'pozycja', xp: 200 },
  { id: 'jun_30_2', date: '2026-06-30', title: 'Decyzja hasłowa o lipcu', description: 'Słowo miesiąca, intencja, jedno marzenie. Faza 2: "Nie proszę o miejsce, zaczynam naturalnie do niego pasować".', pillar: 'tozsamosc', xp: 80 },
  { id: 'jun_30_3', date: '2026-06-30', title: 'Rytuał zakończenia czerwca', description: 'Świeca, lampka wina (jeśli chcesz), zapis 3 zdań: co teraz wiem o sobie, czego nie wiedziałam 1.06.', pillar: 'pozycja', xp: 60 },
]
