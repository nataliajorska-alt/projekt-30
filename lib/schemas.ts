/**
 * Zod schemas for Firestore data validation.
 *
 * Use parseSafe() when reading from Firestore — it never throws,
 * logs a warning on schema mismatch, and returns the document with
 * invalid fields replaced by safe defaults (via .catch() per-field).
 *
 * If the schema gains new optional fields, old documents stay valid.
 * If a field's type changes incompatibly, bump the field with .catch()
 * to a default and the app keeps working while data migrates.
 */
import { z } from 'zod'

// ── Enums ────────────────────────────────────────────────────────────────────

export const PillarSchema = z.enum([
  'pozycja', 'cialo', 'styl', 'kapital', 'kariera', 'tozsamosc', 'milosc',
])

const MoodStateSchema = z.enum(['calm', 'storm', 'fog', 'clarity']).catch('calm')

const MinimumDayReasonSchema = z.enum([
  'choroba', 'okres', 'zly_nastroj', 'przemeczenie', 'inne',
])

// ── Leaf objects ─────────────────────────────────────────────────────────────

export const MoodCheckInSchema = z.object({
  energy: z.number().min(1).max(5).catch(3),
  mood: z.number().min(1).max(5).catch(3),
  state: MoodStateSchema,
  timestamp: z.number().nonnegative().catch(() => Date.now()),
})

export const KeyMomentSchema = z.object({
  title: z.string().catch(''),
  note: z.string().optional(),
  savedAt: z.number().catch(() => Date.now()),
})

const CigaretteContextSchema = z.enum([
  'kawa', 'posilek', 'quest', 'stres', 'nuda',
  'impreza', 'wieczor_z_kims', 'samochod', 'inne',
])

export const CigaretteEntrySchema = z.object({
  timestamp: z.number().nonnegative().catch(() => Date.now()),
  hour:      z.number().int().min(0).max(23).catch(0),
  weekday:   z.number().int().min(0).max(6).catch(0),
  context:   CigaretteContextSchema.optional(),
  intensity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
})

export const CustomSideQuestEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  pillar: PillarSchema,
  xp: z.number().catch(0),
})

const CarriedRoutineItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  xp: z.number().catch(0),
  fromDate: z.string(),
})

// ── DailyLog ─────────────────────────────────────────────────────────────────

export const DailyLogSchema = z.object({
  date: z.string().catch(''),
  completedRoutine: z.array(z.string()).catch([]),
  completedDailyQuests: z.array(z.string()).catch([]),
  completedSideQuests: z.array(z.string()).catch([]),
  customSideQuests: z.array(CustomSideQuestEntrySchema).optional(),
  carriedRoutine: z.array(CarriedRoutineItemSchema).optional(),
  postponedRoutine: z.array(z.string()).optional(),
  keptRules: z.array(z.string()).catch([]),
  totalXP: z.number().nonnegative().catch(0),
  dayMode: z.enum(['normal', 'minimum']).catch('normal'),
  minimumReason: MinimumDayReasonSchema.optional(),
  notes: z.string().optional(),
  socialPresence: z.boolean().optional(),
  physicalActivity: z.boolean().optional(),
  ghostProtocolCompleted: z.boolean().optional(),
  moodCheckIns: z.array(MoodCheckInSchema).optional(),
  keyMoment: KeyMomentSchema.optional(),
  cigarettes: z.array(CigaretteEntrySchema).optional(),
  // Odhaczone pojedyncze kroki przewodników (pielęgnacja/suplementy), bez XP.
  checkedSubSteps: z.array(z.string()).optional(),
  // Jednorazowa korekta: questy tego dnia wyrównane do realnej wartości (q.xp
  // zamiast płaskich 50). Gdy true — korekta już zastosowana, nie powtarzaj.
  questXpAdjusted: z.boolean().optional(),
  // Dzienny „capture" CBT: pierwszy wpis (myśl LUB emocja) tego dnia przyznał +10.
  // Gdy true — dzienny bonus już zaliczony, kolejne wpisy nie naliczają capture.
  cbtCaptureAwarded: z.boolean().optional(),
  // Deklaracja „ostatni papieros dnia" (wieczorne domknięcie): timestamp, null = cofnięta.
  smokeLastOfDayAt: z.number().nullable().optional(),
  // XP z zewnętrznych aplikacji (na razie The Learning Vault), per filar.
  externalXP: z.object({
    pozycja:   z.number().nonnegative().optional(),
    cialo:     z.number().nonnegative().optional(),
    styl:      z.number().nonnegative().optional(),
    kapital:   z.number().nonnegative().optional(),
    kariera:   z.number().nonnegative().optional(),
    tozsamosc: z.number().nonnegative().optional(),
    milosc:    z.number().nonnegative().optional(),
  }).optional(),
})

