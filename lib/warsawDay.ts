// Klucz dnia po stronie SERWERA. Musi pasować do klienta (lib/gameLogic.todayKey):
// strefa Europe/Warsaw + dzień zaczynający się o 3:00. Serwery Vercela chodzą
// w UTC, więc gołe `new Date()` wpisywałoby nocne zdarzenia do złego dnia —
// datę warszawską liczymy przez Intl, niezależnie od strefy maszyny.

const DAY_START_HOUR = 3

export function warsawDayKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value)
  let y = get('year'), m = get('month'), d = get('day')
  if (get('hour') < DAY_START_HOUR) {
    const shifted = new Date(Date.UTC(y, m - 1, d))
    shifted.setUTCDate(shifted.getUTCDate() - 1)
    y = shifted.getUTCFullYear(); m = shifted.getUTCMonth() + 1; d = shifted.getUTCDate()
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
