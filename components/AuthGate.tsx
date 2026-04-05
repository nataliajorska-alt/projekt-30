'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted font-sans text-sm">Ładowanie...</p>
      </div>
    </div>
  )

  if (user) return <>{children}</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await signIn(email, password)
      else await signUp(email, password)
    } catch (err: any) {
      setError(err.message?.includes('wrong-password') ? 'Błędne hasło.'
        : err.message?.includes('user-not-found') ? 'Nie znaleziono konta.'
        : err.message?.includes('email-already') ? 'E-mail już istnieje.'
        : 'Coś poszło nie tak. Sprawdź dane.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark mb-4">
            <span className="text-2xl">👑</span>
          </div>
          <h1 className="font-serif text-3xl text-dark mb-1">Projekt 30</h1>
          <p className="text-muted-light font-sans text-sm">5 kwietnia 2026 → 5 kwietnia 2027</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-elegant p-8">
          <h2 className="font-serif text-xl text-dark mb-6">
            {mode === 'login' ? 'Wróć do swojej transformacji' : 'Zacznij Projekt 30'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1.5 uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors"
                placeholder="twoj@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-muted mb-1.5 uppercase tracking-wider">
                Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-border rounded-xl px-4 py-3 font-sans text-sm text-dark bg-ivory focus:outline-none focus:border-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-600 text-xs font-sans bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-dark text-ivory font-sans text-sm py-3.5 rounded-xl hover:bg-forest transition-colors disabled:opacity-60 font-medium tracking-wide mt-2"
            >
              {busy ? '...' : mode === 'login' ? 'Zaloguj się' : 'Stwórz konto'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
              className="text-xs font-sans text-muted hover:text-gold transition-colors"
            >
              {mode === 'login' ? 'Nie mam jeszcze konta →' : '← Mam już konto'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-light font-sans mt-6">
          Twoje dane są prywatne i tylko Twoje.
        </p>
      </div>
    </div>
  )
}
