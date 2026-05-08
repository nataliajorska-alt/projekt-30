// Wspólne helpery używane przez kilka komponentów review.

const PL_MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']
export const PL_MONTH_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']

export function formatMonthPL(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${PL_MONTH_NAMES[m - 1]} ${y}`
}

export function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startMonth = PL_MONTH_SHORT[start.getMonth()]
  const endMonth = PL_MONTH_SHORT[end.getMonth()]
  if (startMonth === endMonth) return `${start.getDate()}–${end.getDate()} ${startMonth}`
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`
}
