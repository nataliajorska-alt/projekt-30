'use client'
import { useMemo } from 'react'
import { useTimelineData } from '@/hooks/useTimelineData'
import { PILLARS } from '@/lib/pillars'
import { SIDE_QUESTS } from '@/lib/questData'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

export default function SideQuestHistoryTab({ logs }: { logs: ReturnType<typeof useTimelineData>['logs'] }) {
  const questMap = useMemo(
    () => Object.fromEntries(SIDE_QUESTS.map(q => [q.id, q])),
    []
  )

  const allCompleted = useMemo(() => {
    const result: { questId: string; date: string; title: string; pillar: string; xp: number }[] = []
    const sorted = Object.keys(logs).sort().reverse()
    for (const dateKey of sorted) {
      const log = logs[dateKey]
      for (const qid of log.completedSideQuests ?? []) {
        const q = questMap[qid]
        result.push({
          questId: qid, date: dateKey,
          title: q?.title ?? qid, pillar: q?.pillar ?? '—', xp: q?.xp ?? 120,
        })
      }
      for (const csq of log.customSideQuests ?? []) {
        result.push({
          questId: csq.id, date: dateKey,
          title: csq.title, pillar: csq.pillar, xp: csq.xp,
        })
      }
    }
    return result
  }, [logs, questMap])

  if (allCompleted.length === 0) {
    return (
      <div className="bg-ivory border border-gold-light/40 p-8 text-center">
        <Fleuron size={12} className="text-gold-deep mx-auto mb-3 inline-block" />
        <p className="font-serif-body italic text-muted text-[13.5px]">
          brak ukończonych side questów w logach.
        </p>
      </div>
    )
  }

  const totalXP = allCompleted.reduce((s, q) => s + q.xp, 0)

  return (
    <div className="space-y-3">
      <div className="bg-ivory border border-gold-light/40 p-4 flex justify-between items-center">
        <div className="flex items-baseline gap-2">
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            Łącznie ukończonych
          </SmallCaps>
          <span className="font-display text-dark text-xl leading-none">{allCompleted.length}</span>
        </div>
        <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
          {totalXP.toLocaleString('pl-PL')} XP
        </SmallCaps>
      </div>

      {allCompleted.map((entry, i) => {
        const pillarMeta = PILLARS.find(p => p.id === entry.pillar)
        return (
          <div
            key={`${entry.questId}-${entry.date}-${i}`}
            className="bg-ivory border border-hairline px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span
                className="shrink-0 mt-1"
                style={{ color: pillarMeta?.color ?? '#9E9189' }}
              >
                <Diamond size={5} filled />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-serif-body text-[14px] text-dark truncate">{entry.title}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <SmallCaps tone="muted" tracking="luxury" size="xs">
                    {entry.date}
                  </SmallCaps>
                  {pillarMeta && (
                    <SmallCaps tracking="luxury" size="xs">
                      <span style={{ color: pillarMeta.color }}>· {pillarMeta.shortName}</span>
                    </SmallCaps>
                  )}
                </div>
              </div>
            </div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="shrink-0">
              + {entry.xp} XP
            </SmallCaps>
          </div>
        )
      })}
    </div>
  )
}
