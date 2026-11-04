'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') {
      // W dev chunki /_next/static nie mają hashy w nazwach, a sw.js serwuje je
      // cache-first — po zmianie kodu przeglądarka dostawała stare moduły
      // („Cannot read properties of undefined (reading 'call')"). W dev: bez SW.
      navigator.serviceWorker.getRegistrations()
        .then(regs => regs.forEach(r => r.unregister()))
        .catch(() => {})
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {})
      }
      return
    }
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('SW registration failed:', err)
    })
  }, [])

  return null
}
