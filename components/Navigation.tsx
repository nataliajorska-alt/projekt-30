'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { useWeeklyInsightBadge } from '@/hooks/useWeeklyInsightBadge'
import { useLearningVaultBadge } from '@/hooks/useLearningVaultBadge'
import {
  Home, Sword, Trophy, BookOpen, CalendarDays,
  LogOut, Settings, Lock, Camera, Scroll,
  Moon, Heart, Brain, Feather, Wind,
  Sprout, TreePine, Columns3, Sparkles, LayoutGrid,
  GraduationCap, ArrowUpRight, CalendarRange,
} from 'lucide-react'
import { SmallCaps, Diamond } from '@/components/ui'

// ── Struktura ────────────────────────────────────────────────────
// Pięć miejsc zamiast siedmiu ikon bez podpisów:
//   Dziś · Questy · Wzrost (gdzie rosnę) · Spokój (narzędzia na trudniejszą
//   chwilę i rytm ciała) · Więcej (archiwum i ustawienia).
// Każda grupa otwiera listę stron z jednym zdaniem „co tam jest".

type Leaf = {
  href: string
  icon: React.ElementType
  label: string
  hint: string
  external?: boolean
  /** Druga zakładka tej samej strony — nie podświetla grupy sama z siebie. */
  secondary?: boolean
}

type SingleItem = { kind: 'single'; href: string; icon: React.ElementType; label: string }
type GroupItem = { kind: 'group'; icon: React.ElementType; label: string; children: Leaf[] }
type NavItem = SingleItem | GroupItem

const LEARNING_VAULT = 'https://the-learning-vault.vercel.app'

const NAV: NavItem[] = [
  { kind: 'single', href: '/', icon: Home, label: 'Dziś' },
  { kind: 'single', href: '/quests', icon: Sword, label: 'Questy' },
  {
    kind: 'group', icon: Sprout, label: 'Wzrost',
    children: [
      { href: '/progress',              icon: TreePine,      label: 'Drzewko',       hint: 'ogród i trzydzieści poziomów' },
      { href: '/timeline?tab=patterns', icon: CalendarDays,  label: 'Wzorce',        hint: 'historia, nawyki, nastrój' },
      { href: '/pillars',               icon: Columns3,      label: 'Filary',        hint: 'gdzie idzie Twoja energia' },
      { href: '/achievements',          icon: Trophy,        label: 'Osiągnięcia',   hint: 'kolekcja odznak' },
      { href: '/review',                icon: BookOpen,      label: 'Przegląd',      hint: 'tydzień, miesiąc, kwartał' },
      { href: '/plan',                  icon: CalendarRange, label: 'Plan miesiąca', hint: 'questy na kolejny miesiąc' },
    ],
  },
  {
    kind: 'group', icon: Feather, label: 'Spokój',
    children: [
      { href: '/mostek',              icon: Feather, label: 'Mostek', hint: 'oddech, gdy ściska' },
      { href: '/mysli',               icon: Brain,   label: 'Myśli',  hint: 'złap myśl, rozbrój ją' },
      { href: '/serce',               icon: Heart,   label: 'Serce',  hint: 'blok serca — raz w tygodniu' },
      { href: '/cycle',               icon: Moon,    label: 'Cykl',   hint: 'faza i rytm ciała' },
      { href: '/timeline?tab=oddech', icon: Wind,    label: 'Oddech', hint: 'papierosy — dane, nie ocena', secondary: true },
    ],
  },
  {
    kind: 'group', icon: LayoutGrid, label: 'Więcej',
    children: [
      { href: '/vault',        icon: Lock,          label: 'Skarbiec',       hint: 'listy do siebie' },
      { href: '/photos',       icon: Camera,        label: 'Zdjęcia',        hint: 'rok w kadrach' },
      { href: '/report',       icon: Scroll,        label: 'Raport',         hint: 'cały rok w jednym dokumencie' },
      { href: '/30',           icon: Sparkles,      label: 'Urodziny',       hint: '5 kwietnia 2027' },
      { href: LEARNING_VAULT,  icon: GraduationCap, label: 'Learning Vault', hint: 'nauka — osobna apka', external: true },
      { href: '/settings',     icon: Settings,      label: 'Ustawienia',     hint: 'rutyna, powiadomienia, eksport' },
    ],
  },
]

const pathOnly = (href: string) => href.split('?')[0]

function isGroupActive(item: GroupItem, pathname: string) {
  return item.children.some(c => {
    if (c.external || c.secondary) return false
    const p = pathOnly(c.href)
    return pathname === p || pathname.startsWith(p + '/')
  })
}

