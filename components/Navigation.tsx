'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { useWeeklyInsightBadge } from '@/hooks/useWeeklyInsightBadge'
import {
  Home, Sword, Trophy, BookOpen, CalendarDays,
  LogOut, Settings, Lock, Camera, Scroll,
  Archive, Moon, Heart,
  Sprout, TreePine, Columns3, Sparkles,
  GraduationCap, ArrowUpRight,
} from 'lucide-react'
import { SmallCaps, Diamond } from '@/components/ui'

// ── Nav structure ────────────────────────────────────────────────

type SingleItem = {
  kind: 'single'
  href: string
  icon: React.ElementType
  label: string
  shortLabel?: string
  external?: boolean
}

type GroupItem = {
  kind: 'group'
  icon: React.ElementType
  label: string
  shortLabel?: string
  children: { href: string; icon: React.ElementType; label: string }[]
}

type NavItem = SingleItem | GroupItem

const NAV: NavItem[] = [
  { kind: 'single', href: '/', icon: Home, label: 'Dziś' },
  { kind: 'single', href: '/quests', icon: Sword, label: 'Questy' },
  {
    kind: 'group', icon: Sprout, label: 'Wzrost',
    children: [
      { href: '/progress',              icon: TreePine,     label: 'Drzewko' },
      { href: '/timeline?tab=patterns', icon: CalendarDays, label: 'Wzorce' },
      { href: '/pillars',               icon: Columns3,     label: 'Filary' },
      { href: '/achievements',          icon: Trophy,       label: 'Osiągnięcia' },
    ],
  },
  {
    kind: 'group', icon: Moon, label: 'Rytm',
    children: [
      { href: '/cycle',  icon: Moon,     label: 'Cykl' },
      { href: '/serce',  icon: Heart,    label: 'Serce' },
      { href: '/review', icon: BookOpen, label: 'Przegląd' },
    ],
  },
  {
    kind: 'group', icon: Archive, label: 'Archiwum',
    children: [
      { href: '/vault',  icon: Lock,     label: 'Skarbiec' },
      { href: '/photos', icon: Camera,   label: 'Zdjęcia' },
      { href: '/report', icon: Scroll,   label: 'Raport' },
      { href: '/30',     icon: Sparkles, label: 'Urodziny' },
    ],
  },
  {
    kind: 'single',
    href: 'https://the-learning-vault.vercel.app',
    icon: GraduationCap,
    label: 'Learning Vault',
    external: true,
  },
  { kind: 'single', href: '/settings', icon: Settings, label: 'Ustawienia' },
]

function pathOnly(href: string) {
  return href.split('?')[0]
}
function groupPaths(item: GroupItem) {
  return item.children.map(c => pathOnly(c.href))
}
function isGroupActive(item: GroupItem, pathname: string) {
  return groupPaths(item).some(p => pathname === p || pathname.startsWith(p + '/'))
}

// ── Desktop sidebar ──────────────────────────────────────────────

