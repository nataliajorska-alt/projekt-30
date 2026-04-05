import type { Quest } from '@/types'

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
  { id: 'sq_mil_2', title: 'Dzień bez sprawdzania jego profilu', description: 'Pełny dzień bez zaglądania na profile byłego. Jeśli masz go wyciszonego — dodatkowe 20 XP.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'hard', tags: ['wolność', 'godność'] },
  { id: 'sq_mil_3', title: 'Co chcę czuć w relacji?', description: 'Napisz jak chcesz się czuć przy partnerze. Nie co chcesz robić — jak chcesz się CZUĆ. Bezpiecznie, widziana, pożądana...', pillar: 'milosc', type: 'side', xp: 120, difficulty: 'medium', tags: ['emocje', 'wizja'] },
  { id: 'sq_mil_4', title: 'Zrób coś romantycznego dla siebie', description: 'Kolacja dla siebie, kwiaty, perfumy, ulubiony deser. Udowodnij sobie, że nie potrzebujesz drugiej osoby, żeby być traktowana pięknie.', pillar: 'milosc', type: 'side', xp: 120, difficulty: 'easy', tags: ['self-love', 'rytuał'] },
  { id: 'sq_mil_5', title: 'Wyjdź tam gdzie mogą być ciekawi ludzie', description: 'Kawiarnia, event, zajęcia. Wyjdź, wyglądaj pięknie, bądź sobą. Nie z celem — z otwartością.', pillar: 'milosc', type: 'side', xp: 150, difficulty: 'hard', tags: ['obecność', 'otwartość'] },
]

export const DAILY_QUESTS_POOL: Quest[] = [
  { id: 'dq_1', title: 'Napisz 3 rzeczy, za które jesteś wdzięczna', description: 'Konkretne, dzisiejsze. Nie ogólnikowe.', pillar: 'pozycja', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_2', title: 'Jeden krok w karierze', description: 'E-mail, aplikacja, rozmowa, research. Jeden konkretny krok do przodu.', pillar: 'kariera', type: 'daily', xp: 50, difficulty: 'medium' },
  { id: 'dq_3', title: 'Zadbaj o siebie szczególnie', description: 'Coś ponadstandardowego dla ciała — maseczka, stretching, długi prysznic, perfumy.', pillar: 'cialo', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_4', title: 'Naucz się czegoś nowego', description: 'Słowo w języku obcym, ciekawostka historyczna, nowe zagadnienie zawodowe.', pillar: 'tozsamosc', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_5', title: 'Odezwij się do kogoś wartościowego', description: 'Krótka, ciepła wiadomość do osoby, której chcesz więcej w swoim życiu.', pillar: 'kapital', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_6', title: 'Chwila tylko dla ciebie', description: 'Minimum 15 minut bez obowiązków, bez telefonu. Kawa, spacer, książka.', pillar: 'pozycja', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_7', title: 'Ogranicz wydatki nieplanowane', description: 'Dziś zero nieplansowych zakupów. Jeśli coś chcesz kupić, zapisz i wróć do tematu jutro.', pillar: 'kariera', type: 'daily', xp: 50, difficulty: 'medium' },
  { id: 'dq_8', title: 'Styl ponad komfort', description: 'Ubierz się lepiej niż "wystarczy". Nawet do domu. Poczuj różnicę.', pillar: 'styl', type: 'daily', xp: 50, difficulty: 'easy' },
  { id: 'dq_9', title: 'Wyraź swoją opinię', description: 'W rozmowie, wiadomości, komentarzu — powiedz co naprawdę myślisz, z klasą.', pillar: 'milosc', type: 'daily', xp: 50, difficulty: 'medium' },
  { id: 'dq_10', title: 'Zrób jeden krok, którego się boisz', description: 'Mały. Ale realny. Jeden odważny ruch dziś.', pillar: 'pozycja', type: 'daily', xp: 50, difficulty: 'hard' },
]

export function getRandomSideQuest(excludeIds: string[] = []): Quest {
  const available = SIDE_QUESTS.filter(q => !excludeIds.includes(q.id))
  if (available.length === 0) return SIDE_QUESTS[Math.floor(Math.random() * SIDE_QUESTS.length)]
  return available[Math.floor(Math.random() * available.length)]
}

export function getDailyQuests(dateKey: string): Quest[] {
  // Deterministic daily quests based on date — same quests all day, different each day
  const seed = dateKey.split('-').reduce((acc, n) => acc + parseInt(n), 0)
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
  const { DAILY_SPARKS } = require('./routineData')
  const seed = dateKey.split('-').reduce((acc: number, n: string) => acc + parseInt(n), 0)
  return DAILY_SPARKS[seed % DAILY_SPARKS.length]
}
