export interface RedirectQuest {
  id: string
  title: string
  description: string
  xp: number
}

export const REDIRECT_QUESTS: RedirectQuest[] = [
  {
    id: 'rq_01',
    title: 'Napisz do przyjaciółki',
    description: 'Do kogoś, z kim dawno nie gadałaś. Jedno zdanie wystarczy.',
    xp: 30,
  },
  {
    id: 'rq_02',
    title: 'Zarezerwuj stolik',
    description: 'Sama lub z kimś. Miejsce, gdzie chcesz być widoczna i dobrze ubrana.',
    xp: 40,
  },
  {
    id: 'rq_03',
    title: 'Kup coś małego tylko dla siebie',
    description: 'Kwiatek, świeczka, kawa w ładnym miejscu. Żaden powód nie jest potrzebny.',
    xp: 30,
  },
  {
    id: 'rq_04',
    title: 'Idź tam, gdzie się dobrze ubierasz',
    description: 'Muzeum, galeria, kawiarnia na mieście. Nie pijamas, nie kanapa.',
    xp: 35,
  },
  {
    id: 'rq_05',
    title: 'Napisz sobie komplementa',
    description: 'Trzy rzeczy, które lubisz w sobie dzisiaj. Na papierze, nie w głowie.',
    xp: 25,
  },
  {
    id: 'rq_06',
    title: 'Zrób coś tylko dla przyjemności',
    description: 'Serial, kąpiel, zapach, muzyka. Nic produktywnego. Po prostu przyjemność.',
    xp: 25,
  },
  {
    id: 'rq_07',
    title: 'Zadzwoń do kogoś bliskiego',
    description: 'Nie wiadomość — głos. Mama, siostra, przyjaciółka.',
    xp: 35,
  },
  {
    id: 'rq_08',
    title: 'Zaplanuj coś na siebie',
    description: 'Fryzjer, masaż, obiad w nowym miejscu. Coś czego możesz się jutro nie doczekać.',
    xp: 30,
  },
  {
    id: 'rq_09',
    title: 'Ubierz się tak jak lubisz',
    description: 'Nie wygodnie. Tak jak czujesz, że wyglądasz dobrze. Nawet w domu.',
    xp: 20,
  },
  {
    id: 'rq_10',
    title: 'Wyjdź na spacer bez telefonu',
    description: 'Albo z muzyką, której on nie zna. Twoja przestrzeń, twój rytm.',
    xp: 30,
  },
  {
    id: 'rq_11',
    title: 'Zrób coś po raz pierwszy',
    description: 'Nowa kawiarnia, nowa trasa, nowy przepis. Cokolwiek, czego jeszcze nie próbowałaś.',
    xp: 40,
  },
  {
    id: 'rq_12',
    title: 'Wyślij komuś miłą wiadomość',
    description: 'Nie jemu. Komuś kto na to zasługuje i się nie spodziewa.',
    xp: 25,
  },
  {
    id: 'rq_13',
    title: 'Stwórz playlistę na ten nastrój',
    description: 'Muzykę, która mówi co czujesz — ale prowadzi gdzie chcesz iść.',
    xp: 20,
  },
  {
    id: 'rq_14',
    title: 'Zamów coś co lubisz',
    description: 'Jedzenie, kwiatek, książkę. Mały gest troski do siebie.',
    xp: 25,
  },
  {
    id: 'rq_15',
    title: 'Napisz list do przyszłej siebie',
    description: 'Dwa zdania. Co czujesz teraz i czego chcesz dla siebie za rok.',
    xp: 35,
  },
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return hash
}

// Miksowanie hasha pozycji z hashem dnia (FNV-style avalanche).
// WAŻNE: wcześniej sortowano po hashCode(id + dateKey). Ponieważ dateKey był
// sufiksem o stałej długości, jego wkład sprowadzał się do tej samej stałej
// dla wszystkich pozycji — kolejność praktycznie się nie zmieniała i codziennie
// wychodził ten sam zestaw 4 questów. Tu dzień realnie przetasowuje pulę.
function mixSeed(itemHash: number, dayHash: number): number {
  let h = 0x811c9dc5 | 0
  for (const v of [itemHash & 0xffff, (itemHash >>> 16) & 0xffff, dayHash & 0xffff, (dayHash >>> 16) & 0xffff]) {
    h = Math.imul(h ^ v, 0x01000193)
  }
  return h | 0
}

export function getDailyRedirectQuests(dateKey: string, count = 4): RedirectQuest[] {
  const dayHash = hashCode(dateKey)
  return [...REDIRECT_QUESTS]
    .map(q => ({ q, score: mixSeed(hashCode(q.id), dayHash) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map(x => x.q)
}
