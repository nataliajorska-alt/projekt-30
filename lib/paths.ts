// Pojedyncze źródło prawdy dla ścieżek Firestore (client SDK).
//
// Każda funkcja zwraca SEGMENTY ścieżki jako krotkę, do rozpakowania w miejscu wywołania:
//   doc(db, ...logDoc(uid, dateKey))          → doc(db, 'users', uid, 'logs', dateKey)
//   collection(db, ...vaultCol(uid))          → collection(db, 'users', uid, 'vault')
// Dzięki temu ścieżka po refaktorze jest BAJT-W-BAJT identyczna z wersją inline.
//
// Krotki o stałej długości (a nie string[]) — żeby TS wiedział, że jest min. 1 segment
// (doc()/collection() wymagają argumentu `path`).
//
// UWAGA — poza tym plikiem celowo:
//  • Admin SDK w app/api/external/xp/route.ts (db.collection().doc()) — 3 ścieżki, inny
//    kształt API, nie rozpakowuje krotek; zostaje inline (users/data/stats, users/logs/{k},
//    users/externalEvents/{id}).
//  • FLAGA: recenzje tygodniowe zapisywane są do kolekcji `reviews` (UI + historia), ale
//    lib/exportData.ts czyta z `weeklyReviews` (patrz weeklyReviewsCol) — prawdopodobnie
//    osobna, pusta kolekcja => eksport może gubić recenzje tygodniowe. Zachowane bez zmian.

type Uid = string

// users/{uid}/data/{name}
export type DataDocName =
  | 'stats'
  | 'cycleSettings'
  | 'ghostLogV2'
  | 'honestFailureLog'
  | 'appSettings'
  | 'aprilQuestLog'
  | 'sparkSchedule'
  | 'annualReflection'
export const dataDoc = (uid: Uid, name: DataDocName): [string, string, string, string] =>
  ['users', uid, 'data', name]

// users/{uid}/config/{name}
export const configDoc = (uid: Uid, name: 'routines'): [string, string, string, string] =>
  ['users', uid, 'config', name]

// users/{uid}/logs
export const logsCol = (uid: Uid): [string, string, string] => ['users', uid, 'logs']
export const logDoc = (uid: Uid, dateKey: string): [string, string, string, string] =>
  ['users', uid, 'logs', dateKey]

// users/{uid}/reviews  (recenzje tygodniowe — kanoniczne miejsce zapisu/odczytu UI)
export const reviewsCol = (uid: Uid): [string, string, string] => ['users', uid, 'reviews']
export const reviewDoc = (uid: Uid, weekStart: string): [string, string, string, string] =>
  ['users', uid, 'reviews', weekStart]

// users/{uid}/weeklyReviews  (TYLKO lib/exportData.ts — patrz FLAGA u góry pliku)
export const weeklyReviewsCol = (uid: Uid): [string, string, string] =>
  ['users', uid, 'weeklyReviews']

// users/{uid}/monthlyReviews
export const monthlyReviewsCol = (uid: Uid): [string, string, string] =>
  ['users', uid, 'monthlyReviews']
export const monthlyReviewDoc = (uid: Uid, monthKey: string): [string, string, string, string] =>
  ['users', uid, 'monthlyReviews', monthKey]

// users/{uid}/quarterlyReviews
export const quarterlyReviewsCol = (uid: Uid): [string, string, string] =>
  ['users', uid, 'quarterlyReviews']
export const quarterlyReviewDoc = (
  uid: Uid,
  quarter: string,
): [string, string, string, string] => ['users', uid, 'quarterlyReviews', quarter]

// users/{uid}/insights/{weekKey}
export const insightDoc = (uid: Uid, weekKey: string): [string, string, string, string] =>
  ['users', uid, 'insights', weekKey]

// users/{uid}/heartBlocks
export const heartBlocksCol = (uid: Uid): [string, string, string] =>
  ['users', uid, 'heartBlocks']
export const heartBlockDoc = (uid: Uid, weekKey: string): [string, string, string, string] =>
  ['users', uid, 'heartBlocks', weekKey]

// users/{uid}/vault  (+ podkolekcja replies)
export const vaultCol = (uid: Uid): [string, string, string] => ['users', uid, 'vault']
export const vaultDoc = (uid: Uid, id: string): [string, string, string, string] =>
  ['users', uid, 'vault', id]
export const vaultRepliesCol = (
  uid: Uid,
  letterId: string,
): [string, string, string, string, string] => ['users', uid, 'vault', letterId, 'replies']
export const vaultReplyDoc = (
  uid: Uid,
  letterId: string,
  replyId: string,
): [string, string, string, string, string, string] =>
  ['users', uid, 'vault', letterId, 'replies', replyId]

// users/{uid}/photos
export const photosCol = (uid: Uid): [string, string, string] => ['users', uid, 'photos']
export const photoDoc = (uid: Uid, id: string): [string, string, string, string] =>
  ['users', uid, 'photos', id]

// users/{uid}/cycle
export const cycleCol = (uid: Uid): [string, string, string] => ['users', uid, 'cycle']
export const cycleDoc = (uid: Uid, id: string): [string, string, string, string] =>
  ['users', uid, 'cycle', id]