function Dot({ tone, label, className }: { tone: 'gold' | 'soft'; label: string; className?: string }) {
  return (
    <span
      aria-label={label}
      className={clsx('w-1.5 h-1.5 rounded-full', tone === 'gold' ? 'bg-gold' : 'bg-gold-light', className)}
    />
  )
}

// ── Desktop: boczny pasek ────────────────────────────────────────

function DesktopNav({ pathname, vaultBadge, insightBadge }: { pathname: string; vaultBadge: boolean; insightBadge: boolean }) {
  const { logOut } = useAuth()
  const activeGroupLabel = () =>
    NAV.find((i): i is GroupItem => i.kind === 'group' && isGroupActive(i, pathname))?.label ?? null
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroupLabel)

  // Po nawigacji zostaje rozwinięta tylko grupa, w której faktycznie jesteś.
  useEffect(() => { setOpenGroup(activeGroupLabel()) }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const top = 'font-ui uppercase tracking-[0.3em] text-[12px] transition-colors'

  return (
    <aside className="hidden md:flex flex-col w-[280px] min-h-screen bg-dark fixed left-0 top-0 z-40 py-9 pb-6 print:hidden">
      <span className="pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/25 to-transparent" />

      <div className="relative px-6 pb-7 text-center">
        <Link href="/" className="block font-display italic text-gold-pale text-[28px] leading-none tracking-wide">
          Projekt 30
        </Link>
        <div className="relative w-11 h-px bg-gold mx-auto mt-2.5 mb-2">
          <span
            className="absolute left-1/2 top-1/2 bg-dark text-gold text-[10px] px-1.5 leading-none"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            ∴
          </span>
        </div>
        <div className="font-ui uppercase tracking-[0.28em] text-[9px] text-gold-light/85">
          A year of becoming
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto" aria-label="Główna nawigacja">
        {NAV.map(item => {
          if (item.kind === 'single') {
            const active = pathname === item.href
            return (
              <div key={item.href} className="relative">
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gold" />}
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={clsx('block px-8 py-3', top, active ? 'text-gold-pale' : 'text-parchment/80 hover:text-gold-pale')}
                >
                  {item.label}
                </Link>
              </div>
            )
          }

          const active = isGroupActive(item, pathname)
          const open = openGroup === item.label || active
          const badge =
            (item.label === 'Wzrost' && insightBadge) ? <Dot tone="gold" label="Nowy wzorzec tygodnia" className="absolute -top-1 -right-2.5 ring-2 ring-dark" />
            : (item.label === 'Więcej' && vaultBadge) ? <Dot tone="soft" label="Dziś nic z Learning Vault" className="absolute -top-1 -right-2.5 ring-2 ring-dark" />
            : null

          return (
            <div key={item.label} className="relative">
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gold" />}
              <button
                onClick={() => setOpenGroup(open && !active ? null : item.label)}
                aria-expanded={open}
                className={clsx('w-full px-8 py-3 flex items-center', top, active ? 'text-gold-pale' : 'text-parchment/80 hover:text-gold-pale')}
              >
                <span className="flex-1 text-left">
                  <span className="relative">{item.label}{badge}</span>
                </span>
                <span className="opacity-50 text-[10px]">{open ? '∨' : '›'}</span>
              </button>

              {open && (
                <ul className="pl-16 pr-4 pt-1 pb-3">
                  {item.children.map(child => {
                    const childActive = !child.external && !child.secondary && pathname === pathOnly(child.href)
                    const cls = clsx(
                      'flex items-center gap-1.5 py-[7px] font-serif-body italic text-[14px] transition-colors',
                      childActive ? 'text-gold-pale' : 'text-parchment/70 hover:text-gold-pale',
                    )
                    return (
                      <li key={child.href}>
                        {child.external ? (
                          <a href={child.href} target="_blank" rel="noopener noreferrer" title={child.hint} className={cls}>
                            {child.label}
                            <ArrowUpRight size={11} strokeWidth={1.5} className="opacity-60 not-italic" />
                          </a>
                        ) : (
                          <Link href={child.href} title={child.hint} className={cls}>
                            {child.label}
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      <div className="relative px-8 pt-5 mt-2 border-t border-gold/20">
        <button onClick={logOut} className="flex items-center gap-3 text-parchment/80 hover:text-gold-pale transition-colors">
          <LogOut size={13} strokeWidth={1.5} className="opacity-70" />
          <span className="font-ui uppercase tracking-[0.32em] text-[11px]">Wyloguj</span>
        </button>
      </div>
    </aside>
  )
}

// ── Telefon: dolny pasek z podpisami + arkusz grupy ──────────────

function MobileNav({ pathname, vaultBadge, insightBadge }: { pathname: string; vaultBadge: boolean; insightBadge: boolean }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const group = NAV.find((i): i is GroupItem => i.kind === 'group' && i.label === openGroup) ?? null

  useEffect(() => { setOpenGroup(null) }, [pathname])

  useEffect(() => {
    if (!openGroup) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenGroup(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openGroup])

  const tab = 'relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[50px] px-1 transition-colors'
  const tabLabel = 'font-ui uppercase tracking-[0.12em] text-[9px] leading-none'

  return (
    <div className="md:hidden print:hidden">
      {/* Tło arkusza — stuknięcie obok zamyka */}
      {group && (
        <button
          aria-label="Zamknij menu"
          onClick={() => setOpenGroup(null)}
          className="fixed inset-0 z-40 bg-dark/45 animate-fade-in"
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40">
        {group && (
          <div
            role="dialog"
            aria-label={group.label}
            className="bg-forest-deep grain-linen border-t border-gold-light/30 px-4 pt-4 pb-4 animate-slide-up"
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="gold-light" tracking="luxury" size="sm">{group.label}</SmallCaps>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.children.map(child => {
                const active = !child.external && !child.secondary && pathname === pathOnly(child.href)
                const cls = clsx(
                  'flex items-center gap-3 min-h-[60px] px-3 py-2.5 border transition-colors text-left',
                  active ? 'bg-forest border-gold-light/50' : 'border-gold-light/15 active:bg-forest/60',
                )
                const body = (
                  <>
                    <span className={clsx('shrink-0 w-9 h-9 flex items-center justify-center border', active ? 'border-gold text-gold-light' : 'border-gold-light/30 text-gold-light')}>
                      <child.icon size={16} strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-display text-ivory text-[16px] leading-tight">
                        {child.label}
                        {child.external && <ArrowUpRight size={11} strokeWidth={1.5} className="text-gold-light/80" />}
                        {child.external && vaultBadge && <Dot tone="soft" label="Dziś nic z Learning Vault" />}
                      </span>
                      <span className="block font-serif-body italic text-parchment/75 text-[12.5px] leading-snug mt-0.5">
                        {child.hint}
                      </span>
                    </span>
                  </>
                )
                return child.external ? (
                  <a key={child.href} href={child.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpenGroup(null)} className={cls}>
                    {body}
                  </a>
                ) : (
                  <Link key={child.href} href={child.href} onClick={() => setOpenGroup(null)} className={cls}>
                    {body}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* pb z safe-area: podpisy nie siedzą na belce gestów iPhone'a, a tło paska dochodzi do krawędzi. */}
        <nav
          aria-label="Główna nawigacja"
          className="bg-forest-deep grain-linen border-t border-gold-light/30 px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-stretch"
        >
          {NAV.map(item => {
            if (item.kind === 'single') {
              const active = pathname === item.href && !openGroup
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenGroup(null)}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(tab, active ? 'text-gold-light' : 'text-parchment/65')}
                >
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-gold" />}
                  <item.icon size={20} strokeWidth={1.5} />
                  <span className={tabLabel}>{item.label}</span>
                </Link>
              )
            }

            const isOpen = openGroup === item.label
            const active = isOpen || (isGroupActive(item, pathname) && !openGroup)
            return (
              <button
                key={item.label}
                onClick={() => setOpenGroup(isOpen ? null : item.label)}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={clsx(tab, active ? 'text-gold-light' : 'text-parchment/65')}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-gold" />}
                <span className="relative">
                  <item.icon size={20} strokeWidth={1.5} />
                  {item.label === 'Wzrost' && insightBadge && (
                    <Dot tone="gold" label="Nowy wzorzec tygodnia" className="absolute -top-0.5 -right-1.5 ring-2 ring-forest-deep" />
                  )}
                  {item.label === 'Więcej' && vaultBadge && (
                    <Dot tone="soft" label="Dziś nic z Learning Vault" className="absolute -top-0.5 -right-1.5 ring-2 ring-forest-deep" />
                  )}
                </span>
                <span className={tabLabel}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  // Jeden nasłuch i jeden odczyt na oba warianty (oba są zawsze zamontowane,
  // różni je tylko CSS).
  const vaultBadge = useLearningVaultBadge()
  const insightBadge = useWeeklyInsightBadge()
  return (
    <>
      <DesktopNav pathname={pathname} vaultBadge={vaultBadge} insightBadge={insightBadge} />
      <MobileNav pathname={pathname} vaultBadge={vaultBadge} insightBadge={insightBadge} />
    </>
  )
}
