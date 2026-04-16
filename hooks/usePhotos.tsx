'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { useToast } from '@/components/ToastProvider'
import { todayKey, getDaysElapsed } from '@/lib/gameLogic'
import type { PhotoEntry } from '@/types'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

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

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      const msg = 'Brakuje konfiguracji Cloudinary. Dodaj NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME i NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET do zmiennych środowiskowych.'
      setUploadError(msg)
      addToast({ message: msg, type: 'error', duration: 8000 })
      return null
    }

    setUploading(true)
    setUploadError(null)

    try {
      // Upload do Cloudinary (unsigned preset — bez backendu)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', `projekt30/${user.uid}`)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      const url: string = data.secure_url
      const publicId: string = data.public_id

      // Zapisz metadane do Firestore
      const colRef = collection(db, 'users', user.uid, 'photos')
      const docRef = await addDoc(colRef, {
        url,
        publicId,
        caption: caption ?? '',
        dateKey: todayKey(),
        dayOfProject: getDaysElapsed() + 1,
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
      const msg = `Nie udało się wgrać zdjęcia: ${(err as Error).message ?? 'nieznany błąd'}`
      setUploadError(msg)
      addToast({ message: msg, type: 'error', duration: 7000 })
      return null
    } finally {
      setUploading(false)
    }
  }, [user?.uid, addToast])

  const deletePhoto = useCallback(async (photo: PhotoEntry) => {
    if (!user) return
    try {
      // Usuwamy tylko rekord z Firestore (Cloudinary bez API secret wymaga backendu)
      await deleteDoc(doc(db, 'users', user.uid, 'photos', photo.id))
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      addToast({ message: 'Zdjęcie usunięte', type: 'success' })
    } catch (err) {
      console.error('photo delete error:', err)
      addToast({ message: 'Nie udało się usunąć zdjęcia.', type: 'error' })
    }
  }, [user?.uid, addToast])

  return { photos, loading, uploading, uploadError, uploadPhoto, deletePhoto, reload: load }
}
