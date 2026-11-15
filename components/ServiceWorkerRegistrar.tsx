'use client'

import { useEffect } from 'react'

// Dogrzanie cache po instalacji / aktualizacji service workera.
// Strona i jej pliki ładują się, ZANIM nowy SW przejmie kontrolę — nie przechodzą
// więc przez jego cache i pierwsze otwarcie bez zasięgu pokazałoby ekran awaryjny
// zamiast apki. Prosimy o te same adresy jeszcze raz (przeglądarka ma je w swoim
// cache HTTP, więc to prawie nic nie kosztuje), tym razem przez SW, który je zapisze.
async function warmOfflineCache() {
  try {
    if (!('caches' in window)) return
    // Ta strona jest już zapisana — nic do roboty przy zwykłym otwarciu.
    if (await caches.match(location.pathname, { ignoreSearch: true })) return

    const urls = new Set<string>([location.pathname])
    for (const entry of performance.getEntriesByType('resource')) {
      const u = new URL(entry.name)
      const ownAsset = u.origin === location.origin && u.pathname.startsWith('/_next/static/')
      const font = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com'
      if (ownAsset || font) urls.add(u.href)
    }
    // Zwykły fetch (tryb CORS), nie no-cors: „nieprzezroczysta" odpowiedź zapisana
    // dla pliku czcionki zostałaby potem odrzucona przez przeglądarkę.
    urls.forEach(url => { fetch(url).catch(() => {}) })
  } catch {
    // Dogrzanie to dodatek — jego błąd nie może niczego zepsuć.
  }
}

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

    // Nasłuch PRZED rejestracją: przy pierwszej instalacji (albo nowej wersji) SW
    // przejmuje kontrolę w trakcie rejestracji i zdarzenie mogłoby nas minąć.
    const onControllerChange = () => { void warmOfflineCache() }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    navigator.serviceWorker.register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        if (navigator.serviceWorker.controller) void warmOfflineCache()
      })
      .catch((err) => {
        console.error('SW registration failed:', err)
      })
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  return null
}
