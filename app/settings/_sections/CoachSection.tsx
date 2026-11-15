'use client'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Sparkles, Copy, Check } from 'lucide-react'
import { doc, getDoc } from '@/lib/db'
import { db, IS_SANDBOX } from '@/lib/firebase'
import * as paths from '@/lib/paths'
import { useAuth } from '@/hooks/useAuth'
import { useCoachAvailability } from '@/hooks/useCoach'
import { todayKey } from '@/lib/gameLogic'
import { DAILY_REQUEST_CAP } from '@/lib/coach'
import { SmallCaps } from '@/components/ui'

// Asystentka (Claude API): czy działa, ile dziś kosztowała i jak ją włączyć.
// Klucze żyją wyłącznie na serwerze (zmienne środowiskowe Vercela) — apka ich
// nigdy nie widzi, tu pokazujemy tylko, których brakuje.

interface Usage { requests: number; inputTokens: number; outputTokens: number }

const fmt = (n: number) => n.toLocaleString('pl-PL')

export default function CoachSection() {
  const { user } = useAuth()
  const availability = useCoachAvailability()
  const [usage, setUsage] = useState<Usage | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user || IS_SANDBOX) return
    getDoc(doc(db, ...paths.coachUsageDoc(user.uid, todayKey())))
      .then(snap => {
        const d = snap.exists() ? snap.data() : {}
        setUsage({
          requests: Number(d.requests ?? 0),
          inputTokens: Number(d.inputTokens ?? 0),
          outputTokens: Number(d.outputTokens ?? 0),
        })
      })
      .catch(() => {})
  }, [user])

  const copyUid = async () => {
    if (!user) return
    try {
      await navigator.clipboard.writeText(user.uid)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* schowek zablokowany */ }
  }

  const status = availability === null
    ? { tone: 'muted', label: 'sprawdzam…' }
    : availability.demo
      ? { tone: 'gold', label: 'tryb demo (sandbox)' }
      : availability.enabled
        ? { tone: 'sage', label: 'włączona' }
        : { tone: 'wine', label: 'wyłączona' }

  return (
    <section className="panel-frame bg-ivory border border-hairline p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">Asystentka</SmallCaps>
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className={clsx(
              'w-1.5 h-1.5 rotate-45',
              status.tone === 'sage' && 'bg-sage',
              status.tone === 'gold' && 'bg-gold',
              status.tone === 'wine' && 'bg-wine',
              status.tone === 'muted' && 'bg-muted-light',
            )}
          />
          <SmallCaps tone="muted" size="xs">{status.label}</SmallCaps>
        </span>
      </div>
      <h2 className="font-display text-dark text-[22px] tracking-tight mb-1">Claude w aplikacji</h2>
      <p className="font-serif-body italic text-muted text-[13.5px] mb-5 leading-relaxed">
        układa plan dnia z Twojego briefu (ekran „Dziś”, widok „Jutro”) i rozpisuje miesiąc w Planie — bez kopiowania i wklejania.
      </p>

      <dl className="divide-y divide-border/60 mb-5">
        <div className="flex gap-4 py-2.5">
          <dt className="w-28 shrink-0 font-ui uppercase tracking-luxury text-[9px] text-muted pt-1">model</dt>
          <dd className="font-serif-body text-dark text-[14.5px] leading-snug">
            Claude Opus 5.5. Gdy odmówi odpowiedzi ze względów bezpieczeństwa, serwer sam ponawia zapytanie
            na modelu zapasowym zalecanym przez Anthropic.
          </dd>
        </div>
        <div className="flex gap-4 py-2.5">
          <dt className="w-28 shrink-0 font-ui uppercase tracking-luxury text-[9px] text-muted pt-1">dane</dt>
          <dd className="font-serif-body text-dark text-[14.5px] leading-snug">
            wychodzą do Anthropic tylko po stuknięciu „ułóż plan” albo „rozpisz miesiąc” — ten sam brief,
            który wcześniej kopiowałaś ręcznie. Plan zapisuje się w Twojej bazie, przy dniu.
          </dd>
        </div>
        <div className="flex gap-4 py-2.5">
          <dt className="w-28 shrink-0 font-ui uppercase tracking-luxury text-[9px] text-muted pt-1">koszt</dt>
          <dd className="font-serif-body text-dark text-[14.5px] leading-snug">
            płatne z Twojego klucza API: plan dnia to zwykle kilka–kilkanaście centów, miesiąc — kilkadziesiąt.
            Bezpiecznik: najwyżej {DAILY_REQUEST_CAP} zapytań dziennie.
          </dd>
        </div>
        {usage && (
          <div className="flex gap-4 py-2.5">
            <dt className="w-28 shrink-0 font-ui uppercase tracking-luxury text-[9px] text-muted pt-1">dziś</dt>
            <dd className="font-serif-body text-dark text-[14.5px] leading-snug">
              {usage.requests} z {DAILY_REQUEST_CAP} zapytań
              {usage.requests > 0 && <> · {fmt(usage.inputTokens)} tokenów wejścia, {fmt(usage.outputTokens)} wyjścia</>}
            </dd>
          </div>
        )}
      </dl>

      {availability && !availability.enabled && !availability.demo && (
        <div className="border border-gold-light/60 bg-cream/40 px-4 py-4">
          <SmallCaps tone="gold-deep" size="xs" as="div" className="mb-2">jak włączyć</SmallCaps>
          {availability.missing.length > 0 && (
            <p className="font-serif-body text-dark text-[14px] mb-3 leading-snug">
              Na serwerze brakuje: {availability.missing.map(m => (
                <code key={m} className="font-mono text-[11.5px] bg-ivory border border-hairline px-1 mx-0.5 whitespace-nowrap">{m}</code>
              ))}
            </p>
          )}
          <ol className="space-y-2.5 font-serif-body text-dark text-[14px] leading-snug list-decimal pl-5 marker:text-gold-deep">
            <li>
              Klucz API: console.anthropic.com → API Keys → „Create Key”. W Vercelu: projekt-30 → Settings →
              Environment Variables → <code className="font-mono text-[11.5px]">ANTHROPIC_API_KEY</code>.
            </li>
            <li>
              Konto serwisowe Firebase (jeśli Learning Vault już nalicza XP, to masz je ustawione): Firebase Console →
              Ustawienia projektu → Konta usługi → „Wygeneruj nowy klucz prywatny”, a z pliku JSON zmienne{' '}
              <code className="font-mono text-[11.5px]">FIREBASE_ADMIN_PROJECT_ID</code>,{' '}
              <code className="font-mono text-[11.5px]">FIREBASE_ADMIN_CLIENT_EMAIL</code>,{' '}
              <code className="font-mono text-[11.5px]">FIREBASE_ADMIN_PRIVATE_KEY</code>.
            </li>
            <li>
              <code className="font-mono text-[11.5px]">P30_OWNER_UID</code> — identyfikator Twojego konta, tylko ono może
              używać asystentki:
              {user && (
                <span className="flex items-center gap-2 mt-1.5">
                  <code className="font-mono text-[11.5px] bg-ivory border border-hairline px-1.5 py-0.5 break-all">{user.uid}</code>
                  <button onClick={copyUid} aria-label="Kopiuj identyfikator konta" className="text-gold-deep hover:text-dark shrink-0">
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </span>
              )}
            </li>
            <li>Vercel → Deployments → „Redeploy” ostatniego wdrożenia, żeby serwer zobaczył nowe zmienne.</li>
          </ol>
        </div>
      )}
      {availability?.demo && (
        <p className="font-serif-body italic text-muted text-[13px] leading-relaxed">
          w sandboxie asystentka odpowiada przykładowym planem, żeby dało się obejrzeć cały przepływ — nic nie
          wychodzi do Anthropic i nic nie kosztuje.
        </p>
      )}
    </section>
  )
}
