import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyLog } from '@/types'

export async function exportLogsAsCSV(uid: string) {
  const logsRef = collection(db, 'users', uid, 'logs')
  const q = query(logsRef, orderBy('date', 'asc'))
  const snap = await getDocs(q)

  const rows: string[][] = [
    ['Data', 'XP', 'Tryb', 'Rutyna', 'Questy dzienne', 'Side questy', 'Zasady'],
  ]

  snap.forEach((doc) => {
    const d = doc.data() as DailyLog
    rows.push([
      d.date,
      String(d.totalXP ?? 0),
      d.dayMode ?? 'normal',
      String(d.completedRoutine?.length ?? 0),
      String(d.completedDailyQuests?.length ?? 0),
      String(d.completedSideQuests?.length ?? 0),
      String(d.keptRules?.length ?? 0),
    ])
  })

  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `projekt30-logi-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function printYearSummary() {
  window.print()
}
