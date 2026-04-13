'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Home, Sword, Layers, Trophy, BookOpen, CalendarDays, LogOut, Settings } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/',             icon: Home,         label: 'Dziś' },
  { href: '/quests',       icon: Sword,        label: 'Questy' },
  { href: '/timeline',     icon: CalendarDays, label: 'Historia' },
  { href: '/achievements', icon: Trophy,       label: 'Osiągnięcia' },
  { href: '/review',       icon: BookOpen,     label: 'Przegląd' },
  { href: '/settings',     icon: Settings,     label: 'Ustawienia' },
]

export default function Navigation() {
  const pathname = usePathname()
  const { logOut } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-dark fixed left-0 top-0 z-40 py-8 px-4">
        <div className="mb-10 px-2">
          <h1 className="font-serif text-ivory text-xl">Projekt 30</h1>
          <p className="text-muted-light text-xs font-sans mt-0.5">Twoja transformacja</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm transition-all cursor-pointer',
                  active
                    ? 'bg-forest text-gold-light font-medium'
                    : 'text-muted-light hover:text-ivory hover:bg-forest/50'
                )}
              >
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </Link>
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark border-t border-forest/50 px-1 py-2 flex items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          const shortLabel = label === 'Osiągnięcia' ? 'Trofea' : label
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all flex-1 min-w-0 cursor-pointer',
                active ? 'text-gold-light' : 'text-muted-light'
              )}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="text-[9px] font-sans truncate">{shortLabel}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