// ── UserStats ────────────────────────────────────────────────────────────────

const PillarXPSchema = z.object({
  pozycja:   z.number().catch(0),
  cialo:     z.number().catch(0),
  styl:      z.number().catch(0),
  kapital:   z.number().catch(0),
  kariera:   z.number().catch(0),
  tozsamosc: z.number().catch(0),
  milosc:    z.number().catch(0),
})

export const UserStatsSchema = z.object({
  totalXP:                    z.number().nonnegative().catch(0),
  currentStreak:              z.number().nonnegative().catch(0),
  longestStreak:              z.number().nonnegative().catch(0),
  totalDaysLogged:            z.number().nonnegative().catch(0),
  totalRoutinesCompleted:     z.number().nonnegative().catch(0),
  totalQuestsCompleted:       z.number().nonnegative().catch(0),
  totalSideQuestsCompleted:   z.number().nonnegative().catch(0),
  totalRulesKept:             z.number().nonnegative().catch(0),
  pillarXP:                   PillarXPSchema,
  unlockedAchievements:       z.array(z.string()).catch([]),
  lastStreakDate:             z.string().nullable().optional(),
  streakFreezeUsedMonths:     z.array(z.string()).optional(),
  reviewedWeeks:              z.array(z.string()).optional(),
  reviewedMonths:             z.array(z.string()).optional(),
  completedHeartBlocks:       z.array(z.string()).optional(),
  pillarBalanceWeeks:         z.array(z.string()).optional(),
  currentWeekPillars:         z.object({
    weekKey: z.string(),
    pillars: z.array(PillarSchema),
  }).optional(),
  totalGhostProtocols:        z.number().optional(),
  consecutiveGhostDays:       z.number().optional(),
  lastGhostDate:              z.string().nullable().optional(),
  highestDayXP:               z.number().optional(),
  consecutiveNormalDays:      z.number().optional(),
  lastNormalDay:              z.string().nullable().optional(),
  consecutivePerfectMornings: z.number().optional(),
  lastPerfectMorningDate:     z.string().nullable().optional(),
  lastReturnCeremonyDate:     z.string().nullable().optional(),
  // Papierosy — patrz PLAN_PALENIE.md
  smokingTrackingEnabled:     z.boolean().optional(),
  cigarettesBaseline:         z.number().nonnegative().optional(),
  cigarettesPhase:            z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  cigarettesPhaseStartDate:   z.string().nullable().optional(),
  cigarettesAlarmTriggered:   z.string().nullable().optional(),
  smokeEmergencyDays:         z.array(z.string()).optional(),
})

// ── Vault ────────────────────────────────────────────────────────────────────

const LetterTypeSchema = z.enum(['future', 'crisis', 'gratitude', 'vent', 'date']).catch('future')
const UnlockTypeSchema = z.enum(['quarterly', 'date', 'immediate', 'never']).catch('quarterly')

export const VaultReplySchema = z.object({
  id:            z.string().catch(''),
  content:       z.string().catch(''),
  dateKey:       z.string().catch(''),
  dayOfProject:  z.number().int().min(1).catch(1),
  moodAtWriting: MoodStateSchema.optional(),
  createdAt:     z.string().catch(() => new Date().toISOString()),
})