function DesktopNav({ pathname }: { pathname: string }) {
  const { logOut } = useAuth()
  const insightBadge = useWeeklyInsightBadge()
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    for (const item of NAV) {
      if (item.kind === 'group' && isGroupActive(item, pathname)) return item.label
    }
    return null
  })

  // Po nawigacji zwiń ręcznie rozwiniętą grupę — niech otwarta zostaje tylko
  // ta, w której faktycznie jesteś (a na Dziś/Questy/Ustawieniach: żadna).
  useEffect(() => {
    const activeGroup = NAV.find(
      (item): item is GroupItem => item.kind === 'group' && isGroupActive(item, pathname),
    )
    setOpenGroup(activeGroup ? activeGroup.label : null)
  }, [pathname])

  return (
    <aside className="hidden md:flex flex-col w-[280px] min-h-screen bg-dark fixed left-0 top-0 z-40 py-9 pb-6">
      {/* Subtle gold right edge thread */}
      <span className="pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/25 to-transparent" />

      {/* Brand */}
      <div className="relative px-6 pb-7 text-center">
        <h1 className="font-display italic text-gold-pale text-[28px] leading-none tracking-wide">
          Projekt 30
        </h1>
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

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto">
        {NAV.map(item => {
          if (item.kind === 'single') {
            if (item.external) {
              return (
                <div key={item.href} className="relative">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpenGroup(null)}
                    className="px-8 py-3 flex items-center gap-2 font-ui uppercase tracking-[0.3em] text-[12px] text-parchment/80 hover:text-gold-pale transition-colors"
                  >
                    <span className="flex-1">{item.label}</span>
                    <ArrowUpRight size={12} strokeWidth={1.5} className="opacity-50" />
                  </a>
                </div>
              )
            }
            const active = pathname === item.href
            return (
              <div key={item.href} className="relative">
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gold" />
                )}
                <Link
                  href={item.href}
                  onClick={() => setOpenGroup(null)}
                  className={clsx(
                    'block px-8 py-3 font-ui uppercase tracking-[0.3em] text-[12px] transition-colors',
                    active ? 'text-gold-pale' : 'text-parchment/80 hover:text-gold-pale',
                  )}
                >
                  {item.label}
                </Link>
              </div>
            )
          }

          const active = isGroupActive(item, pathname)
          const open = openGroup === item.label || active

          return (
            <div key={item.label} className="relative">
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gold" />
              )}
              <button
                onClick={() => setOpenGroup(open && !active ? null : item.label)}
                className={clsx(
                  'w-full px-8 py-3 flex items-center font-ui uppercase tracking-[0.3em] text-[12px] transition-colors',
                  active ? 'text-gold-pale' : 'text-parchment/80 hover:text-gold-pale',
                )}
              >
                <span className="flex-1 text-left relative">
                  {item.label}
                  {item.label === 'Wzrost' && insightBadge && (
                    <span
                      className="absolute -top-1 -right-2.5 w-1.5 h-1.5 rounded-full bg-gold ring-2 ring-dark"
                      aria-label="Nowy insight"
                    />
                  )}
                </span>
                <span className="opacity-50 text-[10px]">{open ? '∨' : '›'}</span>
              </button>

              {open && (
                <ul className="pl-16 pr-4 pt-1 pb-3 space-y-0">
                  {item.children.map(child => {
                    const childActive = pathname === pathOnly(child.href)
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={clsx(
                            'block py-[7px] font-serif-body italic text-[14px] transition-colors',
                            childActive
                              ? 'text-gold-pale'
                              : 'text-parchment/70 hover:text-gold-pale',
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="relative px-8 pt-5 mt-2 border-t border-gold/20">
        <button
          onClick={logOut}
          className="flex items-center gap-3 text-parchment/80 hover:text-gold-pale transition-colors"
        >
          <LogOut size={13} strokeWidth={1.5} className="opacity-70" />
          <span className="font-ui uppercase tracking-[0.32em] text-[11px]">
            Wyloguj
          </span>
        </button>
      </div>
    </aside>
  )
}

// ── Mobile bottom nav ────────────────────────────────────────────

function MobileNav({ pathname }: { pathname: string }) {
  const insightBadge = useWeeklyInsightBadge()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openGroup) return
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openGroup])

  useEffect(() => { setOpenGroup(null) }, [pathname])

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40" ref={sheetRef}>
      {/* Group popover */}
      {openGroup && (() => {
        const group = NAV.find(i => i.kind === 'group' && i.label === openGroup) as GroupItem
        if (!group) return null
        return (
          <div className="bg-forest-deep grain-linen border-t border-gold-light/30 px-4 pt-3 pb-3 animate-slide-up">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Diamond size={5} className="text-gold" />
              <SmallCaps tone="gold-light" tracking="luxury" size="xs">
                {group.label}
              </SmallCaps>
            </div>
            <div className="flex gap-2">
              {group.children.map(child => {
                const active = pathname === pathOnly(child.href)
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={clsx(
                      'flex-1 flex flex-col items-center gap-1 py-2.5 transition-all border',
                      active
                        ? 'bg-forest text-gold-light border-gold-light/40'
                        : 'text-parchment border-transparent hover:text-ivory hover:bg-forest/30'
                    )}
                  >
                    <child.icon size={15} strokeWidth={1.5} />
                    <span className="font-ui uppercase tracking-luxury text-[9px]">
                      {child.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Bottom bar — icons only */}
      <nav className="bg-forest-deep grain-linen border-t border-gold-light/30 px-2 py-3 flex items-center justify-around">
        {NAV.map(item => {
          if (item.kind === 'single') {
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenGroup(null)}
                  aria-label={item.label}
                  title={item.label}
                  className="flex flex-col items-center justify-center gap-1.5 px-1 py-2 min-h-[44px] flex-1 min-w-0 transition-all"
                >
                  <span className="relative flex items-center">
                    <item.icon size={20} strokeWidth={1.5} className="text-parchment/70" />
                    <ArrowUpRight size={9} strokeWidth={2} className="absolute -top-1 -right-1.5 text-gold-light/80" />
                  </span>
                  <span className="h-px w-5 bg-transparent" />
                </a>
              )
            }
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpenGroup(null)}
                aria-label={item.label}
                title={item.label}
                className="flex flex-col items-center justify-center gap-1.5 px-1 py-2 min-h-[44px] flex-1 min-w-0 transition-all"
              >
                <item.icon
                  size={20}
                  strokeWidth={1.5}
                  className={active ? 'text-gold-light' : 'text-parchment/70'}
                />
                <span
                  className={clsx(
                    'h-px w-5 transition-colors',
                    active ? 'bg-gold' : 'bg-transparent'
                  )}
                />
              </Link>
            )
          }

          const groupActive = isGroupActive(item, pathname)
          const groupOpen = openGroup === item.label

          return (
            <button
              key={item.label}
              onClick={() => setOpenGroup(groupOpen ? null : item.label)}
              aria-label={item.label}
              title={item.label}
              className="flex flex-col items-center justify-center gap-1.5 px-1 py-2 min-h-[44px] flex-1 min-w-0 transition-all"
            >
              <span className="relative flex items-center">
                <item.icon
                  size={20}
                  strokeWidth={1.5}
                  className={groupActive || groupOpen ? 'text-gold-light' : 'text-parchment/70'}
                />
                {item.label === 'Wzrost' && insightBadge && (
                  <span
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-gold ring-2 ring-forest-deep"
                    aria-label="Nowy insight"
                  />
                )}
              </span>
              <span
                className={clsx(
                  'h-px w-5 transition-colors',
                  groupActive || groupOpen ? 'bg-gold' : 'bg-transparent'
                )}
              />
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  return (
    <>
      <DesktopNav pathname={pathname} />
      <MobileNav pathname={pathname} />
    </>
  )
}
