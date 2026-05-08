// Pule promptów do Skarbca, dobrane do emocjonalnego stanu danego typu listu.
// Future ma najszerszą pulę (wspólne pytania + dedykowane).
import type { LetterType } from '@/types'

const FUTURE_PROMPTS = [
  'O czym dziś jesteś dumna, a za rok pomyślisz "pfff to nic"?',
  'Co dziś próbujesz, a jeszcze nie umiesz?',
  'Co Cię dziś rozczarowało, czego nauczyłaś się jutro?',
  'Komu dziś zazdrościsz i czego konkretnie?',
  'Co dziś czujesz, ale nie powiedziałabyś nikomu na głos?',
  'Jaka rozmowa dziś nie odbyła się, choć powinna?',
  'Czego się boisz, że nie da się odzyskać?',
  'Jakiej wersji siebie najbardziej dziś nie chcesz pamiętać?',
  'Co dziś zrobiłaś z miłości do siebie, a nie z lęku?',
  'Gdyby Natalia 30 mogła Ci dziś coś szepnąć — co by to było?',
]

const CRISIS_PROMPTS = [
  'Napisz do siebie z trudnej chwili — co chciałabyś usłyszeć, gdy będzie najgorzej?',
  'Co już raz przeszłaś i przetrwałaś? Przypomnij sobie tamto.',
  'Gdy będziesz to czytać — będziesz w innej skórze niż teraz. Co chcesz, żeby tamta Ty pamiętała?',
  'Jaka prawda o Tobie jest większa niż ten ból?',
  'Co byś powiedziała przyjaciółce w tej sytuacji? Powiedz to sobie.',
  'Wymień 3 rzeczy które dziś wiesz na pewno o sobie, niezależnie od emocji.',
]

const GRATITUDE_PROMPTS = [
  'Za co dziś, dokładnie dziś, jesteś wdzięczna?',
  'Kogo dziś chciałabyś podziękować — i za co konkretnie?',
  'Jaka mała rzecz dziś sprawiła, że uśmiechnęłaś się nie z grzeczności?',
  'Co dziś dostałaś od życia, czego nie zaplanowałaś?',
  'Jaka decyzja sprzed roku, miesiąca, tygodnia — dziś procentuje?',
]

const VENT_PROMPTS = [
  'Wypuść wszystko. To nie zostanie zapisane. Pisz aż się wyczerpie.',
  'Co Cię dziś wkurza tak, że nie chcesz tego mówić nikomu?',
  'Komu chciałabyś dziś powiedzieć "wystarczy"?',
  'Napisz list do osoby która Cię zraniła — list którego nigdy nie wyślesz.',
  'Co dziś czujesz, gdy przestaniesz udawać że jest okej?',
]

const DATE_PROMPTS = [
  'Co chcesz, żeby Twoja przyszła Ty pamiętała o dziś?',
  'Jaka jesteś w momencie pisania — opisz siebie tak, żeby tamta Ty się rozpoznała.',
  'Co dziś było prawdą, a za rok może już nie będzie?',
  'Co chciałabyś, żeby się zmieniło do dnia, w którym ten list otworzysz?',
  'Co Ci się dziś marzy o tej dacie? Jak ma wyglądać tamten dzień?',
]

const POOLS: Record<LetterType, string[]> = {
  future:    FUTURE_PROMPTS,
  crisis:    CRISIS_PROMPTS,
  gratitude: GRATITUDE_PROMPTS,
  vent:      VENT_PROMPTS,
  date:      DATE_PROMPTS,
}

export function getRandomPrompt(type: LetterType, exclude?: string): string {
  const pool = POOLS[type]
  if (pool.length === 0) return ''
  if (pool.length === 1 || !exclude) return pool[Math.floor(Math.random() * pool.length)]
  // Próbuj nie powtarzać tego samego co user właśnie odrzucił.
  let attempts = 0
  let pick = pool[Math.floor(Math.random() * pool.length)]
  while (pick === exclude && attempts < 5) {
    pick = pool[Math.floor(Math.random() * pool.length)]
    attempts++
  }
  return pick
}

export function getPromptsForType(type: LetterType): readonly string[] {
  return POOLS[type]
}
