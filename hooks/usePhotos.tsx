'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { useToast } from '@/components/ToastProvider'
import { todayKey, getDaysElapsed } from '@/lib/gameLogic'
import type { PhotoEntry } from '@/types'

function friendlyStorageError(err: unknown): string {
  const code = (err as any)?.code ?? ''
  if (code === 'storage/unauthorized')
    return 'Brak uprawnień. Sprawdź reguły Firebase Storage w konsoli.'
  if (code === 'storage/unknown' || code === 'storage/bucket-not-found')
    return 'Firebase Storage nie jest włączone. Włącz je w Firebase Console → Build → Storage.'
  if (code === 'storage/quota-exceeded')
    return 'Przekroczono limit miejsca w Firebase Storage.'
  if (code === 'storage/canceled')
    return 'Wgrywanie anulowane.'
  if (code.startsWith('storage/'))
    return `Błąd Storage: ${code}`
  return 'Nie udało się wgrać zdjęcia. Sprawdź konsolę po więcej szczegółów.'
}

export function usePhotos() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const colRef = collection(db, 'users', user.uid, 'photos')
      const q = query(colRef, orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as PhotoEntry)))
    } catch (err) {
      console.error('photos fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { load() }, [load])

  const uploadPhoto = useCallback(async (file: File, caption?: string): Promise<PhotoEntry | null> => {
    if (!user) return null
    setUploading(true)
    setUploadError(null)

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filename = `${Date.now()}.${ext}`
      const storageRef = ref(storage, `users/${user.uid}/photos/${filename}`)

      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      const colRef = collection(db, 'users', user.uid, 'photos')
      const docRef = await addDoc(colRef, {
        url,
        caption: caption ?? '',
        dateKey: todayKey(),
        dayOfProject: getDaysElapsed() + 1,
        filename,
        createdAt: serverTimestamp(),
      })

      const entry: PhotoEntry = {
        id: docRef.id,
        url,
        caption,
        dateKey: todayKey(),
        dayOfProject: getDaysElapsed() + 1,
        createdAt: new Date().toISOString(),
      }
      setPhotos(prev => [entry, ...prev])
      addToast({ message: 'Zdjęcie zapisane ✦', type: 'success' })
      return entry

    } catch (err: unknown) {
      console.error('photo upload error:', err)
      const msg = friendlyStorageError(err)
      setUploadError(msg)
      addToast({ message: msg, type: 'error', duration: 7000 })
      return null
    } finally {
      setUploading(false)
    }
  }, [user?.uid, addToast])

  const deletePhoto = useCallback(async (photo: PhotoEntry & { filename?: string }) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'photos', photo.id))
      if ((photo as any).filename) {
        const storageRef = ref(storage, `users/${user.uid}/photos/${(photo as any).filename}`)
        await deleteObject(storageRef).catch(() => {})
      }
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      addToast({ message: 'Zdjęcie usunięte', type: 'success' })
    } catch (err) {
      console.error('photo delete error:', err)
      addToast({ message: 'Nie udało się usunąć zdjęcia.', type: 'error' })
    }
  }, [user?.uid, addToast])

  return { photos, loading, uploading, uploadError, uploadPhoto, deletePhoto, reload: load }
}
