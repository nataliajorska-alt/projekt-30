import { z } from 'zod'
import type { AprilQuest } from './aprilData'

// Plan miesiąca rozpisany w apce (/plan), nie w kodzie.
// users/{uid}/monthPlans/{YYYY-MM}. Miesiące z plikiem w lib/seasonal (kwiecień–
// sierpień) mają pierwszeństwo — plan z apki obejmuje tylko miesiące bez pliku.

export interface MonthPlan {
  monthKey: string
  name: string
  motto: string
  question?: string
  quests: AprilQuest[]
  updatedAt?: string
}

const PILLAR_IDS = ['pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc'] as const

const PlanQuestSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  description: z.string().catch(''),
  pillar: z.enum(PILLAR_IDS).catch('pozycja'),
  xp: z.number().int().nonnegative().catch(60),
})

export const MonthPlanSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  name: z.string().catch(''),
  motto: z.string().catch(''),
  question: z.string().optional().catch(undefined),
  // Zepsuty pojedynczy quest nie wywala całego planu — odsiewamy go niżej.
  quests: z.array(z.unknown()).catch([]),
  updatedAt: z.string().optional().catch(undefined),
})

export function parseMonthPlan(raw: unknown): MonthPlan | null {
  const res = MonthPlanSchema.safeParse(raw)
  if (!res.success) return null
  const quests: AprilQuest[] = []
  for (const q of res.data.quests) {
    const p = PlanQuestSchema.safeParse(q)
    if (p.success && p.data.title.trim()) quests.push(p.data)
  }
  return { ...res.data, quests }
}

export function newPlanQuestId(dateKey: string): string {
  return `mp_${dateKey}_${Math.random().toString(36).slice(2, 8)}`
}