// VaultEntry — z fallbackiem na stary format (brak letterType ⇒ 'future' + 'quarterly').
// Stare listy działają bez migracji, nowe pola są opcjonalne.
export const VaultEntrySchema = z.object({
  id:            z.string().catch(''),
  letterType:    LetterTypeSchema,
  unlockType:    UnlockTypeSchema,
  title:         z.string().catch(''),
  content:       z.string().catch(''),
  dateKey:       z.string().catch(''),
  dayOfProject:  z.number().int().min(1).catch(1),
  createdAt:     z.string().catch(() => new Date().toISOString()),
  unlockDate:    z.string().optional(),
  moodAtWriting: MoodStateSchema.optional(),
  promptUsed:    z.string().optional(),
  charCount:     z.number().nonnegative().optional(),
})

// ── Reviews (weekly / monthly) ─────────────────────────────────────────────────

// Oceny filarów 1–5; każdy filar z .catch(0) — brakujący/zepsuty filar nie wywala recenzji.
const PillarRatingSchema = z.object({
  pozycja:   z.number().catch(0),
  cialo:     z.number().catch(0),
  styl:      z.number().catch(0),
  kapital:   z.number().catch(0),
  kariera:   z.number().catch(0),
  tozsamosc: z.number().catch(0),
  milosc:    z.number().catch(0),
})

/** Domyślne (zerowe) oceny filarów — fallback dla recenzji bez danych. */
export const ZERO_PILLAR_RATING = {
  pozycja: 0, cialo: 0, styl: 0, kapital: 0, kariera: 0, tozsamosc: 0, milosc: 0,
} as const

export const WeeklyReviewSchema = z.object({
  weekStart:     z.string().catch(''),
  highlights:    z.string().catch(''),
  challenges:    z.string().catch(''),
  pillarsRated:  PillarRatingSchema,
  nextWeekFocus: z.string().catch(''),
  xpEarned:      z.number().nonnegative().catch(0),
  savedAt:       z.string().optional(),
})

export const MonthlyReviewSchema = z.object({
  month:              z.string().catch(''),
  highlights:         z.string().catch(''),
  challenges:         z.string().catch(''),
  pillarsRated:       PillarRatingSchema,
  intentionNextMonth: z.string().catch(''),
  xpEarned:           z.number().nonnegative().catch(0),
  savedAt:            z.string().catch(() => new Date().toISOString()),
})

export const QuarterlyReviewSchema = z.object({
  quarter:      z.string().catch(''),
  lessons:      z.string().catch(''),
  openFronts:   z.string().catch(''),
  bridgeToNext: z.string().catch(''),
  whatChanged:  z.string().catch(''),
  xpEarned:     z.number().nonnegative().catch(0),
  savedAt:      z.string().catch(() => new Date().toISOString()),
})

// ── HeartBlock ─────────────────────────────────────────────────────────────────

const HeartBlockRitualsSchema = z.object({
  gratitude:    z.boolean().catch(false),
  prayer:       z.boolean().catch(false),
  planTomorrow: z.boolean().catch(false),
  breath:       z.boolean().catch(false),
}).catch({ gratitude: false, prayer: false, planTomorrow: false, breath: false })

export const HeartBlockSchema = z.object({
  weekKey:        z.string().catch(''),
  startedDateKey: z.string().catch(''),
  pain:           z.string().catch(''),
  thoughts:       z.tuple([z.string(), z.string(), z.string()]).catch(['', '', '']),
  steps:          z.tuple([z.string(), z.string(), z.string()]).catch(['', '', '']),
  closing:        z.string().catch(''),
  rituals:        HeartBlockRitualsSchema,
  completedAt:    z.string().nullable().catch(null),
  updatedAt:      z.string().catch(() => new Date().toISOString()),
})

