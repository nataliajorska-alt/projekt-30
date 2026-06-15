'use client'

import { useEffect } from 'react'

// Route-level error boundary (App Router). Łapie niewyłapane błędy renderu na
// każdej trasie pod app/ (np. /timeline, /cycle, /vault, /report) — bez tego
// błąd zostawiał pustą, białą stronę bez wyjścia. ErrorBoundary opakowuje tylko
// widżety dashboardu, więc to jest siatka bezpieczeństwa dla reszty aplikacji.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[route error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-6">
      <div className="max-w-md w-full text-center">
        <p className="font-display text-gold text-4xl leading-none mb-5" aria-hidden="true">◆</p>
        <h1 className="font-display text-dark text-2xl sm:text-3xl tracking-tight">
          Coś się zacięło
        </h1>
        <p className="font-serif-body italic text-muted text-[15px] mt-3 leading-relaxed">
          Ten widok się nie wczytał. Twoje dane są bezpieczne — to tylko ekran.
          Spróbuj ponownie albo odśwież stronę.
        </p>
        <div className="flex items-center justify-center gap-3 mt-7">
          <button
            onClick={reset}
            className="font-ui uppercase tracking-luxury text-[11px] text-ivory bg-forest px-5 py-2.5 transition-opacity hover:opacity-85"
          >
            Spróbuj ponownie
          </button>
          <button
            onClick={() => location.reload()}
            className="font-ui uppercase tracking-luxury text-[11px] text-forest border border-hairline px-5 py-2.5 transition-colors hover:border-gold"
          >
            Odśwież
          </button>
        </div>
        {error.digest && (
          <p className="font-ui text-muted-light text-[10px] mt-6 tracking-wide">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
