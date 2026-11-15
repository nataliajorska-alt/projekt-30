'use client'
import { useGameData } from '@/hooks/useGameData'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { useQuestBook } from '@/hooks/useMonthPlans'
import { getTodayWeeklyHabits, getWeeklyStudyItem, DAILY_RULES } from '@/lib/routineData'
import { getPhaseForDate } from '@/lib/cycle-data'
import { getPillar } from '@/lib/pillars'
import { dailyCigaretteCounts, rollingAverage, shiftDateKey, ceilingFor, daysUntilQuit } from '@/lib/smokeStats'
import { tomorrowDate, tomorrowKey, todayKey, getDaysElapsed, getEffectiveNow } from '@/lib/gameLogic'
import { SMOKING_PHASE_META } from '@/types'
import { buildTomorrowBriefing, type BriefingInput } from '@/lib/tomorrowBriefing'

// Ile dni wstecz (łącznie z dziś) liczymy średnią energii/nastroju do briefu.
const MOOD_LOOKBACK_DAYS = 7

/**
 * Brief dnia z danych apki: rutyna, questy, zasady, faza cyklu, energia, papierosy.
 * Zwraca funkcję, bo brief „na dziś" zawiera bieżącą godzinę — składamy go
 * w chwili kliknięcia, nie przy renderze.
 *
 * 'tomorrow' — plan na jutro (widok „Jutro"); 'today' — plan reszty dzisiejszego dnia.
 */
export function useBriefingBuilder(variant: 'today' | 'tomorrow') {
  const { stats } = useGameData()
  const { logs } = useTimelineData()
  const { getEffectiveItems } = useRoutineConfig()
  const { log: questLog, skippedIds } = useAprilQuests()
  const { logs: cycleLogs } = useCycleData()
  const { settings: cycleSettings } = useCycleSettings()
  const { book } = useQuestBook()
  const isToday = variant === 'today'

  return (calendar?: string[]): string => {
    // Dzień docelowy briefu: dziś (od teraz) albo jutro.
    const targetDate = isToday ? getEffectiveNow() : tomorrowDate()
    const targetDateKey = isToday ? todayKey() : tomorrowKey()
    const dow = targetDate.getDay()
    const isWeekday = dow >= 1 && dow <= 5

    // Rutyna — ta sama logika co TomorrowChecklist
    const weeklyTarget = getTodayWeeklyHabits(targetDate)
    const studyItem = getWeeklyStudyItem(targetDate)
    const extraDaily = [...weeklyTarget, ...([1, 3, 5].includes(dow) ? [studyItem] : [])]
    const dailyItems = isWeekday
      ? getEffectiveItems('daily', false, extraDaily)
      : [...extraDaily, ...getEffectiveItems('daily', false).filter(i => i.id.startsWith('custom_'))]

    // Questy — ta sama logika co TomorrowQuests
    const native = book.questsForDate(targetDateKey)
    const postponedToTarget = book.postponedForDate(targetDateKey, questLog.postponed)
    const postponedAwayIds = questLog.postponed
      .filter(p => p.targetDate > targetDateKey)
      .map(p => p.questId)
    const quests = [
      ...native.filter(q => !postponedAwayIds.includes(q.id)),
      ...postponedToTarget.filter(q => !native.some(n => n.id === q.id)),
    ].filter(q => !skippedIds.includes(q.id))

    // Cykl — faza na datę docelową
    const cycleInfo = cycleLogs.length > 0
      ? getPhaseForDate(cycleLogs[0].startDate, targetDateKey, cycleSettings)
      : null

    // Nastrój/energia z ostatnich dni
    const today = todayKey()
    let eSum = 0, mSum = 0, n = 0
    const daysSeen = new Set<string>()
    for (let i = 0; i < MOOD_LOOKBACK_DAYS; i++) {
      const dk = shiftDateKey(today, -i)
      for (const ci of logs[dk]?.moodCheckIns ?? []) {
        eSum += ci.energy; mSum += ci.mood; n++
        daysSeen.add(dk)
      }
    }

    // Papierosy — faza + średnia krocząca + sufit miesięczny + dni do linii.
    // Sufit i odliczanie kotwiczą do DNIA DOCELOWEGO (plan na dziś/jutro), nie do „today";
    // avg7 zostaje na „today" — to statystyka wsteczna z ostatnich 7 dni.
    const phase = stats.cigarettesPhase ?? 1
    const phaseMeta = SMOKING_PHASE_META[phase]
    const avg7 = rollingAverage(dailyCigaretteCounts(logs), today, 7)
    const smokeCeiling = ceilingFor(targetDateKey)?.ceiling ?? null
    const smokeDaysToLine = daysUntilQuit(targetDateKey)

    const input: BriefingInput = {
      target: variant,
      nowLabel: isToday
        ? getEffectiveNow().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
        : null,
      dateLabel: targetDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      dayOfProject: Math.max(1, getDaysElapsed() + (isToday ? 1 : 2)),
      routineSections: [
        { label: 'Rutyna poranna', items: getEffectiveItems('morning', false).map(i => i.text) },
        { label: 'W ciągu dnia', items: dailyItems.map(i => i.text) },
        { label: 'Rutyna wieczorna', items: getEffectiveItems('evening', false).map(i => i.text) },
      ],
      quests: quests.map(q => ({
        title: q.title,
        description: q.description,
        pillar: getPillar(q.pillar).shortName,
      })),
      rules: DAILY_RULES.map(r => r.text),
      cycle: cycleInfo ? {
        phaseName: cycleInfo.phase.name,
        cycleDay: cycleInfo.cycleDay,
        energy: cycleInfo.phase.energy,
        description: cycleInfo.phase.description,
        tips: cycleInfo.phase.tips,
        suggestMinimum: cycleInfo.phase.suggestMinimum,
      } : null,
      mood: {
        daysWithData: daysSeen.size,
        avgEnergy: n > 0 ? Math.round((eSum / n) * 10) / 10 : null,
        avgMood: n > 0 ? Math.round((mSum / n) * 10) / 10 : null,
      },
      currentStreak: stats.currentStreak ?? 0,
      smoking: { phaseLabel: phaseMeta.label, softTarget: phaseMeta.softTarget, avg7days: avg7, ceiling: smokeCeiling, daysToLine: smokeDaysToLine },
      calendar,
    }

    return buildTomorrowBriefing(input)
  }
}
