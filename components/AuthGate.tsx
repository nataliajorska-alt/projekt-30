'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SmallCaps, GoldRule, Fleuron, Diamond } from '@/components/ui'

const PUBLIC_PATHS = ['/design-system']

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading, error: authError, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (pathname && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>
  }

  if (loading) return (
    <div className="min-h-screen bg-ivory grain-parchment flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Fleuron size={24} className="text-gold animate-pulse" />
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          Ładowanie
        </SmallCaps>
      </div>
    </div>
  )

  if (authError) return (
    <div className="min-h-screen bg-ivory grain-parchment flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Diamond size={16} className="text-gold-deep mx-auto mb-4 inline-block" />
        <h2 className="font-display text-3xl text-dark mb-2 leading-tight">
          Ups, coś nie działa
        </h2>
        <p className="font-serif-body italic text-muted text-[14px] mb-6 leading-relaxed">
          {authError}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-dark-deep text-ivory border border-gold py-3 px-8 hover:bg-forest transition-colors inline-flex items-center gap-2"
        >
          <Diamond size={5} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            Odśwież stronę
          </SmallCaps>
        </button>
      </div>
    </div>
  )

  if (user) return <>{children}</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )
      const action = mode === 'login' ? signIn(email, password) : signUp(email, password)
      await Promise.race([action, timeout])
    } catch (err: any) {
      const msg = err.message || ''
      setError(
        msg.includes('timeout') ? 'Serwer nie odpowiada. Sprawdź połączenie z internetem.'
        : msg.includes('wrong-password') || msg.includes('invalid-credential') ? 'Błędne hasło.'
        : msg.includes('user-not-found') ? 'Nie znaleziono konta.'
        : msg.includes('email-already') ? 'E-mail już istnieje.'
        : msg.includes('auth/unauthorized-domain') ? 'Domena nie jest autoryzowana w Firebase.'
        : `Coś poszło nie tak. Sprawdź dane. (${msg.slice(0, 80)})`
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory grain-parchment flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Editorial masthead */}
        <div className="text-center mb-12">
          <SmallCaps tone="muted" tracking="editorial" size="xs">
            Quiet Inheritance · MMXXVI
          </SmallCaps>
          <h1 className="font-display text-dark text-5xl mt-4 leading-none">
            Projekt 30
          </h1>
          <GoldRule variant="fleuron" tone="gold" className="mt-5 max-w-[180px] mx-auto" />
          <p className="font-serif-body italic text-muted text-[14px] mt-4">
            5 kwietnia 2026 → 5 kwietnia 2027
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-ivory border border-gold-light/40 p-8">
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs" as="div" className="mb-3">
            {mode === 'login' ? 'Powrót do transformacji' : 'Początek'}
          </SmallCaps>
          <h2 className="font-heading text-dark text-xl mb-6 leading-snug">
            {mode === 'login' ? 'Wróć do swojej transformacji' : 'Zacznij Projekt 30'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1.5">
                E-mail
              </SmallCaps>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-hairline bg-cream/40 px-4 py-3 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold transition-colors placeholder:text-muted-light/60"
                placeholder="twoj@email.com"
              />
            </div>
            <div>
              <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1.5">
                Hasło
              </SmallCaps>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-hairline bg-cream/40 px-4 py-3 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold transition-colors placeholder:text-muted-light/60"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50/60 px-3 py-2">
                <Diamond size={5} className="text-red-700 mt-1.5 shrink-0" />
                <p className="font-serif-body italic text-red-800 text-[13px] leading-snug">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-dark-deep text-ivory border border-gold py-3.5 hover:bg-forest transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="ivory" tracking="luxury" size="xs">
                {busy ? '...' : mode === 'login' ? 'Zaloguj się' : 'Stwórz konto'}
              </SmallCaps>
              <Diamond size={5} className="text-gold" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
              className="font-ui uppercase tracking-luxury text-[10px] text-muted hover:text-gold-deep transition-colors"
            >
              {mode === 'login' ? 'Nie mam jeszcze konta  ›' : '‹  Mam już konto'}
            </button>
          </div>
        </div>

        <p className="text-center font-serif-body italic text-muted-light text-[12px] mt-6">
          twoje dane są prywatne — i tylko twoje.
        </p>
      </div>
    </div>
  )
}