// ── CBT (dziennik „Myśli i emocje") ──────────────────────────────────────────

const CBTEmotionTagSchema = z.object({
  name: z.string().catch(''),
  pct: z.number().min(0).max(100).catch(0),
})

export const CBTThoughtEntrySchema = z.object({
  id:             z.string().catch(''),
  kind:           z.literal('thought'),
  dateKey:        z.string().catch(''),
  timestamp:      z.number().nonnegative().catch(() => Date.now()),
  situation:      z.string().catch(''),
  emotions:       z.array(CBTEmotionTagSchema).catch([]),
  thoughts:       z.string().catch(''),
  alt:            z.string().catch(''),
  altPct:         z.number().min(0).max(100).catch(0),
  hot:            z.string().catch(''),
  interro:        z.record(z.string()).catch({}),
  reframe:        z.string().catch(''),
  reframeFeel:    z.string().catch(''),
  xpEarned:       z.number().nonnegative().catch(0),
  reframeAwarded: z.boolean().catch(false),
  updatedAt:      z.string().catch(() => new Date().toISOString()),
})

export const CBTEmotionEntrySchema = z.object({
  id:        z.string().catch(''),
  kind:      z.literal('emotion'),
  dateKey:   z.string().catch(''),
  timestamp: z.number().nonnegative().catch(() => Date.now()),
  name:      z.string().catch(''),
  before:    z.number().min(0).max(10).catch(5),
  after:     z.number().min(0).max(10).catch(5),
  body:      z.string().catch(''),
  color:     z.string().catch(''),
  shape:     z.string().catch(''),
  texture:   z.string().catch(''),
  smell:     z.string().catch(''),
  sound:     z.string().catch(''),
  metaphor:  z.string().catch(''),
  xpEarned:  z.number().nonnegative().catch(0),
  updatedAt: z.string().catch(() => new Date().toISOString()),
})

export const CBTBeliefEntrySchema = z.object({
  id:                 z.string().catch(''),
  kind:               z.literal('belief'),
  dateKey:            z.string().catch(''),
  timestamp:          z.number().nonnegative().catch(() => Date.now()),
  trigger:            z.string().catch(''),
  ladder:             z.array(z.string()).catch([]),
  coreBelief:         z.string().catch(''),
  behaveWhenActive:   z.string().catch(''),
  ifOpposite:         z.string().catch(''),
  source:             z.string().catch(''),
  axisSelf:           z.string().catch(''),
  axisOthers:         z.string().catch(''),
  axisWorld:          z.string().catch(''),
  newBelief:          z.string().catch(''),
  newBeliefPct:       z.number().min(0).max(100).catch(0),
  evidence:           z.array(z.string()).catch([]),
  confirmations:      z.array(z.object({ dateKey: z.string().catch(''), text: z.string().catch('') })).catch([]),
  pctHistory:         z.array(z.object({ weekKey: z.string().catch(''), pct: z.number().min(0).max(100).catch(0) })).catch([]),
  experiments:        z.array(z.object({
                        id:         z.string().catch(''),
                        dateKey:    z.string().catch(''),
                        task:       z.string().catch(''),
                        worry:      z.string().catch(''),
                        results:    z.string().catch(''),
                        conclusion: z.string().catch(''),
                        awarded:    z.boolean().catch(false),
                      })).catch([]),
  xpEarned:           z.number().nonnegative().catch(0),
  restructureAwarded: z.boolean().catch(false),
  updatedAt:          z.string().catch(() => new Date().toISOString()),
})

export const CBTCopingEntrySchema = z.object({
  id:            z.string().catch(''),
  kind:          z.literal('coping'),
  dateKey:       z.string().catch(''),
  timestamp:     z.number().nonnegative().catch(() => Date.now()),
  style:         z.enum(['avoid', 'overcomp', 'surrender']).catch('avoid'),
  what:          z.string().catch(''),
  ways:          z.string().catch(''),
  confront:      z.string().catch(''),
  source:        z.string().catch(''),
  healthy:       z.string().catch(''),
  xpEarned:      z.number().nonnegative().catch(0),
  copingAwarded: z.boolean().catch(false),
  updatedAt:     z.string().catch(() => new Date().toISOString()),
})

