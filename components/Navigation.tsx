'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWeeklyInsightBadge } from '@/hooks/useWeeklyInsightBadge'
import {
  Home, Sword, Trophy, BookOpen, CalendarDays,
  LogOut, Settings, Lock, Camera, Scroll,
  Archive, ChevronRight, Moon, Heart,
  Sprout, TreePine, Columns3,
} from 'lucide-react'
import clsx from 'clsx'

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
  {
    kind: 'single',
    href: '/',
    icon: Home,
    label: 'Dziś',
  },
  {
    kind: 'single',
    href: '/quests',
    icon: Sword,
    label: 'Questy',
  },
  {
    kind: 'group',
    icon: Sprout,
    label: 'Wzrost',
    children: [
      { href: '/progress',         icon: TreePine,     label: 'Drzewko' },
      { href: '/timeline?tab=patterns', icon: CalendarDays, label: 'Wzorce' },
      { href: '/pillars',      icon: Columns3,     label: 'Filary' },
      { href: '/achievements', icon: Trophy,       label: 'Osiągnięcia' },
    ],
  },
  {
    kind: 'group',
    icon: Moon,
    label: 'Rytm',
    children: [
      { href: '/cycle',  icon: Moon,     label: 'Cykl' },
      { href: '/serce',  icon: Heart,    label: 'Serce' },
      { href: '/review', icon: BookOpen, label: 'Przegląd' },
    ],
  },
  {
    kind: 'group',
    icon: Archive,
    label: 'Archiwum',
    children: [
      { href: '/vault',   icon: Lock,   label: 'Skarbiec' },
      { href: '/photos',  icon: Camera, label: 'Zdjęcia' },
      { href: '/report',  icon: Scroll, label: 'Raport' },
    ],
  },
  {
    kind: 'single',
    href: '/settings',
    icon: Settings,
    label: 'Ustawienia',
  },
]

// Helpers
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
    // Auto-open the group that contains the current path
    for (const item of NAV) {
      if (item.kind === 'group' && isGroupActive(item, pathname)) return item.label
    }
    return null
  })

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-dark fixed left-0 top-0 z-40 py-8 px-4">
      <div className="mb-10 px-2">
        <h1 className="font-serif text-ivory text-xl">Projekt 30</h1>
        <p className="text-muted-light text-xs font-sans mt-0.5">Twoja transformacja</p>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV.map(item => {
          if (item.kind === 'single') {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm transition-all',
                  active
                    ? 'bg-forest text-gold-light font-medium'
                    : 'text-muted-light hover:text-ivory hover:bg-forest/50'
                )}
              >
                <item.icon size={16} strokeWidth={1.5} />
                {item.label}
              </Link>
            )
          }

          // Group item
          const active = isGroupActive(item, pathname)
          const open = openGroup === item.label || active

          return (
            <div key={item.label}>
              <button
                onClick={() => setOpenGroup(open && !active ? null : item.label)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm transition-all',
                  active
                    ? 'text-gold-light'
                    : 'text-muted-light hover:text-ivory hover:bg-forest/50'
                )}
              >
                <span className="relative flex items-center">
                  <item.icon size={16} strokeWidth={1.5} />
                  {item.label === 'Wzrost' && insightBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gold ring-2 ring-dark" aria-label="Nowy insight" />
                  )}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight
                  size={13}
                  strokeWidth={2}
                  className={clsx('transition-transform duration-200', open && 'rotate-90')}
                />
              </button>

              {open && (
                <div className="ml-3 pl-3 border-l border-forest/40 mt-0.5 mb-1 space-y-0.5">
                  {item.children.map(child => {
                    const childActive = pathname === pathOnly(child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-xl font-sans text-sm transition-all',
                          childActive
                            ? 'bg-forest text-gold-light font-medium'
                            : 'text-muted-light hover:text-ivory hover:bg-forest/50'
                        )}
                      >
                        <child.icon size={14} strokeWidth={1.5} />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <button
        onClick={logOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-xs text-muted-light hover:text-ivory transition-colors mt-4"
      >
        <LogOut size={14} strokeWidth={1.5} />
        Wyloguj
      </button>
    </aside>
  )
}

// ── Mobile bottom nav ────────────────────────────────────────────

function MobileNav({ pathname }: { pathname: string }) {
  const insightBadge = useWeeklyInsightBadge()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on outside click
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

  // Close on navigation
  useEffect(() => { setOpenGroup(null) }, [pathname])

  const activeGroup = NAV.find(
    item => item.kind === 'group' && isGroupActive(item, pathname)
  ) as GroupItem | undefined

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40" ref={sheetRef}>

      {/* Group popover sheet */}
      {openGroup && (() => {
        const group = NAV.find(i => i.kind === 'group' && i.label === openGroup) as GroupItem
        if (!group) return null
        return (
          <div className="bg-dark border-t border-forest/50 px-4 pt-3 pb-2 animate-slide-up">
            <p className="font-sans text-[10px] text-muted-light uppercase tracking-widest mb-2 px-1">
              {group.label}
            </p>
            <div className="flex gap-2">
              {group.children.map(child => {
                const active = pathname === pathOnly(child.href)
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={clsx(
                      'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl font-sans text-[10px] transition-all',
                      active
                        ? 'bg-forest text-gold-light'
                        : 'text-muted-light hover:text-ivory hover:bg-forest/40'
                    )}
                  >
                    <child.icon size={17} strokeWidth={1.5} />
                    <span>{child.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Bottom bar */}
      <nav className="bg-dark border-t border-forest/50 px-1 py-2 flex items-center justify-around">
        {NAV.map(item => {
          if (item.kind === 'single') {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl flex-1 min-w-0 transition-all',
                  active ? 'text-gold-light' : 'text-muted-light'
                )}
              >
                <item.icon size={18} strokeWidth={1.5} />
                <span className="text-[9px] font-sans">{item.shortLabel ?? item.label}</span>
              </Link>
            )
          }

          // Group button
          const groupActive = isGroupActive(item, pathname)
          const groupOpen = openGroup === item.label

          return (
            <button
              key={item.label}
              onClick={() => setOpenGroup(groupOpen ? null : item.label)}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl flex-1 min-w-0 transition-all',
                groupActive || groupOpen ? 'text-gold-light' : 'text-muted-light'
              )}
            >
              <span className="relative flex items-center">
                <item.icon size={18} strokeWidth={1.5} />
                {item.label === 'Wzrost' && insightBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gold ring-2 ring-dark" aria-label="Nowy insight" />
                )}
              </span>
              <span className="text-[9px] font-sans">{item.shortLabel ?? item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// ── Export ───────────────────────────────────────────────────────

export default function Navigation() {
  const pathname = usePathname()
  return (
    <>
      <DesktopNav pathname={pathname} />
      <MobileNav pathname={pathname} />
    </>
  )
}
