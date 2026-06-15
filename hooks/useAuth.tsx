'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_TIMEOUT_MS = 8000

// Rejestracja domyślnie WYŁĄCZONA (apka jednoosobowa). Włącz tylko ustawiając
// NEXT_PUBLIC_ALLOW_REGISTRATION=true w env (np. gdy zakładasz nowe konto), potem
// wyłącz. Bez tego obcy nie założą konta i nie zaśmiecą projektu / limitów Firebase.
export const REGISTRATION_ENABLED = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let didResolve = false

    // Timeout — jeśli Firebase nie odpowie w 8s, pokaż błąd zamiast wisieć
    const timeout = setTimeout(() => {
      if (!didResolve) {
        didResolve = true
        setError('Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem.')
        setLoading(false)
      }
    }, AUTH_TIMEOUT_MS)

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        if (!didResolve) {
          didResolve = true
          clearTimeout(timeout)
          setUser(u)
          setLoading(false)
        }
      },
      (err) => {
        if (!didResolve) {
          didResolve = true
          clearTimeout(timeout)
          console.error('[Auth] onAuthStateChanged error:', err)
          setError('Błąd połączenia z Firebase. Spróbuj odświeżyć stronę.')
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      unsub()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    // Twarda blokada po stronie logiki — nawet gdyby UI gdzieś przepuściło.
    if (!REGISTRATION_ENABLED) throw new Error('registration-disabled')
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const logOut = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
