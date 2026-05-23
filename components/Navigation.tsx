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
  Archive, ChevronRight, Moon, Heart,
  Sprout, TreePine, Columns3,
} from 'lucide-react'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'

// ── Nav structure ────────────────────────────────────────────────

type SingleItem = {
  kind: 'single'
  href: string
  icon: React.ElementType
  label: string
  shortLabel?: string
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
      { href: '/vault',  icon: Lock,   label: 'Skarbiec' },
      { href: '/photos', icon: Camera, label: 'Zdjęcia' },
      { href: '/report', icon: Scroll, label: 'Raport' },
    ],
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

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-forest-deep grain-linen fixed left-0 top-0 z-40 py-8 px-4">
      {/* gold inset frame */}
      <div className="pointer-events-none absolute inset-3 border-r border-gold-light/20" />

      <div className="relative mb-10 px-2 text-center">
        <h1 className="font-display text-ivory text-2xl leading-none">Projekt 30</h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="h-px w-8 bg-gold-light/40" />
          <Fleuron size={9} className="text-gold" />
          <span className="h-px w-8 bg-gold-light/40" />
        </div>
        <SmallCaps tone="parchment" tracking="editorial" size="xs" as="div" className="mt-3 opacity-80">
          a year of becoming
        </SmallCaps>
      </div>

      <nav className="relative flex-1 space-y-0.5">
        {NAV.map(item => {
          if (item.kind === 'single') {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 transition-all group',
                  active ? 'bg-forest text-gold-light' : 'text-parchment hover:text-ivory hover:bg-forest/40'
                )}
              >
                <Diamond
                  size={6}
                  filled={active}
                  className={active ? 'text-gold' : 'text-gold/40 group-hover:text-gold-light'}
                />
                <span
                  className={clsx(
                    'font-ui text-[12px] uppercase tracking-luxury transition-colors',
                    active ? 'text-gold-light' : ''
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          }

          const active = isGroupActive(item, pathname)
          const open = openGroup === item.label || active

          return (
            <div key={item.label}>
              <button
                onClick={() => setOpenGroup(open && !active ? null : item.label)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 transition-all group',
                  active ? 'text-gold-light' : 'text-parchment hover:text-ivory hover:bg-forest/40'
                )}
              >
                <span className="relative flex items-center">
                  <Diamond
                    size={6}
                    filled={active}
                    className={active ? 'text-gold' : 'text-gold/40 group-hover:text-gold-light'}
                  />
                  {item.label === 'Wzrost' && insightBadge && (
                    <span
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-gold ring-2 ring-forest-deep"
                      aria-label="Nowy insight"
                    />
                  )}
                </span>
                <span className="flex-1 text-left font-ui text-[12px] uppercase tracking-luxury">
                  {item.label}
                </span>
                <ChevronRight
                  size={11}
                  strokeWidth={1.5}
                  className={clsx('transition-transform duration-200', open && 'rotate-90')}
                />
              </button>

              {open && (
                <div className="ml-3 pl-3 border-l border-gold-deep/30 mt-1 mb-2 space-y-0.5">
                  {item.children.map(child => {
                    const childActive = pathname === pathOnly(child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2 transition-all',
                          childActive
                            ? 'bg-forest text-gold-light'
                            : 'text-parchment/80 hover:text-ivory hover:bg-forest/30'
                        )}
                      >
                        <Diamond size={4} className={childActive ? 'text-gold' : 'text-gold-deep/60'} />
                        <span className="font-serif-body italic text-[13px]">{child.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="relative mt-6 pt-5 border-t border-gold-deep/30">
        <button
          onClick={logOut}
          className="flex items-center gap-3 px-3 py-2 text-parchment hover:text-ivory transition-colors"
        >
          <LogOut size={11} strokeWidth={1.5} />
          <SmallCaps tone="parchment" tracking="luxury" size="xs">
            wyloguj
          </SmallCaps>
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
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className="flex flex-col items-center gap-1.5 px-1 py-1 flex-1 min-w-0 transition-all"
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
              className="flex flex-col items-center gap-1.5 px-1 py-1 flex-1 min-w-0 transition-all"
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
