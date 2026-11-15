// Jedyne wejście do Firestore w apce. Wszystko importuje stąd, nie z
// 'firebase/firestore' (pilnuje tego reguła w .eslintrc.json).
//
// To samo SDK, z jedną różnicą: ZAPISY NIE CZEKAJĄ W NIESKOŃCZONOŚĆ NA SERWER.
//
// Obietnica z setDoc/addDoc/deleteDoc w SDK rozstrzyga się dopiero, gdy serwer
// potwierdzi zapis. Bez zasięgu (albo przy „niby jest, a nie działa") nie
// rozstrzyga się wcale — a zapis i tak jest już bezpieczny: SDK od razu wpisuje
// go do pamięci urządzenia (IndexedDB), pokazuje w nasłuchach i dośle, gdy wróci
// sieć. Każde `await setDoc(...)` blokowało więc to, co po nim: modal zostawał
// na „zapisuję…", toast się nie pojawiał, a quest odhaczony offline nie dostawał
// XP, bo naliczenie czekało za pierwszym zapisem.
//
// Tutaj zapis „kończy się" dla apki, gdy:
//  • serwer potwierdził (zwykły przypadek, ~0,2 s), albo
//  • urządzenie jest offline — od razu, albo
//  • minęło ACK_TIMEOUT_MS bez odpowiedzi — zapis dalej czeka w kolejce SDK.
// Odrzucenie przez serwer (np. reguły) przed tym czasem dalej leci jako błąd
// do wołającego; późniejsze trafia do konsoli, a SDK samo cofa lokalną zmianę.

import * as fs from 'firebase/firestore'

export * from 'firebase/firestore'

// Sandbox (`npm run dev:sandbox`): sieć wyłączona na stałe — patrz lib/firebase.ts.
const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === '1'

/** Ile czekamy na potwierdzenie serwera, zanim uznamy zapis za „w kolejce". */
export const ACK_TIMEOUT_MS = 4000

const isOffline = () => SANDBOX || (typeof navigator !== 'undefined' && navigator.onLine === false)

function settle<T>(write: Promise<T>, value: T, what: string): Promise<T> {
  if (isOffline()) {
    write.catch(err => console.error(`[db] ${what} — zapis z kolejki odrzucony:`, err))
    return Promise.resolve(value)
  }
  return new Promise<T>((resolve, reject) => {
    let late = false
    const timer = setTimeout(() => { late = true; resolve(value) }, ACK_TIMEOUT_MS)
    write.then(
      v => { clearTimeout(timer); resolve(v) },
      err => {
        clearTimeout(timer)
        if (late) console.error(`[db] ${what} — zapis z kolejki odrzucony:`, err)
        else reject(err)
      },
    )
  })
}

export const setDoc = ((...args: Parameters<typeof fs.setDoc>) =>
  settle(fs.setDoc(...args), undefined, 'setDoc')) as typeof fs.setDoc

export const updateDoc = ((...args: unknown[]) =>
  settle((fs.updateDoc as (...a: unknown[]) => Promise<void>)(...args), undefined, 'updateDoc')) as typeof fs.updateDoc

export const deleteDoc = ((ref: fs.DocumentReference) =>
  settle(fs.deleteDoc(ref), undefined, 'deleteDoc')) as typeof fs.deleteDoc

// addDoc w SDK zwraca referencję dopiero po potwierdzeniu serwera. Id powstaje
// lokalnie, więc referencję można oddać od razu.
export const addDoc = ((col: fs.CollectionReference, data: fs.DocumentData) => {
  const ref = fs.doc(col)
  return settle(fs.setDoc(ref, data).then(() => ref), ref, 'addDoc')
}) as typeof fs.addDoc

// ── Odczyty jednorazowe ────────────────────────────────────────────────
// Poza sandboxem: zachowanie SDK bez zmian (serwer, a offline — pamięć urządzenia).
// W sandboxie sieci nie ma nigdy, więc czytamy prosto z pamięci; dokument,
// którego tam nie ma, to zwykłe „nie istnieje", a nie błąd.

function missing(ref: fs.DocumentReference) {
  return {
    id: ref.id,
    ref,
    metadata: { fromCache: true, hasPendingWrites: false },
    exists: () => false,
    data: () => undefined,
    get: () => undefined,
  } as unknown as fs.DocumentSnapshot
}

export const getDoc = (SANDBOX
  ? async (ref: fs.DocumentReference) => {
      try { return await fs.getDocFromCache(ref) } catch { return missing(ref) }
    }
  : fs.getDoc) as typeof fs.getDoc

export const getDocs = (SANDBOX
  ? (q: fs.Query) => fs.getDocsFromCache(q)
  : fs.getDocs) as typeof fs.getDocs
