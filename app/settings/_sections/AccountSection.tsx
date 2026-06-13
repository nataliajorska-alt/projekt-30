'use client'
import { useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { LogOut, Lock, Mail } from 'lucide-react'
import { SmallCaps, Diamond, GoldRule } from '@/components/ui'

export default function AccountSection({
  email,
  user,
  logOut,
}: {
  email: string
  user: any
  logOut: () => Promise<void>
}) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPw.length < 6) {
      setError('Nowe hasło musi mieć co najmniej 6 znaków.')
      return
    }
    if (newPw !== confirmPw) {
      setError('Hasła nie są identyczne.')
      return
    }

    setBusy(true)
    try {
      const credential = EmailAuthProvider.credential(email, currentPw)
      await reauthenticateWithCredential(user!, credential)
      await updatePassword(user!, newPw)
      setSuccess('Hasło zostało zmienione.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      const msg = err?.message ?? ''
      setError(
        msg.includes('wrong-password') || msg.includes('invalid-credential')
          ? 'Obecne hasło jest nieprawidłowe.'
          : msg.includes('requires-recent-login')
            ? 'Sesja wygasła. Wyloguj się i zaloguj ponownie.'
            : `Nie udało się zmienić hasła. (${msg.slice(0, 80)})`
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel-frame bg-ivory border border-hairline p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Mail size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Konto
        </SmallCaps>
      </div>
      <h2 className="font-display text-dark text-[22px] tracking-tight mb-5">Twoje dane</h2>

      {/* Email */}
      <div className="mb-6">
        <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1.5">
          E-mail
        </SmallCaps>
        <p className="font-serif-body text-dark text-[14px] bg-cream/40 border border-hairline px-4 py-3">
          {email}
        </p>
      </div>

      {/* Zmiana hasła */}
      <GoldRule variant="plain" tone="gold-deep" className="opacity-30 mb-5" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock size={12} strokeWidth={1.5} className="text-gold-deep" />
          <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
            Zmień hasło
          </SmallCaps>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { id: 'current', label: 'Obecne hasło', value: currentPw, set: setCurrentPw, placeholder: '••••••••' },
            { id: 'new',     label: 'Nowe hasło',   value: newPw,     set: setNewPw,     placeholder: 'min. 6 znaków' },
            { id: 'confirm', label: 'Potwierdź nowe hasło', value: confirmPw, set: setConfirmPw, placeholder: '••••••••' },
          ].map(f => (
            <div key={f.id}>
              <SmallCaps tone="muted" tracking="luxury" size="xs" as="div" className="mb-1.5">
                {f.label}
              </SmallCaps>
              <input
                type="password"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                required
                minLength={6}
                className="w-full border border-hairline bg-cream/40 px-4 py-3 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold transition-colors placeholder:text-muted-light/60"
                placeholder={f.placeholder}
              />
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50/50 px-3 py-2">
              <Diamond size={5} className="text-red-700 mt-1.5 shrink-0" />
              <p className="font-serif-body italic text-red-800 text-[13px] leading-snug">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 border border-forest/30 bg-forest/5 px-3 py-2">
              <Diamond size={5} className="text-forest mt-1.5 shrink-0" filled />
              <p className="font-serif-body italic text-forest text-[13px] leading-snug">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="bg-dark-deep text-ivory border border-gold py-3 px-6 hover:bg-forest transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              {busy ? '…' : 'zmień hasło'}
            </SmallCaps>
          </button>
        </form>
      </div>

      {/* Wyloguj */}
      <GoldRule variant="plain" tone="gold-deep" className="opacity-30 my-6" />
      <button
        onClick={logOut}
        className="flex items-center gap-2 border border-hairline text-muted hover:text-dark hover:border-gold px-4 py-3 transition-colors"
      >
        <LogOut size={12} strokeWidth={1.5} />
        <SmallCaps tone="muted" tracking="luxury" size="xs">
          wyloguj się
        </SmallCaps>
      </button>
    </section>
  )
}