export const CBTExposureLadderSchema = z.object({
  id:        z.string().catch(''),
  kind:      z.literal('exposure'),
  dateKey:   z.string().catch(''),
  timestamp: z.number().nonnegative().catch(() => Date.now()),
  area:      z.string().catch(''),
  rungs:     z.array(z.object({
               id:           z.string().catch(''),
               situation:    z.string().catch(''),
               fear:         z.number().min(0).max(100).catch(50),
               helper:       z.string().catch(''),
               plan:         z.string().catch(''),
               observations: z.string().catch(''),
               thoughts:     z.string().catch(''),
               success:      z.string().catch(''),
               done:         z.boolean().catch(false),
               awarded:      z.boolean().catch(false),
             })).catch([]),
  xpEarned:  z.number().nonnegative().catch(0),
  updatedAt: z.string().catch(() => new Date().toISOString()),
})

// Wpis dziennika to myśl, emocja, praca z przekonaniem, przyłapany styl radzenia
// sobie ALBO drabina lęków / ekspozycja — rozróżniane po `kind`. KAŻDY nowy kind
// MUSI mieć tu gałąź, inaczej parseSafe w useCBT po cichu podmieni wpisy na fallback.
export const CBTEntrySchema = z.discriminatedUnion('kind', [
  CBTThoughtEntrySchema,
  CBTEmotionEntrySchema,
  CBTBeliefEntrySchema,
  CBTCopingEntrySchema,
  CBTExposureLadderSchema,
])

export const CBTShieldSchema = z.object({
  selected:  z.array(z.string()).catch([]),
  custom:    z.array(z.string()).catch([]),
  updatedAt: z.string().catch(() => new Date().toISOString()),
})

// ── WeeklyInsight (cache regenerowalny) ─────────────────────────────────────────
// Łagodny schemat: chroni pola konsumowane przez UI (headline/body/hasContent/liczby).
// outcomes trzymane luźno (z.any) — to złożony, deterministycznie odtwarzalny output
// pipeline'u; przy psuciu wystarczy że karta się nie wywali, a niedzielna regeneracja
// i tak nadpisze cache.
export const WeeklyInsightSchema = z.object({
  weekKey:         z.string().catch(''),
  generatedAt:     z.string().catch(() => new Date().toISOString()),
  totalHypotheses: z.number().catch(0),
  testsRun:        z.number().catch(0),
  passedCount:     z.number().catch(0),
  outcomes:        z.array(z.any()).catch([]),
  headline:        z.string().catch(''),
  body:            z.string().catch(''),
  hasContent:      z.boolean().catch(false),
  topConfidence:   z.enum(['pewny', 'wstępny', 'słaby']).nullable().optional().catch(undefined),
  profile:         z.any().optional().catch(undefined),
  inputSig:        z.number().optional().catch(undefined),
})

// ── Safe parse helper ────────────────────────────────────────────────────────

/**
 * Parse a Firestore document with a Zod schema, falling back to defaults on failure.
 * Never throws — logs a structured warning so corrupt documents don't crash the UI.
 *
 * @param schema  Zod schema (each field should have its own .catch() for resilience)
 * @param raw     Unknown data from Firestore (snap.data())
 * @param fallback  Used only if the top-level shape is so broken the schema can't parse
 * @param label   Identifier for log messages (e.g. 'DailyLog 2026-05-01')
 */
export function parseSafe<T>(
  schema: z.ZodSchema,
  raw: unknown,
  fallback: T,
  label: string,
): T {
  const result = schema.safeParse(raw)
  if (result.success) return result.data as T
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(`[schema] ${label} failed validation, using fallback:`, result.error.flatten())
  }
  return fallback
}
