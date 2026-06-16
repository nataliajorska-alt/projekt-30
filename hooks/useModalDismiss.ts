'use client'
import { useEffect, useRef } from 'react'

// Wspólna dostępność modala: blokada scrolla tła (na mobile tło nie przewija się
// za modalem), Escape → zamknięcie, prosty focus-trap (Tab cyklicznie wewnątrz),
// fokus na pierwszy element po otwarciu i przywrócenie fokusu po zamknięciu.
// Zwraca ref — przypnij go do kontenera treści modala (panelu), nie do backdropu.
export function useModalDismiss<T extends HTMLElement = HTMLDivElement>(onDismiss: () => void) {
  const ref = useRef<T>(null)
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null

    const SEL =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusables = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(SEL) ?? [])
    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismissRef.current()
        return
      }
      if (e.key === 'Tab') {
        const f = focusables()
        if (f.length === 0) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [])

  return ref
}
