import type { RoutineItem, RoutineItemCategory, MinimumDayReason } from '@/types'

// Categories shown per reason (in addition to always-shown 'essential')
const ALLOWED_CATEGORIES: Record<MinimumDayReason, RoutineItemCategory[]> = {
  choroba:      ['hygiene', 'spiritual'],
  okres:        ['hygiene', 'spiritual'],
  zly_nastroj:  ['hygiene', 'spiritual', 'mental'],
  przemeczenie: ['hygiene'],
  inne:         [],
}

export function filterItemsForMinimumDay(
  items: RoutineItem[],
  reason: MinimumDayReason,
): RoutineItem[] {
  const allowed = ALLOWED_CATEGORIES[reason]
  return items.filter(item => {
    if (item.priority === 'bonus') return false
    if (item.priority === 'essential') return true
    return allowed.includes(item.category ?? 'mental')
  })
}
