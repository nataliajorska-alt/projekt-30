'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from './useAuth'
import { todayKey, getDaysElapsed } from '@/lib/gameLogic'
import type { PhotoEntry } from '@/types'

export function usePhotos() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const ref_ = collection(db, 'users', user.uid, 'photos')
      const q = query(ref_, orderBy('createdAt', 'desc'))
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
    try {
      // Upload to Firebase Storage
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filename = `${Date.now()}.${ext}`
      const storageRef = ref(storage, `users/${user.uid}/photos/${filename}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      // Save metadata to Firestore
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
      return entry
    } catch (err) {
      console.error('photo upload error:', err)
      return null
    } finally {
      setUploading(false)
    }
  }, [user?.uid])

  const deletePhoto = useCallback(async (photo: PhotoEntry & { filename?: string }) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'photos', photo.id))
      if ((photo as any).filename) {
        const storageRef = ref(storage, `users/${user.uid}/photos/${(photo as any).filename}`)
        await deleteObject(storageRef).catch(() => {}) // graceful — file may already be gone
      }
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch (err) {
      console.error('photo delete error:', err)
    }
  }, [user?.uid])

  return { photos, loading, uploading, uploadPhoto, deletePhoto, reload: load }
}
