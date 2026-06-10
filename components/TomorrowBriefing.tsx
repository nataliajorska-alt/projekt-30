'use client'
import { useState } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { useAprilQuests } from '@/hooks/useAprilQuests'
import { useCycleData } from '@/hooks/useCycleData'
import { useCycleSettings } from '@/hooks/useCycleSettings'
import { getAprilQuestsForDate, getPostponedQuestsForDate } from '@/lib/seasonal/aprilData'
import { getTodayWeeklyHabits, getWeeklyStudyItem, DAILY_RULES } from '@/lib/routineData'
import { getPhaseForDate } from '@/lib/cycle-data'
import { getPillar } from '@/lib/pillars'
import { dailyCigaretteCounts, rollingAverage, shiftDateKey } from '@/lib/smokeStats'
import { tomorrowDate, tomorrowKey, todayKey, getDaysElapsed } from '@/lib/gameLogic'
import { SMOKING_PHASE_META } from '@/types'
import { buildTomorrowBriefing, type BriefingInput } from '@/lib/tomorrowBriefing'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'
import { Copy, Share2, Check } from 'lucide-react'

// Ile dni wstecz (łącznie z dziś) liczymy średnią energii/nastroju do briefu.
const MOOD_LOOKBACK_DAYS = 7

export default function TomorrowBriefing() {
  const { stats } = useGameData()
  const { logs } = useTimelineData()
  const { getEffectiveItems } = useRoutineConfig()
  const { log: questLog, skippedIds } = useAprilQuests()
  const { logs: cycleLogs } = useCycleData()
  const { settings: cycleSettings } = useCycleSettings()
  const [copied, setCopied] = useState(false)

  const buildBriefing = (): string => {
    const tomorrow = tomorrowDate()
    const tomorrowDateKey = tomorrowKey()
    const dow = tomorrow.getDay()
    const isWeekday = dow >= 1 && dow <= 5

    // Rutyna — ta sama logika co TomorrowChecklist
    const weeklyTomorrow = getTodayWeeklyHabits(tomorrow)
    const studyItem = getWeeklyStudyItem(tomorrow)
    const extraDaily = [...weeklyTomorrow, ...([1, 3, 5].includes(dow) ? [studyItem] : [])]
    const dailyItems = isWeekday
      ? getEffectiveItems('daily', false, extraDaily)
      : [...extraDaily, ...getEffectiveItems('daily', false).filter(i => i.id.startsWith('custom_'))]

    // Questy na jutro — ta sama logika co TomorrowQuests
    const native = getAprilQuestsForDate(tomorrowDateKey)
    const postponedToTomorrow = getPostponedQuestsForDate(tomorrowDateKey, questLog.postponed)
    const postponedAwayIds = questLog.postponed
      .filter(p => p.targetDate > tomorrowDateKey)
      .map(p => p.questId)
    const quests = [
      ...native.filter(q => !postponedAwayIds.includes(q.id)),
      ...postponedToTomorrow.filter(q => !native.some(n => n.id === q.id)),
    ].filter(q => !skippedIds.includes(q.id))

    // Cykl — faza na jutrzejszą datę
    const cycleInfo = cycleLogs.length > 0
      ? getPhaseForDate(cycleLogs[0].startDate, tomorrowDateKey, cycleSettings)
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

    // Papierosy — faza + średnia krocząca
    const phase = stats.cigarettesPhase ?? 1
    const phaseMeta = SMOKING_PHASE_META[phase]
    const avg7 = rollingAverage(dailyCigaretteCounts(logs), today, 7)

    const input: BriefingInput = {
      dateLabel: tomorrow.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      dayOfProject: Math.max(1, getDaysElapsed() + 2),
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
      smoking: { phaseLabel: phaseMeta.label, softTarget: phaseMeta.softTarget, avg7days: avg7 },
    }

    return buildTomorrowBriefing(input)
  }

  const handleCopy = async () => {
    const text = buildBriefing()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard zablokowany (np. brak fokusa) — próbuj share
      if (navigator.share) await navigator.share({ text })
    }
  }

  const handleShare = async () => {
    const text = buildBriefing()
    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* anulowane */ }
    } else {
      await handleCopy()
    }
  }

  return (
    <div className="bg-ivory border border-gold-light/40 mb-4">
      <div className="px-5 pt-5 pb-3 flex items-baseline gap-3">
        <h2 className="font-heading text-dark text-xl whitespace-nowrap">Brief na jutro</h2>
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          dla asystenta
        </SmallCaps>
      </div>
      <div className="px-5 pb-5">
        <p className="font-serif-body italic text-muted text-[13.5px] leading-relaxed mb-4">
          rutyna, questy, zasady, faza cyklu i twoja energia z ostatnich dni — jeden gotowy
          prompt. wklej do Claude'a, dopisz rzeczy z kalendarza i poproś o plan dnia.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 bg-dark-deep text-ivory border border-gold py-2.5 px-4 hover:bg-forest transition-colors"
          >
            {copied ? <Check size={12} className="text-gold" /> : <Copy size={12} className="text-gold" />}
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              {copied ? 'skopiowano' : 'kopiuj brief'}
            </SmallCaps>
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 border border-hairline text-gold-deep py-2.5 px-4 hover:border-gold hover:text-dark transition-colors"
          >
            <Share2 size={12} />
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              udostępnij
            </SmallCaps>
          </button>
        </div>
        {copied && (
          <div className="mt-4 flex items-center gap-2">
            <Fleuron size={10} className="text-gold" />
            <p className="font-serif-body italic text-gold-deep text-[13px]">
              brief w schowku — wklej do Claude'a i dopisz swoje plany.
            </p>
            <Diamond size={5} className="text-gold" />
          </div>
        )}
      </div>
    </div>
  )
}
