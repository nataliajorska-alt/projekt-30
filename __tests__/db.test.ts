import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Atrapa SDK: każda funkcja zapisu zwraca obietnicę, którą test sam rozstrzyga —
// tak symulujemy „serwer potwierdził", „serwer odrzucił" i „cisza w eterze".
const sdk = vi.hoisted(() => ({
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  getDocFromCache: vi.fn(),
  getDocsFromCache: vi.fn(),
}))
vi.mock('firebase/firestore', () => sdk)

import { setDoc, addDoc, deleteDoc, ACK_TIMEOUT_MS } from '@/lib/db'

function deferred<T = void>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const ref = { id: 'x' } as never
const settled = async (p: Promise<unknown>) => {
  let state = 'pending'
  p.then(() => { state = 'resolved' }, () => { state = 'rejected' })
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
  return state
}

describe('lib/db — zapis nie czeka w nieskończoność na serwer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', { onLine: true })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('online: kończy się, gdy serwer potwierdzi', async () => {
    const d = deferred()
    sdk.setDoc.mockReturnValueOnce(d.promise)
    const p = setDoc(ref, { a: 1 })
    expect(await settled(p)).toBe('pending')
    d.resolve()
    expect(await settled(p)).toBe('resolved')
  })

  it('offline: kończy się od razu, choć serwer jeszcze nic nie wie', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    sdk.setDoc.mockReturnValueOnce(deferred().promise)   // nigdy się nie rozstrzygnie
    expect(await settled(setDoc(ref, { a: 1 }))).toBe('resolved')
  })

  it('„niby jest zasięg": po ACK_TIMEOUT_MS zapis uznany za czekający w kolejce', async () => {
    sdk.setDoc.mockReturnValueOnce(deferred().promise)
    const p = setDoc(ref, { a: 1 })
    await vi.advanceTimersByTimeAsync(ACK_TIMEOUT_MS - 1)
    expect(await settled(p)).toBe('pending')
    await vi.advanceTimersByTimeAsync(1)
    expect(await settled(p)).toBe('resolved')
  })

  it('odrzucenie przez serwer przed limitem dalej jest błędem dla wołającego', async () => {
    const d = deferred()
    sdk.deleteDoc.mockReturnValueOnce(d.promise)
    const p = deleteDoc(ref)
    d.reject(new Error('permission-denied'))
    await expect(p).rejects.toThrow('permission-denied')
  })

  it('odrzucenie PO limicie nie wywraca apki — trafia do konsoli', async () => {
    const d = deferred()
    sdk.setDoc.mockReturnValueOnce(d.promise)
    const p = setDoc(ref, { a: 1 })
    await vi.advanceTimersByTimeAsync(ACK_TIMEOUT_MS)
    await expect(p).resolves.toBeUndefined()
    d.reject(new Error('permission-denied'))
    await Promise.resolve(); await Promise.resolve()
    expect(console.error).toHaveBeenCalled()
  })

  it('addDoc oddaje referencję od razu, gdy nie ma sieci', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const newRef = { id: 'nowy-list' }
    sdk.doc.mockReturnValueOnce(newRef)
    sdk.setDoc.mockReturnValueOnce(deferred().promise)
    await expect(addDoc({} as never, { title: 'List' })).resolves.toBe(newRef)
    expect(sdk.setDoc).toHaveBeenCalledWith(newRef, { title: 'List' })
  })
})
