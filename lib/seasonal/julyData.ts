import type { AprilQuest } from './aprilData'

// LIPIEC 2026 — ODDECH (pierwszy miesiąc fazy 2: „Widoczność z pełni, nie z głodu. Najpierw fundament.")
// Hasło: ODDECH. Intencja: „To moje życie. Ja zostaję." (z 27.06). Anty-słowo: pośpiech.
// Pytanie miesiąca: „Co dziś dało mi oddech, którego nikt mi nie dał?"
// Kotwica na trudne: „Jestem w dobrych rękach."
// Marzenie miesiąca: pierwsza sesja terapii umówiona i odbyta (~14.07).
// Zasada ODDECHU: maksymalnie JEDEN „projekt" dziennie, pozostałe dwa questy to
// regeneracja, ciało albo przyjemność. Jeśli dzień rośnie — tnij. Wolne to nie lista zadań.
// Zakres: 1–31.07. Cykl: okres 4–8.07, folikularna 9–17, owulacja 18–20, lutealna 21–31.

export const JULY_MOTTO = 'To moje życie. Ja zostaję.'
export const JULY_NAME = 'ODDECH'

export const JULY_QUESTS: AprilQuest[] = [
  // ── TYDZIEŃ 1 (1–5.07) „Otwieram oddech, okres wchodzi" ─────────

  // ── 1 lipca, środa | późna lutealna, przed okresem ──
  { id: 'jul_01_1', date: '2026-07-01', title: 'List do Natalii z 1 lipca', description: 'Otwórz zapieczętowany w czerwcu list do siebie, przeczytaj i dopisz jedno zdanie odpowiedzi. Tak otwierasz ODDECH.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_01_2', date: '2026-07-01', title: 'Terapia — lista terapeutów', description: 'Wypisz 3 terapeutów: nurt, cena, dostępność. Tylko lista, bez umawiania dziś. Marzenie miesiąca ruszasz miękko.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_01_3', date: '2026-07-01', title: 'Powolna kawa w oknie', description: 'Poranna kawa w oknie, bez telefonu — rytuał startu ODDECHU. Pierwszy łyk należy do Ciebie, nie do świata.', pillar: 'pozycja', xp: 60 },

  // ── 2 lipca, czwartek | PMS narastający ──
  { id: 'jul_02_1', date: '2026-07-02', title: '10 min porannego światła', description: 'Zaraz po wstaniu 10 minut światła, telefon poza ręką. Ustawia rytm dobowy i nastrój.', pillar: 'cialo', xp: 60 },
  { id: 'jul_02_2', date: '2026-07-02', title: 'Wieczorny brain dump', description: '10 minut na kartce: wypisz wszystko, co krąży w głowie po czerwcu i Q2. Opróżnij zakładki, które drenują energię.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_02_3', date: '2026-07-02', title: 'Mikro-krok finansowy', description: 'Spójrz, na czym stoisz na lato: pensja EY do końca sierpnia, koszt terapii. Bez paniki — sama świadomość.', pillar: 'kariera', xp: 60 },

  // ── 3 lipca, piątek | PMS, okres jutro ──
  { id: 'jul_03_1', date: '2026-07-03', title: 'Terapia — umów sesję', description: 'Napisz do wybranego terapeuty i umów pierwszą sesję (cel: folikularna, ~14.07). To marzenie miesiąca — nie odkładaj.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_03_2', date: '2026-07-03', title: 'Szarfy albo pole w trybie radości', description: 'Pierwsza aktywność tygodnia, póki energia jeszcze jest. Ciało jako radość, nie wyczyn.', pillar: 'cialo', xp: 80 },
  { id: 'jul_03_3', date: '2026-07-03', title: 'Wieczór bez scrolla od 21:30', description: 'Telefon w drugim pokoju, stała godzina snu. Regeneracja po EY.', pillar: 'cialo', xp: 60 },

  // ── 4 lipca, sobota | OKRES START | dzień 1 ──
  { id: 'jul_04_1', date: '2026-07-04', title: 'Okres start — dzień miękki', description: 'Magnez, ciepło, łagodny ruch albo świadomy odpoczynek. Ciało prosi, słuchasz. Okres = łagodnie.', pillar: 'cialo', xp: 60 },
  { id: 'jul_04_2', date: '2026-07-04', title: 'Miękki życioumilacz', description: 'Jedno: lniana pościel, masaż albo kąpiel. Pozwolenie, nie zadanie.', pillar: 'cialo', xp: 60 },
  { id: 'jul_04_3', date: '2026-07-04', title: 'Wieczór łagodny', description: 'Sen o stałej godzinie, telefon poza sypialnią.', pillar: 'cialo', xp: 60 },

  // ── 5 lipca, niedziela | SLOT WNĘTRZA 1 | okres dzień 2 ──
  { id: 'jul_05_1', date: '2026-07-05', title: 'Slot Wnętrza 60 min (1/4)', description: 'Godzina na stałej porze (np. 19–20): sound healing, journaling RAIN albo kąpiel. Wpisz tę godzinę na stałe na wszystkie 4 niedziele lipca. Filar bez slotu się nie dzieje.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_05_2', date: '2026-07-05', title: 'Plan tygodnia 6–12.07', description: 'Na kartce: okres do ~8, folikularna od 9, weekend Ani 10–12, 3 priorytety.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_05_3', date: '2026-07-05', title: 'Wieczorny rytuał weekendowy', description: 'Kąpiel, sen przed 23:00, magnez. Niedziela bywa polem ryzyka — łagodnie.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 2 (6–12.07) „Z okresu w folikularną" ───────────────

  // ── 6 lipca, poniedziałek | okres dzień 3 ──
  { id: 'jul_06_1', date: '2026-07-06', title: 'NSDR albo box breathing', description: 'NSDR 10 min albo box breathing 4 min — regulacja w okresie.', pillar: 'cialo', xp: 60 },
  { id: 'jul_06_2', date: '2026-07-06', title: 'Spacer 30 min bez telefonu', description: 'Łagodnie, bez telefonu. Światło i ruch.', pillar: 'cialo', xp: 60 },
  { id: 'jul_06_3', date: '2026-07-06', title: 'Sen o stałej godzinie', description: 'Telefon poza sypialnią. Ochrona energii — to wąskie gardło, nie dyscyplina.', pillar: 'cialo', xp: 60 },

  // ── 7 lipca, wtorek | okres dzień 4 ──
  { id: 'jul_07_1', date: '2026-07-07', title: 'Telefon do babci albo mamy', description: 'Kontakt jako uziemienie, nie pasywny scroll. Obecność.', pillar: 'kapital', xp: 60 },
  { id: 'jul_07_2', date: '2026-07-07', title: 'Name it to tame it', description: 'Wieczorem 5 min: 3 emocje z dnia, każda nazwana jednym zdaniem.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_07_3', date: '2026-07-07', title: 'Mostek na cichy ciężar', description: 'Jeśli wraca ucisk w klatce, wejdź w /mostek — wydłużony wydech, nie analiza. To fala, nie instrukcja.', pillar: 'pozycja', xp: 60 },

  // ── 8 lipca, środa | okres dzień 5, koniec ──
  { id: 'jul_08_1', date: '2026-07-08', title: 'Hiszpański 15 min (Duolingo)', description: 'W okresie się skraca, nie znika. Powtarzalność ważniejsza niż perfekcja.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jul_08_2', date: '2026-07-08', title: 'Szarfy łagodne albo rozciąganie', description: 'Lekko, plus magnez i ciepło wieczorem. Troska o ciało w okresie.', pillar: 'cialo', xp: 60 },
  { id: 'jul_08_3', date: '2026-07-08', title: 'Miękki życioumilacz', description: 'Lniana pościel, masaż albo kąpiel. Mniej w okres to mądrość, nie ustępstwo.', pillar: 'cialo', xp: 60 },

  // ── 9 lipca, czwartek | folikularna start ──
  { id: 'jul_09_1', date: '2026-07-09', title: 'Folikularna — lekka aktywność', description: 'Energia wraca: joga, dłuższy spacer albo szarfy. Bez sprintu — wracasz do siebie, nie ścigasz się.', pillar: 'cialo', xp: 80 },
  { id: 'jul_09_2', date: '2026-07-09', title: 'EY na minimum', description: 'Jeśli coś wpadnie — tylko niezbędne.', pillar: 'kariera', xp: 60 },
  { id: 'jul_09_3', date: '2026-07-09', title: 'Wieczór 30 min czytania', description: 'Książka z półki, telefon w drugim pokoju, stała godzina snu.', pillar: 'tozsamosc', xp: 60 },

  // ── 10 lipca, piątek | folikularna, weekend Ani możliwy ──
  { id: 'jul_10_1', date: '2026-07-10', title: 'Plan weekendu z Anią w kieszeni', description: 'Jeśli Ania w Warszawie: godzina wyjścia, jedno zdanie jeśli padnie temat Janka, alkohol z umiarem. Folikularna daje energię, ale to wciąż weekend społeczny.', pillar: 'kapital', xp: 80 },
  { id: 'jul_10_2', date: '2026-07-10', title: '5 min self-compassion przed spotkaniem', description: '„Idę, bo chcę być, nie żeby udowodnić."', pillar: 'pozycja', xp: 60 },
  { id: 'jul_10_3', date: '2026-07-10', title: 'Druga aktywność tygodnia', description: 'Folikularna niesie — wykorzystaj łagodnie.', pillar: 'cialo', xp: 60 },

  // ── 11 lipca, sobota | folikularna, weekend ──
  { id: 'jul_11_1', date: '2026-07-11', title: 'Czas z Anią albo jeden kontakt', description: 'Czas z Anią; jeśli nie wyjdzie — jeden świadomy kontakt społeczny. Obecność, nie analiza.', pillar: 'kapital', xp: 80 },
  { id: 'jul_11_2', date: '2026-07-11', title: 'Życioumilacz miejski', description: 'Śniadanie w pięknej kawiarni z książką albo targ śniadaniowy. Stolik tylko Twój.', pillar: 'styl', xp: 60 },
  { id: 'jul_11_3', date: '2026-07-11', title: 'Wieczór łagodny', description: 'Sen przed 23:00.', pillar: 'cialo', xp: 60 },

  // ── 12 lipca, niedziela | SLOT WNĘTRZA 2 | folikularna ──
  { id: 'jul_12_1', date: '2026-07-12', title: 'Slot Wnętrza 60 min (2/4)', description: 'Na stałej godzinie, dekompresja po weekendzie: kąpiel, journaling, sound healing.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_12_2', date: '2026-07-12', title: 'Plan tygodnia 13–19.07', description: 'Folikularna i owulacja, możliwy wyjazd na łódkę 17–19, pierwsza sesja terapii ~14, 3 aktywności.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_12_3', date: '2026-07-12', title: 'Wpis „co dziś dla siebie"', description: 'Wieczorny wpis: „Co dziś zrobiłam tylko dla siebie?" (zasada r3).', pillar: 'pozycja', xp: 60 },

  // ── TYDZIEŃ 3 (13–19.07) „Oddech w świat z pełni" ──────────────

  // ── 13 lipca, poniedziałek | folikularna ──
  { id: 'jul_13_1', date: '2026-07-13', title: 'Zimna woda na twarz 30 sek', description: 'Rano, reset układu nerwowego po okresie.', pillar: 'cialo', xp: 60 },
  { id: 'jul_13_2', date: '2026-07-13', title: 'Pierwsza aktywność tygodnia (mocniejsza)', description: 'Szarfy albo pole — folikularna niesie.', pillar: 'cialo', xp: 80 },
  { id: 'jul_13_3', date: '2026-07-13', title: 'Terapia — dopnij termin albo przygotuj 3 punkty', description: 'Jeśli sesja jeszcze nie umówiona — dopnij teraz. Jeśli umówiona — przygotuj 3 punkty na pierwszą sesję.', pillar: 'pozycja', xp: 80 },

  // ── 14 lipca, wtorek | folikularna | TERAPIA ──
  { id: 'jul_14_1', date: '2026-07-14', title: 'Pierwsza sesja terapii', description: 'Jeśli termin padł w tym tygodniu — idziesz. Po grunt, nie po ocenę.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_14_2', date: '2026-07-14', title: '20 min ekspresywnego pisania', description: 'Albo wpis do Vault: jak się czuję na progu fazy 2.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_14_3', date: '2026-07-14', title: 'Spacer 30 min bez telefonu', description: 'Światło, las jeśli się da. Forest bathing.', pillar: 'cialo', xp: 60 },

  // ── 15 lipca, środa | folikularna ──
  { id: 'jul_15_1', date: '2026-07-15', title: 'Hiszpański — pełny slot', description: 'Folikularna, energia wyższa — pełna sesja. Uczysz się dla siebie, nie dla widowni.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_15_2', date: '2026-07-15', title: 'Szarfy albo pole — druga aktywność', description: 'Ciało jako budowanie tożsamości.', pillar: 'cialo', xp: 60 },
  { id: 'jul_15_3', date: '2026-07-15', title: 'Łódka 17–19 — dopnij logistykę', description: 'Jeśli wyjazd realny: z kim, co zabrać, godziny. Plan przed eventem zawsze działa.', pillar: 'kapital', xp: 60 },

  // ── 16 lipca, czwartek | folikularna ──
  { id: 'jul_16_1', date: '2026-07-16', title: 'Trzecia aktywność tygodnia (regenerująca)', description: 'Joga, pływanie albo dłuższy spacer. Dowód, że ciało jest priorytetem.', pillar: 'cialo', xp: 80 },
  { id: 'jul_16_2', date: '2026-07-16', title: 'McKinsey — mikro-krok w ciekawości', description: 'Jedna rzecz logistyczna (garderoba, dojazd, formalności), bez lęku.', pillar: 'kariera', xp: 60 },
  { id: 'jul_16_3', date: '2026-07-16', title: 'Journaling: co dało mi oddech', description: 'Wieczorne 10 min wokół pytania miesiąca: „Co dziś dało mi oddech, którego nikt mi nie dał?"', pillar: 'pozycja', xp: 60 },

  // ── 17 lipca, piątek | folikularna, owulacja blisko, łódka możliwa ──
  { id: 'jul_17_1', date: '2026-07-17', title: 'Łódka — pierwsze wejście w świat z pełni', description: 'Jeśli łódka: wyjazd jako wejście z pełni, nie z głodu. Woda niesie, Ty nie musisz. Plan w kieszeni.', pillar: 'kapital', xp: 80 },
  { id: 'jul_17_2', date: '2026-07-17', title: 'Jeśli zostajesz — woda i życioumilacz', description: 'Pływanie w otwartej wodzie albo spacer boso, plus jeden życioumilacz.', pillar: 'cialo', xp: 60 },
  { id: 'jul_17_3', date: '2026-07-17', title: 'Grounding 5-4-3-2-1 na falę', description: 'Jeśli w nowym miejscu wraca fala albo niepokój: 5 widzisz, 4 słyszysz, 3 dotykasz, 2 wąchasz, 1 smak. Potem dłuższy wydech.', pillar: 'pozycja', xp: 60 },

  // ── 18 lipca, sobota | OWULACJA | łódka dzień 2 ──
  { id: 'jul_18_1', date: '2026-07-18', title: 'Łódka dzień 2 albo nowe ciało', description: 'Łódka dzień 2; jeśli w mieście — coś z łagodną adrenaliną albo spacer po nieznanej dzielnicy.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_18_2', date: '2026-07-18', title: 'Aparat analogowy — jedna klatka lata', description: 'Życioumilacz: lato na jednej klatce, wywołane na koniec. Skarb na potem.', pillar: 'styl', xp: 60 },
  { id: 'jul_18_3', date: '2026-07-18', title: 'Świadomy odpoczynek wieczorem', description: 'Bez nadrabiania. ODDECH.', pillar: 'cialo', xp: 60 },

  // ── 19 lipca, niedziela | SLOT WNĘTRZA 3 | owulacja ──
  { id: 'jul_19_1', date: '2026-07-19', title: 'Slot Wnętrza 60 min (3/4)', description: 'Na stałej godzinie. Nawet po powrocie z łódki slot nie spada.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_19_2', date: '2026-07-19', title: 'Plan tygodnia 20–26.07', description: 'Owulacja koniec, wczesna lutealna, EY 22–24, slot 26.07.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_19_3', date: '2026-07-19', title: 'Wieczorny rytuał', description: 'Sen przed 23:00. Spokój po weekendzie to nagroda, nie kolejny sprint.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 4 (20–26.07) „Praca wraca w lutealnej, fundament zostaje" ──

  // ── 20 lipca, poniedziałek | owulacja koniec ──
  { id: 'jul_20_1', date: '2026-07-20', title: 'Pierwsza aktywność tygodnia', description: 'Energia jeszcze wysoka — wykorzystaj.', pillar: 'cialo', xp: 80 },
  { id: 'jul_20_2', date: '2026-07-20', title: 'Przygotuj powrót do EY (śr–pt)', description: 'Granica godzin, lista tylko niezbędnego, zero nadrabiania. Wracasz na swoich warunkach.', pillar: 'kariera', xp: 60 },
  { id: 'jul_20_3', date: '2026-07-20', title: 'Wieczór bez scrolla', description: 'Sen przed 23:00.', pillar: 'cialo', xp: 60 },

  // ── 21 lipca, wtorek | wczesna lutealna ──
  { id: 'jul_21_1', date: '2026-07-21', title: 'Druga aktywność tygodnia (łagodniej)', description: 'W lutealnej delikatniej. Energia spada, wartość nie — to biologia, nie prawda.', pillar: 'cialo', xp: 60 },
  { id: 'jul_21_2', date: '2026-07-21', title: 'Życioumilacz kulturalny', description: 'Wystawa, galeria albo antykwariat. Świat docelowy jako jakość, nie nowość.', pillar: 'styl', xp: 60 },
  { id: 'jul_21_3', date: '2026-07-21', title: 'Future self albo Vault', description: 'Krótki wpis: dokąd idę po lecie.', pillar: 'tozsamosc', xp: 60 },

  // ── 22 lipca, środa | EY dzień 1 | wczesna lutealna ──
  { id: 'jul_22_1', date: '2026-07-22', title: 'EY dzień 1 — minimum profesjonalne', description: 'Granica: godzina wyjścia ustalona z góry. Lutealna plus EY to podwójne obciążenie — tym bardziej minimum.', pillar: 'kariera', xp: 80 },
  { id: 'jul_22_2', date: '2026-07-22', title: 'Ruch jako rozładowanie po EY', description: 'Choćby 20 min: szarfy albo spacer. Ruch spala stres szybciej niż głowa.', pillar: 'cialo', xp: 60 },
  { id: 'jul_22_3', date: '2026-07-22', title: 'Papieros — zauważ kontekst bez oceny', description: 'Jeśli stres EY podnosi ochotę: zauważ kontekst, bez oceny. Lato to okno na redukcję, bo dren EY i tak słabnie.', pillar: 'cialo', xp: 60 },

  // ── 23 lipca, czwartek | EY dzień 2 | wczesna lutealna ──
  { id: 'jul_23_1', date: '2026-07-23', title: 'EY dzień 2 — minimum', description: 'Zero zostawania po godzinach.', pillar: 'kariera', xp: 80 },
  { id: 'jul_23_2', date: '2026-07-23', title: 'Mostek albo box breathing po pracy', description: 'Dekompresja układu nerwowego po EY.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_23_3', date: '2026-07-23', title: 'Wpis „co dziś dla siebie" mimo pracy', description: 'Wieczorny wpis r3 — slot i oddech nie wypadają w dni EY.', pillar: 'pozycja', xp: 60 },

  // ── 24 lipca, piątek | EY dzień 3 | wczesna lutealna ──
  { id: 'jul_24_1', date: '2026-07-24', title: 'EY dzień 3 — domknięcie z klasą', description: 'Zamknij tydzień EY bez nadrabiania w weekend.', pillar: 'kariera', xp: 80 },
  { id: 'jul_24_2', date: '2026-07-24', title: 'Życioumilacz nagrodowy po EY', description: 'Masaż, kolacja w pięknym miejscu albo wieczór z dziewczynami. Kariera nie wypełnia serca.', pillar: 'kapital', xp: 60 },
  { id: 'jul_24_3', date: '2026-07-24', title: 'Wieczór łagodny', description: 'Sen. Oddajesz sobie weekend.', pillar: 'cialo', xp: 60 },

  // ── 25 lipca, sobota | wczesna lutealna ──
  { id: 'jul_25_1', date: '2026-07-25', title: 'Trzy zdania w polu Janka + na co zasługuję', description: 'Spisz 3 trenowane zdania i przećwicz na głos, plus krótka lista „na co zasługuję". To wektor roku, nie domknięcie na jeden dzień.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_25_2', date: '2026-07-25', title: '90 min sama ze sobą albo kontakt', description: 'W zależności od energii lutealnej: 90 min sama albo jeden świadomy kontakt.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_25_3', date: '2026-07-25', title: 'Lekki ruch, jeśli ciało prosi', description: 'Lutealna prosi o łagodność — słuchasz, nie forsujesz.', pillar: 'cialo', xp: 60 },

  // ── 26 lipca, niedziela | SLOT WNĘTRZA 4 | wczesna lutealna ──
  { id: 'jul_26_1', date: '2026-07-26', title: 'Slot Wnętrza 60 min (4/4)', description: 'Ostatni z czterech (dowód 1 = 4/4). Refleksyjny: co lipiec mi dał. Zbudowałaś infrastrukturę, której nie miałaś.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_26_2', date: '2026-07-26', title: 'Plan tygodnia 27–31.07', description: 'Imieniny 27, Jula wolna, domknięcie miesiąca i przegląd lipca.', pillar: 'pozycja', xp: 60 },
  { id: 'jul_26_3', date: '2026-07-26', title: 'Wieczorny rytuał', description: 'Sen.', pillar: 'cialo', xp: 60 },

  // ── TYDZIEŃ 5 (27–31.07) „Domykam oddech, świętuję siebie" ─────

  // ── 27 lipca, poniedziałek | IMIENINY | lutealna ──
  { id: 'jul_27_1', date: '2026-07-27', title: 'Imieniny — świętuj świadomie', description: 'Imieniny Twoje i siostry. Świętuj świadomie, nie „przy okazji": coś dla siebie plus kontakt z siostrą.', pillar: 'milosc', xp: 80 },
  { id: 'jul_27_2', date: '2026-07-27', title: 'Jeśli Jula wolna — umów coś', description: 'Obecność z pełni, nie z głodu.', pillar: 'kapital', xp: 60 },
  { id: 'jul_27_3', date: '2026-07-27', title: 'Życioumilacz świętujący', description: 'Kwiaty, kolacja albo coś pięknego dla siebie. Twoje istnienie nie potrzebuje powodu.', pillar: 'styl', xp: 60 },

  // ── 28 lipca, wtorek | lutealna ──
  { id: 'jul_28_1', date: '2026-07-28', title: 'Aktywność tygodnia (łagodnie)', description: 'Lutealna — w wersji miękkiej.', pillar: 'cialo', xp: 60 },
  { id: 'jul_28_2', date: '2026-07-28', title: '20 min ekspresywnego pisania', description: 'Trzy lekcje lipca w zalążku: co ODDECH mi pokazał.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_28_3', date: '2026-07-28', title: 'Mostek albo NSDR wieczorem', description: 'Dekompresja. Krok po kroku, oddech po oddechu.', pillar: 'pozycja', xp: 60 },

  // ── 29 lipca, środa | lutealna ──
  { id: 'jul_29_1', date: '2026-07-29', title: 'Hiszpański w slocie', description: 'Powtarzalność nad perfekcją.', pillar: 'tozsamosc', xp: 60 },
  { id: 'jul_29_2', date: '2026-07-29', title: 'Domknięcia: randka i kłótnia', description: 'Status chłopaka z randki jasny; kłótnia z przyjaciółmi domknięta, jeśli jeszcze wisi. Każda otwarta zakładka drenuje oddech.', pillar: 'kapital', xp: 80 },
  { id: 'jul_29_3', date: '2026-07-29', title: 'Mikro-krok finansowy', description: 'Przegląd lipca, terapia jako stały koszt, budżet sierpnia.', pillar: 'kariera', xp: 60 },

  // ── 30 lipca, czwartek | PRZEGLĄD część 1 | późna lutealna, PMS ──
  { id: 'jul_30_1', date: '2026-07-30', title: 'Przegląd lipca — część 1 (dane)', description: 'Slot Wnętrza 4/4, 3 aktywności w ilu tygodniach, terapia odbyta, Ghost Protocol, trend papierosów. Status 3 dowodów oddechu.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_30_2', date: '2026-07-30', title: 'Trzy lekcje lipca Twoimi słowami', description: 'Jak co miesiąc. Dane lipca to dane, nie ocena Ciebie.', pillar: 'pozycja', xp: 80 },
  { id: 'jul_30_3', date: '2026-07-30', title: 'Wieczór łagodny', description: 'Sen.', pillar: 'cialo', xp: 60 },

  // ── 31 lipca, piątek | DOMKNIĘCIE LIPCA | późna lutealna, PMS ──
  { id: 'jul_31_1', date: '2026-07-31', title: 'Przegląd lipca — część 2 + most do sierpnia', description: 'Czy „lekkie wejście w świat" było z pełni, nie z głodu. Zbuduj most do sierpnia.', pillar: 'pozycja', xp: 100 },
  { id: 'jul_31_2', date: '2026-07-31', title: 'Decyzja hasłowa o sierpniu', description: 'Słowo, intencja, jedno marzenie (kandydat: jedno wejście w obieg, którego rok temu byś nie zrobiła). Sierpień startuje w PMS/okresie — miękki start. Proponowane hasło: OBECNOŚĆ.', pillar: 'tozsamosc', xp: 80 },
  { id: 'jul_31_3', date: '2026-07-31', title: 'Rytuał zakończenia lipca', description: 'Świeca, zapis 3 zdań: co teraz wiem o sobie, czego nie wiedziałam 1.07. Kończysz lipiec z oddechem i z pozycją, nie z głodem.', pillar: 'pozycja', xp: 80 },
]
