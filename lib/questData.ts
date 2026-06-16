import type { Quest, Pillar } from '@/types'

export const SIDE_QUESTS: Quest[] = [
  // === POZYCJA WEWNĘTRZNA ===
  { id: 'sq_poz_1', title: 'Cisza przez godzinę', description: 'Spędź godzinę bez telefonu, serialu ani muzyki. Tylko ty i twoje myśli.', pillar: 'pozycja', type: 'side', xp: 120, difficulty: 'medium', tags: ['spokój', 'mindfulness'] },
  { id: 'sq_poz_2', title: 'List do przyszłej siebie', description: 'Napisz list do siebie za rok. Co chcesz, żeby ta Natalia wiedziała? Jak wygląda jej dzień?', pillar: 'pozycja', type: 'side', xp: 150, difficulty: 'medium', tags: ['wizja', 'tożsamość'] },
  { id: 'sq_poz_3', title: 'Wypisz, czego się boisz', description: 'Napisz 10 rzeczy, których się obawiasz w tym roku. Dla każdej napisz jeden konkretny krok, który zmniejsza ten strach.', pillar: 'pozycja', type: 'side', xp: 130, difficulty: 'medium', tags: ['odwaga', 'samoświadomość'] },
  { id: 'sq_poz_4', title: 'Wypisz swoje standardy', description: 'Co akceptujesz w swoim życiu, a czego nie? Napisz 5 rzeczy, na które nie ma już miejsca w nowej wersji siebie.', pillar: 'pozycja', type: 'side', xp: 120, difficulty: 'easy', tags: ['standardy', 'granice'] },
  { id: 'sq_poz_5', title: 'Detoks informacyjny na 24h', description: 'Przez cały dzień nie sprawdzasz mediów społecznościowych. Żadnego instagramowego scrollowania. Obserwuj jak się czujesz.', pillar: 'pozycja', type: 'side', xp: 150, difficulty: 'hard', tags: ['detoks', 'spokój'] },

  // === CIAŁO I ENERGIA ===
  { id: 'sq_ciao_1', title: 'Trening 45 minut', description: 'Porządny trening siłowy lub cardio. 45 minut bez rozpraszaczy.', pillar: 'cialo', type: 'side', xp: 120, difficulty: 'medium', tags: ['ruch', 'energia'] },
  { id: 'sq_ciao_2', title: 'Dzień pielęgnacyjny', description: 'Maseczka, peeling, odżywka, olejek do ciała, perfekcyjna pielęgnacja od stóp do głów.', pillar: 'cialo', type: 'side', xp: 100, difficulty: 'easy', tags: ['pielęgnacja', 'rytuał'] },
  { id: 'sq_ciao_3', title: 'Spacer 60 minut', description: 'Godzinny spacer — bez słuchawek lub z podcastem edukacyjnym. Idź w ładne miejsce.', pillar: 'cialo', type: 'side', xp: 100, difficulty: 'easy', tags: ['ruch', 'spokój'] },
  { id: 'sq_ciao_4', title: 'Zdrowy dzień jedzenia', description: 'Cały dzień jesz świadomie: pełnowartościowe posiłki, odpowiednia ilość białka, bez emocjonalnego jedzenia.', pillar: 'cialo', type: 'side', xp: 130, difficulty: 'medium', tags: ['odżywianie', 'dyscyplina'] },
  { id: 'sq_ciao_5', title: 'Zaplanuj fryzjera/kosmetyczkę', description: 'Umów się na zabieg pielęgnacyjny — fryzjer, kosmetyczka, manicure. Dbasz o siebie z wyprzedzeniem.', pillar: 'cialo', type: 'side', xp: 80, difficulty: 'easy', tags: ['pielęgnacja', 'planowanie'] },

  // === STYL, KLASA, AURA ===
  { id: 'sq_styl_1', title: 'Zrób audyt garderoby', description: 'Wyjmij WSZYSTKO z szafy. Odłóż co nie pasuje do nowej wersji siebie. Zrób listę braków.', pillar: 'styl', type: 'side', xp: 150, difficulty: 'hard', tags: ['garderoba', 'edycja'] },
  { id: 'sq_styl_2', title: 'Jeden dzień "outfit of the day"', description: 'Ubierz się tak, jakbyś szła na ważne spotkanie. Nawet jeśli nie. Zrób zdjęcie dla siebie.', pillar: 'styl', type: 'side', xp: 100, difficulty: 'easy', tags: ['styl', 'prezencja'] },
  { id: 'sq_styl_3', title: 'Obejrzyj 3 inspiracje stylistyczne', description: 'Znajdź 3 kobiety w sieci lub w filmie, których styl podziwiasz. Zanotuj co konkretnie przyciąga Cię w ich wyglądzie.', pillar: 'styl', type: 'side', xp: 80, difficulty: 'easy', tags: ['inspiracja', 'wizja'] },
  { id: 'sq_styl_4', title: 'Ćwicz postawę przez cały dzień', description: 'Świadomość ciała: przez cały dzień kontrolujesz postawę. Ramiona do tyłu, kark wyprostowany. Jak chodzi kobieta z klasą.', pillar: 'styl', type: 'side', xp: 120, difficulty: 'medium', tags: ['postawa', 'prezencja'] },
  { id: 'sq_styl_5', title: 'Jeden luksusowy rytuał', description: 'Herbata w ładnej filiżance, kąpiel z pianą i świecami, kolacja przy stole bez telefonu. Jeden moment, który traktujesz siebie jak gościa zasługującego na piękno.', pillar: 'styl', type: 'side', xp: 100, difficulty: 'easy', tags: ['rytuał', 'jakość'] },

  // === KAPITAŁ SPOŁECZNY ===
  { id: 'sq_kap_1', title: 'Napisz do kogoś wartościowego', description: 'Napisz do osoby, którą podziwiasz lub z którą chcesz budować relację. Bez celu. Ciepła wiadomość.', pillar: 'kapital', type: 'side', xp: 120, difficulty: 'medium', tags: ['relacje', 'inicjatywa'] },
  { id: 'sq_kap_2', title: 'Wyjdź na kawę/lunch z kimś nowym', description: 'Umów się z kimś, z kim rzadko rozmawiasz lub kogo chcesz lepiej poznać.', pillar: 'kapital', type: 'side', xp: 150, difficulty: 'hard', tags: ['networking', 'środowisko'] },
  { id: 'sq_kap_3', title: 'Odpisz na jedno zaproszenie', description: 'Jest jakieś wydarzenie, wyjście, spotkanie na które Ci się nie chce? Idź. To buduje obieg.', pillar: 'kapital', type: 'side', xp: 130, difficulty: 'medium', tags: ['aktywność', 'obecność'] },
  { id: 'sq_kap_4', title: 'Zrób listę 10 wartościowych osób', description: 'Wypisz 10 osób, których obecność w Twoim życiu chcesz wzmocnić lub nawiązać. Dla każdej napisz jak.', pillar: 'kapital', type: 'side', xp: 100, difficulty: 'medium', tags: ['strategia', 'środowisko'] },
  { id: 'sq_kap_5', title: 'Znajdź wydarzenie do odwiedzenia', description: 'Znajdź jedno wydarzenie w swoim mieście w następnych 30 dniach, na które warto iść. Kup bilet lub zarejestruj się.', pillar: 'kapital', type: 'side', xp: 120, difficulty: 'medium', tags: ['wyjście', 'aktywność'] },

  // === KARIERA I FINANSE ===
  { id: 'sq_kar_1', title: 'Zaktualizuj CV', description: 'Otwórz CV i zaktualizuj je. Dodaj ostatnie osiągnięcia, zaktualizuj język, sprawdź formatowanie.', pillar: 'kariera', type: 'side', xp: 150, difficulty: 'hard', tags: ['kariera', 'gotowość'] },
  { id: 'sq_kar_2', title: 'Przejrzyj oferty pracy', description: 'Spędź 30 minut przeglądając oferty pracy. Zapisz 3 stanowiska, które Cię inspirują lub do których aspirujesz.', pillar: 'kariera', type: 'side', xp: 100, difficulty: 'easy', tags: ['kariera', 'orientacja'] },
  { id: 'sq_kar_3', title: 'Audyt finansowy', description: 'Sprawdź swoje konto, wszystkie wydatki z ostatniego miesiąca. Gdzie poszły pieniądze? Co zmienić?', pillar: 'kariera', type: 'side', xp: 130, difficulty: 'medium', tags: ['finanse', 'świadomość'] },
  { id: 'sq_kar_4', title: 'Zaplanuj budżet na miesiąc', description: 'Napisz realny budżet na najbliższy miesiąc. Kategorie: stałe, jedzenie, przyjemności, oszczędności, długi.', pillar: 'kariera', type: 'side', xp: 150, difficulty: 'hard', tags: ['finanse', 'planowanie'] },
  { id: 'sq_kar_5', title: 'Naucz się czegoś zawodowego', description: 'Poświęć 1 godzinę na kurs, webinar lub artykuł, który wzmacnia Twoją pozycję zawodową.', pillar: 'kariera', type: 'side', xp: 120, difficulty: 'medium', tags: ['rozwój', 'kompetencje'] },

  // === TOŻSAMOŚĆ PREMIUM ===
  { id: 'sq_toz_1', title: 'Przeczytaj 50 stron', description: 'Usiądź i przeczytaj 50 stron dobrej książki. Bez przerywania, bez telefonu.', pillar: 'tozsamosc', type: 'side', xp: 120, difficulty: 'medium', tags: ['książki', 'skupienie'] },
  { id: 'sq_toz_2', title: 'Muzeum, galeria lub koncert', description: 'Odwiedź miejsce kultury. Idź sama lub z kimś. Bądź tam naprawdę.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['kultura', 'doświadczenie'] },
  { id: 'sq_toz_3', title: 'Ćwicz język obcy 30 minut', description: 'Angielski, włoski, francuski — 30 minut nauki. Aplikacja, lekcja, film w oryginalnym języku.', pillar: 'tozsamosc', type: 'side', xp: 100, difficulty: 'easy', tags: ['języki', 'edukacja'] },
  { id: 'sq_toz_4', title: 'Napisz o sobie 3 zdania', description: 'Kim jesteś? Gdybyś musiała opisać siebie komuś inteligentnemu — 3 zdania o sobie, swojej wartości i tym dokąd zmierzasz.', pillar: 'tozsamosc', type: 'side', xp: 100, difficulty: 'medium', tags: ['tożsamość', 'narracja'] },
  { id: 'sq_toz_5', title: 'Obejrzyj film/dokument wartościowy', description: 'Zamiast netfliksa na randomowo — wybierz świadomie. Dokument, film nagradzany, klasyk. Obejrzyj w skupieniu.', pillar: 'tozsamosc', type: 'side', xp: 100, difficulty: 'easy', tags: ['kultura', 'jakość'] },

  // === MIŁOŚĆ I STANDARD ===
  { id: 'sq_mil_1', title: 'Wypisz swój standard relacyjny', description: 'Co jest dla Ciebie absolutnie niezbędne w relacji? Co jest dealbreakerem? Napisz konkretnie i uczciwie.', pillar: 'milosc', type: 'side', xp: 130, difficulty: 'medium', tags: ['standard', 'wartości'] },
  { id: 'sq_mil_2', title: 'Dzień bez analizy okruszków', description: 'Pełny dzień bez sprawdzania profili, lajków, ciszy ani wspólnych znajomych. Bez detektywów bez licencji. Jeśli masz wyciszone konkretne osoby — dodatkowe 20 XP.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'hard', tags: ['wolność', 'godność'] },
  { id: 'sq_mil_3', title: 'Co chcę czuć w relacji?', description: 'Napisz jak chcesz się czuć przy partnerze. Nie co chcesz robić — jak chcesz się CZUĆ. Bezpiecznie, widziana, pożądana...', pillar: 'milosc', type: 'side', xp: 120, difficulty: 'medium', tags: ['emocje', 'wizja'] },
  { id: 'sq_mil_4', title: 'Zrób coś romantycznego dla siebie', description: 'Kolacja dla siebie, kwiaty, perfumy, ulubiony deser. Udowodnij sobie, że nie potrzebujesz drugiej osoby, żeby być traktowana pięknie.', pillar: 'milosc', type: 'side', xp: 120, difficulty: 'easy', tags: ['self-love', 'rytuał'] },
  { id: 'sq_mil_5', title: 'Wyjdź tam gdzie mogą być ciekawi ludzie', description: 'Kawiarnia, event, zajęcia. Wyjdź, wyglądaj pięknie, bądź sobą. Nie z celem — z otwartością.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'hard', tags: ['obecność', 'otwartość'] },

  // === ACHIEVEMENTY ŻYCIOWE — duże, rzadkie, wyjątkowe ===

  // Ciało i sport
  { id: 'sq_life_1', title: 'Opanuj pozycję kruka (joga)', description: 'Bakasana — stanie na rękach ze zgiętymi kolanami. Wymaga siły, balansu i cierpliwości. Ćwicz do momentu, aż utrzymasz 5 sekund.', pillar: 'cialo', type: 'side', xp: 280, difficulty: 'hard', tags: ['joga', 'siła', 'ciało'], steps: [
    'Rozciągnij nadgarstki i ramiona — 5 minut dziennie przez tydzień',
    'Wzmocnij core: deska, hollow body — 3 razy w tygodniu',
    'Ćwicz równowagę: stanie na rękach przy ścianie',
    'Spróbuj bakasany z blokiem pod stopy — sprawdź balans',
    'Bakasana bez wsparcia — trzymaj 3 sekundy',
    'Bakasana bez wsparcia — trzymaj 5 sekund i udokumentuj',
  ] },
  { id: 'sq_life_2', title: 'Zrób szpagat', description: 'Pełny szpagat poprzeczny lub podłużny. Nie musi być idealny — musi być prawdziwy. Dokumentujesz zdjęciem.', pillar: 'cialo', type: 'side', xp: 350, difficulty: 'hard', tags: ['elastyczność', 'ciało', 'cel'], steps: [
    'Codzienne rozciąganie bioder i pachwin — minimum 10 minut przez 2 tygodnie',
    'Ćwicz half-split przy ścianie — trzymaj 60 sekund na każdą stronę',
    'Pogłębiony half-split z podporem na poduszkach lub blokach',
    'Szpagat ze wspomaganiem — choćby częściowy',
    'Pełny szpagat — zrób zdjęcie jako dowód',
  ] },
  { id: 'sq_life_3', title: 'Odwrócony szpagat na szarfach', description: 'Splits w aerial silk. Wymaga techniki, zaufania i treningu na szarfach. Jeden z trudniejszych questów fizycznych.', pillar: 'cialo', type: 'side', xp: 500, difficulty: 'hard', tags: ['szarfy', 'akrobatyka', 'ciało'], steps: [
    'Naucz się robić szpagat na ziemi (patrz: quest „Zrób szpagat")',
    'Opanuj podstawy szarf: wspinaczka, zawinięcia, stopy',
    'Naucz się wchodzić w inverted (odwrócenie) na szarfach',
    'Ćwicz inverted straddle — rozstawianie nóg w górze',
    'Połącz: inverted + szpagat w powietrzu z asekuracją instruktora',
    'Samodzielny odwrócony szpagat — udokumentuj',
  ] },
  { id: 'sq_life_4', title: 'Naucz się jeździć na nartach', description: 'Pierwszy raz na nartach lub wyraźne opanowanie zjazdu. Stoki, buty, kijki, zjazd bez wpadki. Liczy się wyjazd i próba.', pillar: 'cialo', type: 'side', xp: 400, difficulty: 'hard', tags: ['narty', 'sport', 'wyjazd'], steps: [
    'Zarezerwuj wyjazd na stok i wypożycz sprzęt',
    'Obejrzyj 2-3 filmiki dla początkujących (pozycja, hamowanie pługiem)',
    'Opanuj ślizg płużny i zatrzymywanie się na łagodnym stoku',
    'Zjedź samodzielnie łagodnym stokiem',
    'Zjedź stokiem średnim bez upadku',
  ] },
  { id: 'sq_life_5', title: 'Wyjazd na konie', description: 'Jazda konna — w terenie lub na ujeżdżalni. Minimum godzinna sesja. Elegancki sport z historią.', pillar: 'cialo', type: 'side', xp: 250, difficulty: 'medium', tags: ['konie', 'jeździectwo', 'elegancja'] },
  { id: 'sq_life_6', title: 'Jazda konna (kolejna)', description: 'Druga lub kolejna sesja jeździecka. Praca nad dosiadem, pewność siebie na siodle.', pillar: 'cialo', type: 'side', xp: 200, difficulty: 'medium', tags: ['konie', 'jeździectwo'] },
  { id: 'sq_life_7', title: 'Naucz się robić gwiazdę', description: 'Gwiazdka w bok — akrobatyka podstawowa. Trening na trawie, macie lub w sali. Do skutku.', pillar: 'cialo', type: 'side', xp: 220, difficulty: 'medium', tags: ['akrobatyka', 'ciało', 'sprawność'] },
  { id: 'sq_life_8', title: '2 wieże — skoki', description: 'Skoki z wieży do wody. Odwaga ciała, odwaga głowy. Dokumentujesz.', pillar: 'cialo', type: 'side', xp: 300, difficulty: 'hard', tags: ['odwaga', 'woda', 'lato'] },

  // Kultura i doświadczenia
  { id: 'sq_life_9',  title: 'Teatr', description: 'Spektakl teatralny — dramat, komedia, musical. Idź dopracowana. Bądź tam naprawdę, nie tylko fizycznie.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'easy', tags: ['teatr', 'kultura', 'klasa'] },
  { id: 'sq_life_10', title: 'Opera', description: 'Wieczór w operze. Sukienka, program, skupienie. Jedno z najbardziej klasycznych doświadczeń kulturalnych.', pillar: 'tozsamosc', type: 'side', xp: 250, difficulty: 'medium', tags: ['opera', 'kultura', 'elegancja'] },
  { id: 'sq_life_11', title: 'Filharmonia', description: 'Koncert symfoniczny w filharmonii. Cisza, muzyka na żywo, obecność w miejscu z historią.', pillar: 'tozsamosc', type: 'side', xp: 200, difficulty: 'medium', tags: ['filharmonia', 'muzyka', 'kultura'] },
  { id: 'sq_life_12', title: 'Wystawa', description: 'Galeria sztuki, fotografia, instalacje. Minimum godzina, z uwagą. Nie tylko selfie przy eksponatach.', pillar: 'tozsamosc', type: 'side', xp: 120, difficulty: 'easy', tags: ['sztuka', 'galeria', 'kultura'] },
  { id: 'sq_life_13', title: 'Muzeum', description: 'Muzeum historyczne, przyrodnicze, designu — cokolwiek, ale z pełną uwagą. Jedno muzeum, jedna godzina skupienia.', pillar: 'tozsamosc', type: 'side', xp: 130, difficulty: 'easy', tags: ['muzeum', 'historia', 'kultura'] },
  { id: 'sq_life_14', title: 'Jazz', description: 'Koncert jazzowy — klub, piwnica, scena. Atmosfera, improwizacja, klasa. Jeden wieczór.', pillar: 'tozsamosc', type: 'side', xp: 160, difficulty: 'easy', tags: ['jazz', 'muzyka', 'klimat'] },
  { id: 'sq_life_15', title: 'Koncert', description: 'Dowolny koncert na żywo — muzyka, energia, obecność. Idź jako kobieta, która potrafi cieszyć się życiem.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'easy', tags: ['koncert', 'muzyka', 'energia'] },
  { id: 'sq_life_16', title: 'Lekcja tańca', description: 'Salsa, tango, bachata, balet — jedna lekcja. Ciało, rytm, uważność. Coś, co buduje kobiecość przez ruch.', pillar: 'tozsamosc', type: 'side', xp: 180, difficulty: 'medium', tags: ['taniec', 'ciało', 'kobiecość'] },
  { id: 'sq_life_17', title: 'Czytanie książki w parku', description: 'Koc, książka, park. Wolne popołudnie bez agendy. Minimum 1,5 godziny skupionego czytania.', pillar: 'tozsamosc', type: 'side', xp: 100, difficulty: 'easy', tags: ['książki', 'spokój', 'jakość'] },
  { id: 'sq_life_18', title: 'Oglądanie gry w polo', description: 'Mecz polo — na żywo. Elegancki, niszowy, wyjątkowy. Ubierz się stosownie. Zapamiętasz.', pillar: 'tozsamosc', type: 'side', xp: 300, difficulty: 'medium', tags: ['polo', 'elegancja', 'niszowe'] },
  { id: 'sq_life_19', title: 'WSET — kurs wina', description: 'Oficjalny kurs degustacji wina (WSET Level 1, 2 lub 3). Wiedza, która zostaje na całe życie i robi wrażenie w każdej rozmowie.', pillar: 'tozsamosc', type: 'side', xp: 600, difficulty: 'hard', tags: ['wino', 'WSET', 'wiedza', 'klasa'], steps: [
    'Znajdź akredytowanego organizatora kursu WSET w Polsce',
    'Zapisz się na WSET Level 1 lub 2',
    'Przejdź kurs — zajęcia + degustacje',
    'Przygotuj się do egzaminu (powtórz notatki, karty win)',
    'Zdaj egzamin i odbierz certyfikat',
  ] },

  // Sport i lifestyle premium
  { id: 'sq_life_20', title: 'Golf na polu golfowym', description: 'Pierwsze wyjście na pole golfowe. Swing, cisza, zieleń, klasa. Nie musisz być dobra — musisz być tam.', pillar: 'kapital', type: 'side', xp: 350, difficulty: 'hard', tags: ['golf', 'sport', 'premium', 'networking'], steps: [
    'Obejrzyj podstawowe filmiki o chwycie i swingu',
    'Weź lekcję próbną na driving range',
    'Poćwicz swing na driving range samodzielnie (min. 2 sesje)',
    'Wyjdź na pole — choćby 9 dołków',
  ] },
  { id: 'sq_life_21', title: 'Szarfy — występ', description: 'Udział w pokazie lub prezentacji na szarfach (aerial silk). Przygotowany numer, widzowie, scena.', pillar: 'cialo', type: 'side', xp: 500, difficulty: 'hard', tags: ['szarfy', 'występ', 'odwaga'] },
  { id: 'sq_life_22', title: 'Trip poza Warszawę', description: 'Wyjazd z miasta — weekend, kilka dni, nie ma znaczenia dokąd. Zmiana perspektywy, nowe powietrze, świadome wyjście z rutyny.', pillar: 'kapital', type: 'side', xp: 300, difficulty: 'medium', tags: ['podróż', 'reset', 'przygoda'] },

  // Umysł i wiedza
  { id: 'sq_life_23', title: 'Naucz się grać w blackjacka', description: 'Zasady, strategia podstawowa, card counting w teorii. Zagraj co najmniej jedną prawdziwą partię (online lub na żywo).', pillar: 'tozsamosc', type: 'side', xp: 180, difficulty: 'medium', tags: ['gra', 'strategia', 'zabawa'], steps: [
    'Przeczytaj zasady blackjacka — wartości kart, cel gry',
    'Naucz się podstawowej strategii (basic strategy chart)',
    'Pobaw się online za darmo — min. 30 minut',
    'Zapoznaj się z teorią card countingu (Hi-Lo system)',
    'Zagraj prawdziwą partię (kasyno, wieczór planszówkowy lub online za $)',
  ] },
  { id: 'sq_life_24', title: 'Poznaj hipotezę Riemanna', description: 'Jeden z siedmiu Problemów Milenijnych — nikomu jeszcze nie udało się jej udowodnić. Przestudiuj co to jest, dlaczego jest trudna i co oznaczałoby rozwiązanie. Zrób notatkę.', pillar: 'tozsamosc', type: 'side', xp: 250, difficulty: 'hard', tags: ['matematyka', 'wiedza', 'mózg'], steps: [
    'Obejrzyj filmik popularnonaukowy o hipotezie Riemanna (np. 3Blue1Brown)',
    'Przeczytaj artykuł o liczbach pierwszych i funkcji dzeta',
    'Zrozum dlaczego hipoteza jest nieudowodniona i co oznaczałoby rozwiązanie',
    'Napisz własne podsumowanie w 5 zdaniach — zrób notatkę',
  ] },
  { id: 'sq_life_25', title: 'Wygrana w programie', description: 'Udział i wygrana w jakimkolwiek programie — konkurs, quiz, teleturniej, program TV. Liczy się udział i walka o wynik.', pillar: 'pozycja', type: 'side', xp: 500, difficulty: 'hard', tags: ['wygrana', 'konkurs', 'odwaga'] },

  // Sport i aktywności
  { id: 'sq_life_28', title: 'Strzelanie z łuku', description: 'Sesja strzelania z łuku — na strzelnicy lub w terenie. Skupienie, spokój, precyzja. Elegancki sport z dużą dawką mindfulness.', pillar: 'cialo', type: 'side', xp: 220, difficulty: 'medium', tags: ['łuk', 'sport', 'skupienie', 'precyzja'], steps: [
    'Znajdź strzelnicę łuczniczą w okolicy i zarezerwuj termin',
    'Weź lekcję wprowadzającą — postawa, uchwyt, celowanie',
    'Strzel pierwszą serię celując w tarczę z bliskiej odległości',
    'Poćwicz oddech i skupienie — łucznictwo to medytacja w ruchu',
    'Strzel serię z docelowej odległości i udokumentuj wynik',
  ] },

  // Wdzięczność i relacje
  { id: 'sq_life_26', title: 'Podziękuj fundacji FDNT', description: 'Napisz lub zadzwoń do fundacji FDNT z podziękowaniem. Szczerym, konkretnym. Wdzięczność wyrażona to wdzięczność prawdziwa.', pillar: 'kapital', type: 'side', xp: 200, difficulty: 'easy', tags: ['wdzięczność', 'relacje', 'ważne'] },
  { id: 'sq_life_27', title: 'Podziękuj terapeutce', description: 'Wyraź wdzięczność swojej terapeutce — za pracę, czas, obecność. Słowa, list, coś symbolicznego. To ważne.', pillar: 'pozycja', type: 'side', xp: 200, difficulty: 'easy', tags: ['wdzięczność', 'terapia', 'ważne'] },

  // === MIŁOŚĆ I STANDARD — rozszerzenie ===
  { id: 'sq_mil_6', title: 'Pierwszy ruch', description: 'Napisz pierwsza do kogoś, kto Cię intryguje. Lekko, ciepło, bez czekania aż on się odważy. Inicjatywa to też kobiecość.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['odwaga', 'inicjatywa'] },
  { id: 'sq_mil_7', title: 'Przyjmij komplement w całości', description: 'Cały dzień przyjmujesz każdy komplement bez zbywania, bez "eee, taka stara sukienka". Tylko "dziękuję" i uśmiech. Zasługujesz na każde dobre słowo.', pillar: 'milosc', type: 'side', xp: 100, difficulty: 'easy', tags: ['godność', 'self-love'] },
  { id: 'sq_mil_9', title: 'Powiedz "nie" bez tłumaczenia', description: 'Odmów dziś czegoś bez akapitu usprawiedliwień. Pełne zdanie: "Nie, dziękuję." Kropka. Twój czas nie wymaga zezwolenia.', pillar: 'milosc', type: 'side', xp: 130, difficulty: 'medium', tags: ['granice', 'godność'] },
  { id: 'sq_mil_10', title: 'Wieczór w pełnej krasie — sama', description: 'Ubierz się tak, jakby ktoś miał Cię zabrać na najlepszą randkę roku. Wyjdź na miasto sama. Bądź kobietą, na którą się patrzy — dla siebie, nie dla widowni.', pillar: 'milosc', type: 'side', xp: 180, difficulty: 'hard', tags: ['obecność', 'self-love'] },
  { id: 'sq_mil_11', title: 'Flirt bez celu', description: 'Poflirtuj — lekko, z klasą, bez planu na przyszłość. Barista, nieznajomy, ktoś z pracy. Ćwicz swoją lekkość, nie łów. Kobiecość to też zabawa.', pillar: 'milosc', type: 'side', xp: 130, difficulty: 'medium', tags: ['lekkość', 'kobiecość'] },

  // === POZYCJA WEWNĘTRZNA — rozszerzenie ===
  { id: 'sq_poz_6', title: 'Dzień bez "przepraszam"', description: 'Przez cały dzień nie przepraszasz za swoją obecność, zdanie ani potrzeby. "Przepraszam" tylko wtedy, gdy naprawdę kogoś skrzywdziłaś.', pillar: 'pozycja', type: 'side', xp: 130, difficulty: 'medium', tags: ['pewność', 'granice'] },
  { id: 'sq_poz_7', title: 'Poranek tylko twój', description: 'Pierwsza godzina po przebudzeniu bez telefonu. Woda, okno, oddech, myśli. Zacznij dzień jako autorka, nie jako reagująca na cudze wiadomości.', pillar: 'pozycja', type: 'side', xp: 120, difficulty: 'medium', tags: ['rytuał', 'spokój'] },
  { id: 'sq_poz_8', title: 'Medytacja 20 minut', description: 'Usiądź, zamknij oczy, oddychaj. 20 minut. Bez aplikacji, która Cię ocenia — tylko Ty i cisza.', pillar: 'pozycja', type: 'side', xp: 100, difficulty: 'easy', tags: ['spokój', 'mindfulness'] },
  { id: 'sq_poz_9', title: 'Wypisz 10 swoich zwycięstw', description: 'Rzeczy, które już osiągnęłaś, a które kiedyś wydawały się nierealne. Dowód, że potrafisz. Wróć do tej listy w gorszy dzień.', pillar: 'pozycja', type: 'side', xp: 100, difficulty: 'easy', tags: ['pewność', 'samoświadomość'] },

  // === CIAŁO I ENERGIA — rozszerzenie ===
  { id: 'sq_ciao_6', title: 'Dzień bez cukru', description: 'Cały dzień bez cukru dodanego. Obserwuj energię, głód, nastrój. Jeden dzień jasności.', pillar: 'cialo', type: 'side', xp: 120, difficulty: 'medium', tags: ['odżywianie', 'dyscyplina'] },
  { id: 'sq_ciao_7', title: '8000 kroków', description: 'Przejdź dziś minimum 8000 kroków. Rozbij to jak chcesz — byle ciało było w ruchu.', pillar: 'cialo', type: 'side', xp: 100, difficulty: 'easy', tags: ['ruch', 'energia'] },
  { id: 'sq_life_29', title: 'Przebiegnij 5 kilometrów', description: 'Bez przerwy, w swoim tempie. Nie musi być szybko — musi być całe. Dokumentujesz zegarkiem lub aplikacją.', pillar: 'cialo', type: 'side', xp: 300, difficulty: 'hard', tags: ['bieganie', 'wytrwałość', 'cel'], steps: [
    'Zacznij od marszobiegu: 1 min bieg / 2 min marsz przez 20 minut',
    'Wydłużaj bieg: 5 min bieg / 1 min marsz',
    'Przebiegnij 3 km bez przerwy',
    'Przebiegnij 5 km bez przerwy — udokumentuj czas',
  ] },
  { id: 'sq_life_30', title: 'Pierwsze podciągnięcie', description: 'Jedno pełne podciągnięcie na drążku. Z martwego zwisu, broda nad drążkiem. Siła, której większość nigdy nie zbudowała.', pillar: 'cialo', type: 'side', xp: 300, difficulty: 'hard', tags: ['siła', 'cel'], steps: [
    'Buduj plecy: wiosłowanie i ściąganie drążka 3x w tygodniu',
    'Negatywne podciągnięcia: wskocz nad drążek i opuszczaj się powoli',
    'Podciągnięcia z gumą oporową',
    'Jedno pełne podciągnięcie bez wspomagania — udokumentuj',
  ] },
  { id: 'sq_life_31', title: 'Wspinaczka na ściance', description: 'Sesja boulderingu lub wspinaczki z liną. Strach wysokości kontra zaufanie do ciała. Idź choćby raz.', pillar: 'cialo', type: 'side', xp: 200, difficulty: 'medium', tags: ['wspinaczka', 'odwaga'] },

  // === STYL, KLASA, AURA — rozszerzenie ===
  { id: 'sq_styl_7', title: 'Analiza kolorystyczna', description: 'Sprawdź swój typ urody i paletę kolorów — online lub u stylistki. Koniec z kupowaniem rzeczy, które Cię gaszą.', pillar: 'styl', type: 'side', xp: 180, difficulty: 'medium', tags: ['kolory', 'wiedza'] },
  { id: 'sq_life_32', title: 'Profesjonalna sesja zdjęciowa', description: 'Umów sesję u fotografa. Włosy, makijaż, stylizacja, światło. Zobacz siebie taką, jaką widzą inni w najlepszym wydaniu.', pillar: 'styl', type: 'side', xp: 250, difficulty: 'medium', tags: ['sesja', 'prezencja'], steps: [
    'Znajdź fotografa, którego portfolio Cię zachwyca',
    'Zaplanuj stylizacje i ewentualnie makijaż/włosy',
    'Zrób sesję',
    'Wybierz i zapisz najlepsze ujęcia',
  ] },

  // === KAPITAŁ SPOŁECZNY — rozszerzenie ===
  { id: 'sq_kap_6', title: 'Poproś o przysługę', description: 'Poproś kogoś o realną pomoc. Paradoks: ludzie lubią tych, którym pomogli. Proszenie też buduje więź.', pillar: 'kapital', type: 'side', xp: 120, difficulty: 'medium', tags: ['relacje', 'odwaga'] },
  { id: 'sq_kap_7', title: 'Odnów wartościowy kontakt', description: 'Odezwij się do kogoś, z kim straciłaś kontakt, a kogo cenisz. Bez pretekstu — po prostu "myślałam o Tobie".', pillar: 'kapital', type: 'side', xp: 120, difficulty: 'easy', tags: ['relacje', 'inicjatywa'] },

  // === KARIERA I FINANSE — rozszerzenie ===
  { id: 'sq_kar_6', title: 'Zbuduj poduszkę finansową — plan', description: 'Policz, ile potrzebujesz na 3 miesiące życia, i zrób plan, jak to odłożyć. Bezpieczeństwo finansowe to bezpieczeństwo wyborów.', pillar: 'kariera', type: 'side', xp: 150, difficulty: 'medium', tags: ['finanse', 'bezpieczeństwo'] },
  { id: 'sq_life_34', title: 'Negocjuj na swoją korzyść', description: 'Wynegocjuj coś realnego — stawkę, cenę, warunki, podwyżkę. Raz. Świadomie. Komfort negocjacji to wolność finansowa.', pillar: 'kariera', type: 'side', xp: 250, difficulty: 'hard', tags: ['negocjacje', 'finanse', 'odwaga'], steps: [
    'Wybierz jedną rzecz do negocjacji (stawka, cena, warunki)',
    'Przygotuj argumenty i swoją dolną granicę',
    'Przeprowadź rozmowę — poproś o więcej, niż oczekujesz',
    'Zanotuj wynik i czego się nauczyłaś',
  ] },
  { id: 'sq_life_35', title: 'Zarób pierwsze pieniądze poza etatem', description: 'Sprzedaj coś, weź zlecenie, zrób projekt po godzinach. Pierwszy grosz z własnej inicjatywy zmienia to, jak widzisz siebie.', pillar: 'kariera', type: 'side', xp: 350, difficulty: 'hard', tags: ['niezależność', 'inicjatywa'], steps: [
    'Wybierz, co możesz sprzedać lub jaką usługę zaoferować',
    'Ustal cenę i znajdź pierwszego klienta',
    'Dostarcz i przyjmij płatność',
  ] },

  // === TOŻSAMOŚĆ PREMIUM — rozszerzenie ===
  { id: 'sq_toz_6', title: 'Opanuj jedno wykwintne danie', description: 'Wybierz jedno imponujące danie i naucz się go do perfekcji. Twoje danie sygnaturowe, którym zachwycisz każdego gościa.', pillar: 'tozsamosc', type: 'side', xp: 180, difficulty: 'medium', tags: ['gotowanie', 'umiejętność'] },
  { id: 'sq_life_37', title: 'Opublikuj coś swojego', description: 'Napisz tekst, nagraj, stwórz — i pokaż światu. Post, artykuł, film. Pokonaj strach przed byciem widzianą.', pillar: 'tozsamosc', type: 'side', xp: 250, difficulty: 'hard', tags: ['twórczość', 'odwaga'] },

  // ========================================================================
  // KATALOG TEMATYCZNY — sekcje A-F (świeży zestaw)
  // Każdy quest ma twardy warunek zaliczenia (= description). Tag sekcji
  // ('faza1', 'świat docelowy', 'somatyka', 'standard', 'wildcard',
  // 'parlor trick') pozwala je później grupować/filtrować.
  // ========================================================================

  // === A. DOMKNIĘCIE FAZY 1 (Zakorzenienie, czerwiec) ===
  { id: 'sq_root_01', title: 'Slot Wnętrza 4/4 w czerwcu', description: 'Cztery niedziele (7, 14, 21, 28) zaksięgowane — nie trzy. Faza domknięta czysto.', pillar: 'pozycja', type: 'side', xp: 300, difficulty: 'hard', tags: ['faza1', 'wnętrze', 'konsekwencja'] },
  { id: 'sq_root_02', title: 'Kartka standardów 5+5', description: 'Fizyczna kartka: 5 standardów relacyjnych, 5 wyłączeń. Termin do 27.06.', pillar: 'milosc', type: 'side', xp: 250, difficulty: 'hard', tags: ['faza1', 'standard', 'wnętrze'] },
  { id: 'sq_root_03', title: 'Występ na szarfach 20.06', description: 'Wyszłaś na scenę. Kropka. Jakość występu nie podlega ocenie — liczy się wyjście.', pillar: 'cialo', type: 'side', xp: 400, difficulty: 'hard', tags: ['faza1', 'szarfy', 'występ'] },
  { id: 'sq_root_04', title: 'Audyt blokady', description: '30.06 odpowiadasz sobie "nie sprawdzałam" — i to jest prawda.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['faza1', 'blokada', 'godność'] },
  { id: 'sq_root_05', title: 'List do Natalii z 1 lipca', description: 'Napisany przed 30.06, zapieczętowany, otwierany 1.07.', pillar: 'pozycja', type: 'side', xp: 150, difficulty: 'medium', tags: ['faza1', 'list', 'wizja'] },
  { id: 'sq_root_06', title: 'Domknięcie EY na piśmie', description: 'Jedno zdanie zamknięcia 6 lat — dla siebie, nie dla LinkedIna.', pillar: 'kariera', type: 'side', xp: 200, difficulty: 'hard', tags: ['faza1', 'domknięcie', 'kariera'] },

  // === B. ŚWIAT DOCELOWY (premium, styl, aura) ===
  { id: 'sq_world_01', title: 'Garderoba: czystka 20%', description: 'Wyrzucasz/oddajesz 20% szafy. Zostaje tylko to, w czym czujesz się sobą premium.', pillar: 'styl', type: 'side', xp: 200, difficulty: 'hard', tags: ['świat docelowy', 'garderoba', 'edycja'] },
  { id: 'sq_world_02', title: 'Jedna rzecz inwestycyjna', description: 'Kupujesz jeden przedmiot dobrze, zamiast pięciu byle jak. Świadomie, nie impulsywnie.', pillar: 'styl', type: 'side', xp: 250, difficulty: 'hard', tags: ['świat docelowy', 'inwestycja', 'jakość'] },
  { id: 'sq_world_03', title: 'Sygnaturowy zapach', description: 'Wybierasz jeden zapach jako swój, nosisz go miesiąc, ludzie zaczynają go z Tobą kojarzyć.', pillar: 'styl', type: 'side', xp: 150, difficulty: 'medium', tags: ['świat docelowy', 'zapach', 'tożsamość'] },
  { id: 'sq_world_04', title: 'Kolacja u kogoś, kto gra wyżej', description: 'Jeden wieczór w towarzystwie, które Cię podciąga, nie wyrównuje w dół.', pillar: 'kapital', type: 'side', xp: 250, difficulty: 'hard', tags: ['świat docelowy', 'środowisko', 'tożsamość'] },
  { id: 'sq_world_05', title: 'Dom jako adres premium', description: 'Jedna strefa mieszkania doprowadzona do stanu, w którym chcesz tam zaprosić ludzi.', pillar: 'tozsamosc', type: 'side', xp: 200, difficulty: 'hard', tags: ['świat docelowy', 'dom', 'jakość'] },
  { id: 'sq_world_06', title: 'Stół, który umiesz nakryć', description: 'Raz ugościłaś tak, że to był poziom, nie improwizacja. Świeca, talerz, intencja.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['świat docelowy', 'gościnność'] },
  { id: 'sq_world_07', title: 'Kultura wysoka, na żywo', description: 'Opera, koncert, wystawa. Sama lub z kimś, ale realnie — nie "kiedyś".', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['świat docelowy', 'kultura'] },

  // === C. CIAŁO, ENERGIA, SOMATYKA ===
  { id: 'sq_body_01', title: 'Sześć tygodni szarf bez przerwy', description: 'Sześć kolejnych tygodni z treningiem szarf — łagodny tryb w okresie się liczy.', pillar: 'cialo', type: 'side', xp: 300, difficulty: 'hard', tags: ['somatyka', 'szarfy', 'konsekwencja'] },
  { id: 'sq_body_02', title: 'Mapa własnej energii', description: 'Dwa tygodnie notujesz energię 1-5 rano i wieczorem, wyciągasz wniosek: kiedy masz grunt.', pillar: 'cialo', type: 'side', xp: 200, difficulty: 'hard', tags: ['somatyka', 'energia', 'wnętrze'] },
  { id: 'sq_body_03', title: 'Tydzień snu o stałej godzinie', description: 'Siedem nocy, telefon poza sypialnią, ta sama godzina ±30 min.', pillar: 'cialo', type: 'side', xp: 150, difficulty: 'medium', tags: ['somatyka', 'sen'] },
  { id: 'sq_body_04', title: 'Pierwsze 90 dni mniej papierosów', description: 'Nie "rzucam", tylko: trzy miesiące danych, trend w dół względem czerwcowego baseline (14/dzień).', pillar: 'cialo', type: 'side', xp: 250, difficulty: 'hard', tags: ['somatyka', 'papierosy', 'dane'] },
  { id: 'sq_body_05', title: 'Forest bathing, naprawdę', description: 'Jeden dzień: 3+ godziny w naturze, offline. Dzień Zakorzenienia spłacony porządnie.', pillar: 'cialo', type: 'side', xp: 150, difficulty: 'medium', tags: ['somatyka', 'natura', 'wnętrze'] },
  { id: 'sq_body_06', title: 'Polyvagal toolkit na pamięć', description: 'Umiesz z głowy trzy narzędzia (oddech wydłużony, zimna woda, humming) i użyłaś ich pod presją.', pillar: 'cialo', type: 'side', xp: 100, difficulty: 'easy', tags: ['somatyka', 'regulacja', 'wnętrze'] },
  { id: 'sq_body_07', title: 'Jedno nowe ciało', description: 'Próbujesz jednej nowej aktywności fizycznej, której nigdy nie robiłaś. Bo ciało lubi nowość.', pillar: 'cialo', type: 'side', xp: 200, difficulty: 'hard', tags: ['somatyka', 'nowość'] },

  // === D. MIŁOŚĆ I STANDARD ===
  { id: 'sq_love_01', title: 'Lista czerwonych flag, własna', description: 'Spisujesz konkretnie, nie ogólnikami. Po imieniu, z przykładami z życia.', pillar: 'milosc', type: 'side', xp: 200, difficulty: 'hard', tags: ['standard', 'czerwone flagi'] },
  { id: 'sq_love_02', title: 'Lista tego, na co zasługujesz', description: 'Druga strona kartki. Nie "miły" — konkret: jak ktoś się zachowuje, gdy Cię szanuje.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['standard', 'wartość'] },
  { id: 'sq_love_03', title: 'Pierwsza randka bez negocjowania siebie', description: 'Wychodzisz, jesteś sobą, nie zmniejszasz się żeby ktoś został. Wynik randki bez znaczenia.', pillar: 'milosc', type: 'side', xp: 300, difficulty: 'hard', tags: ['standard', 'randka', 'odwaga'] },
  { id: 'sq_love_04', title: 'Wieczór solo, który był randką z sobą', description: 'Jeden wieczór zaprojektowany dla siebie tak, jakbyś chciała zaimponować osobie, na której Ci zależy.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['standard', 'self-love', 'wnętrze'] },
  { id: 'sq_love_05', title: 'Test "prowadzi czy się kręci", 7 dni', description: 'Tydzień świadomego stosowania prawdy nr 10, z notatką ile razy przerwałaś kręcenie.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['standard', 'świadomość', 'wnętrze'] },

  // === E. WILDCARDY (mocno losowe, wybijają z koleiny) ===
  { id: 'sq_wild_01', title: 'Dzień bez planu', description: 'Jeden dzień całkowicie bez harmonogramu, questów, optymalizacji. Sprawdzasz, czy świat się nie zawalił.', pillar: 'tozsamosc', type: 'side', xp: 200, difficulty: 'hard', tags: ['wildcard', 'antyoptymalizacja'] },
  { id: 'sq_wild_02', title: 'Naucz się czegoś bezużytecznego', description: 'Jedna umiejętność bez ROI: tasowanie kart, gwizd na palcach, węzeł żeglarski. Dla samej radości.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['wildcard', 'dla radości'] },
  { id: 'sq_wild_03', title: 'Napisz do kogoś z przeszłości (nie do niego)', description: 'Odzywasz się do dawnego przyjaciela/mentorki — kontakt, który zgubiłaś, nie ten, który Cię ranił.', pillar: 'kapital', type: 'side', xp: 150, difficulty: 'medium', tags: ['wildcard', 'relacje'] },
  { id: 'sq_wild_04', title: 'Solo w nowym mieście na 24h', description: 'Wyjazd w pojedynkę, dokąd nigdy nie byłaś, jedna doba. Zakorzenienie w sobie, nie w miejscu.', pillar: 'tozsamosc', type: 'side', xp: 400, difficulty: 'hard', tags: ['wildcard', 'podróż', 'odwaga'] },
  { id: 'sq_wild_05', title: 'Coś zrobionego brzydko i skończonego', description: 'Jedna rzecz zrobiona byle jak, ale DOMKNIĘTA. Antidotum na perfekcjonizm.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['wildcard', 'antyperfekcjonizm', 'wnętrze'] },
  { id: 'sq_wild_06', title: 'Komplement dla obcej osoby', description: 'Mówisz szczerze coś miłego komuś nieznajomemu. Bez agendy. Sprawdzasz, jak to jest dawać.', pillar: 'kapital', type: 'side', xp: 80, difficulty: 'easy', tags: ['wildcard', 'dawanie'] },
  { id: 'sq_wild_07', title: '24h cyfrowego postu', description: 'Doba bez social mediów. Żeby zobaczyć, ile z "tęsknoty" to dopamina, a ile to Ty.', pillar: 'pozycja', type: 'side', xp: 200, difficulty: 'hard', tags: ['wildcard', 'detoks', 'ciało'] },
  { id: 'sq_wild_08', title: 'Naucz kogoś szarf', description: 'Pokazujesz komuś podstawy. Moment, w którym z uczennicy stajesz się tą, która umie.', pillar: 'cialo', type: 'side', xp: 250, difficulty: 'hard', tags: ['wildcard', 'szarfy', 'mentoring'] },

  // === F. PARLOR TRICKS (umiesz + pokazałaś komuś na żywo) ===
  { id: 'sq_trick_01', title: 'Tasowanie kart jak krupier', description: 'Riffle shuffle z mostkiem, pokazane przy grze w karty.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'karty'] },
  { id: 'sq_trick_02', title: 'Jeden trik karciany', description: 'Znajdujesz wybraną kartę, ktoś zrobił "jak?!".', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'karty'] },
  { id: 'sq_trick_03', title: 'Jeden ruch z breakdance', description: 'Baby freeze albo six-step. Pokazany. XD jest częścią zaliczenia.', pillar: 'cialo', type: 'side', xp: 250, difficulty: 'hard', tags: ['parlor trick', 'breakdance'] },
  { id: 'sq_trick_04', title: 'Gwizdanie na palcach', description: 'Jeden głośny gwizd na palcach, na zawołanie.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'gwizd'] },
  { id: 'sq_trick_05', title: 'Żonglowanie trzema', description: 'Trzy piłki, pięć rzutów bez upuszczenia, przy ludziach.', pillar: 'cialo', type: 'side', xp: 200, difficulty: 'hard', tags: ['parlor trick', 'żonglerka'] },
  { id: 'sq_trick_06', title: 'Kostka Rubika', description: 'Ułożona od zera — czas bez znaczenia, ale na oczach kogoś.', pillar: 'tozsamosc', type: 'side', xp: 250, difficulty: 'hard', tags: ['parlor trick', 'kostka'] },
  { id: 'sq_trick_07', title: 'Knuckle roll monetą', description: 'Przetaczasz monetę po kostkach jednej dłoni, płynnie.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'moneta'] },
  { id: 'sq_trick_08', title: 'Otwieranie butelki bez otwieracza', description: 'Butelka otwarta zapalniczką/łyżką/blatem — z gracją, nie z paniką.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'butelka'] },
  { id: 'sq_trick_09', title: 'Latte art, jedno serce', description: 'Jedno rozpoznawalne serce w kawie, ktoś dostał i zobaczył.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'latte art'] },
  { id: 'sq_trick_10', title: 'Salsa albo bachata, basic prowadzony', description: 'Jeden taniec przetańczony w parze, prowadzona, bez liczenia w głowie.', pillar: 'cialo', type: 'side', xp: 250, difficulty: 'hard', tags: ['parlor trick', 'taniec', 'miłość'] },
  { id: 'sq_trick_11', title: 'Jeden wiersz z pamięci', description: 'Recytujesz cały, przy stole, bez ściągi. Klasa instant.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'wiersz'] },
  { id: 'sq_trick_12', title: 'Origami żuraw z pamięci', description: 'Składasz żurawia bez instrukcji, dajesz komuś.', pillar: 'tozsamosc', type: 'side', xp: 100, difficulty: 'easy', tags: ['parlor trick', 'origami'] },
  { id: 'sq_trick_13', title: 'Memory palace, 20 rzeczy', description: 'Zapamiętujesz 20 słów po jednym czytaniu, ktoś sprawdza listę.', pillar: 'pozycja', type: 'side', xp: 200, difficulty: 'hard', tags: ['parlor trick', 'pamięć', 'tożsamość'] },
  { id: 'sq_trick_14', title: 'Jedna piosenka opanowana perfekcyjnie', description: 'Karaoke/przy gitarze — jedna, ale tak, że ludzie milkną.', pillar: 'tozsamosc', type: 'side', xp: 200, difficulty: 'hard', tags: ['parlor trick', 'śpiew'] },
  { id: 'sq_trick_15', title: 'Handstand przy ścianie', description: 'Stoisz na rękach 10 sekund przy ścianie. Ciało już to udźwignie.', pillar: 'cialo', type: 'side', xp: 250, difficulty: 'hard', tags: ['parlor trick', 'handstand'] },
  { id: 'sq_trick_16', title: 'Moonwalk, trzy kroki', description: 'Trzy czyste kroki, pokazane spontanicznie.', pillar: 'cialo', type: 'side', xp: 200, difficulty: 'hard', tags: ['parlor trick', 'moonwalk'] },
  { id: 'sq_trick_17', title: 'Cold reading na żarty', description: '"Czytasz z ręki" obcej osobie na imprezie, ona kupuje, Ty puszczasz oko.', pillar: 'kapital', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'cold reading'] },
  { id: 'sq_trick_18', title: 'Idealny omlet francuski', description: 'Zwinięty, kremowy, bez przypalenia — ktoś zjadł i zapamiętał.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'omlet'] },
  { id: 'sq_trick_19', title: 'Beatbox, jeden basic', description: 'Kick-hat-snare w pętli, pokazane na zawołanie.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'beatbox'] },
  { id: 'sq_trick_20', title: 'Jedno zdanie w trzecim języku', description: 'Poza polskim i angielskim: hiszpański (masz Duolingo), z akcentem, w rozmowie.', pillar: 'tozsamosc', type: 'side', xp: 150, difficulty: 'medium', tags: ['parlor trick', 'język'] },
]

export const DAILY_QUESTS_POOL: Quest[] = [
  { id: 'dq_1', title: 'Napisz 3 rzeczy, za które jesteś wdzięczna', description: 'Konkretne, dzisiejsze. Nie ogólnikowe.', pillar: 'pozycja', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_2', title: 'Jeden krok w karierze', description: 'E-mail, aplikacja, rozmowa, research. Jeden konkretny krok do przodu.', pillar: 'kariera', type: 'daily', xp: 50, difficulty: 'medium' },
  { id: 'dq_3', title: 'Zadbaj o siebie szczególnie', description: 'Coś ponadstandardowego dla ciała — maseczka, stretching, długi prysznic, perfumy.', pillar: 'cialo', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_4', title: 'Naucz się czegoś nowego', description: 'Słowo w języku obcym, ciekawostka historyczna, nowe zagadnienie zawodowe.', pillar: 'tozsamosc', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_5', title: 'Odezwij się do kogoś wartościowego', description: 'Krótka, ciepła wiadomość do osoby, której chcesz więcej w swoim życiu.', pillar: 'kapital', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_6', title: 'Chwila tylko dla ciebie', description: 'Minimum 15 minut bez obowiązków, bez telefonu. Kawa, spacer, książka.', pillar: 'pozycja', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_7', title: 'Ogranicz wydatki nieplanowane', description: 'Dziś zero nieplanowanych zakupów. Jeśli coś chcesz kupić, zapisz i wróć do tematu jutro.', pillar: 'kariera', type: 'daily', xp: 50, difficulty: 'medium' },
  { id: 'dq_8', title: 'Styl ponad komfort', description: 'Ubierz się lepiej niż "wystarczy". Nawet do domu. Poczuj różnicę.', pillar: 'styl', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_9', title: 'Wyraź swoją opinię', description: 'W rozmowie, wiadomości, komentarzu — powiedz co naprawdę myślisz, z klasą.', pillar: 'milosc', type: 'daily', xp: 50, difficulty: 'medium' },
  { id: 'dq_10', title: 'Zrób jeden krok, którego się boisz', description: 'Mały. Ale realny. Jeden odważny ruch dziś.', pillar: 'pozycja', type: 'daily', xp: 50, difficulty: 'hard' },
]

// Próg XP oddzielający szybkie codzienne questy od wielkich życiowych wyzwań
export const EPIC_XP_THRESHOLD = 200

export type QuestScale = 'all' | 'quick' | 'epic'

export interface SideQuestFilter {
  pillar?: Pillar | null
  scale?: QuestScale
  /** Id-ki ukryte przez użytkowniczkę (useHiddenSideQuests) — wypadają z puli. */
  hiddenIds?: string[]
}

function filterPool(filter: SideQuestFilter): Quest[] {
  const { pillar = null, scale = 'all', hiddenIds } = filter
  let pool = SIDE_QUESTS
  if (hiddenIds && hiddenIds.length > 0) pool = pool.filter(q => !hiddenIds.includes(q.id))
  if (pillar) pool = pool.filter(q => q.pillar === pillar)
  if (scale === 'quick') pool = pool.filter(q => q.xp < EPIC_XP_THRESHOLD)
  else if (scale === 'epic') pool = pool.filter(q => q.xp >= EPIC_XP_THRESHOLD)
  return pool
}

// Ile questów pasuje do danego filtra (do podpowiedzi w UI)
export function countSideQuests(filter: SideQuestFilter = {}): number {
  return filterPool(filter).length
}

export function getRandomSideQuest(excludeIds: string[] = [], filter: SideQuestFilter = {}): Quest | null {
  const pool = filterPool(filter)
  if (pool.length === 0) return null
  const available = pool.filter(q => !excludeIds.includes(q.id))
  // Jeśli wszystko w tym filtrze już zrobione dziś — pozwól na powtórkę w obrębie filtra
  const source = available.length > 0 ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}

export function getDailyQuests(dateKey: string): Quest[] {
  // Deterministic daily quests based on date — same quests all day, different each day
  const pool = [...DAILY_QUESTS_POOL]
  const shuffled = pool.sort((a, b) => {
    const ha = hashCode(a.id + dateKey)
    const hb = hashCode(b.id + dateKey)
    return ha - hb
  })
  return shuffled.slice(0, 3)
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

export function getDailySpark(dateKey: string): string {
  const { DAILY_SPARKS, PINNED_SPARKS } = require('./routineData')
  if (PINNED_SPARKS[dateKey]) return PINNED_SPARKS[dateKey]
  const seed = dateKey.split('-').reduce((acc: number, n: string) => acc + parseInt(n), 0)
  return DAILY_SPARKS[seed % DAILY_SPARKS.length]
}
