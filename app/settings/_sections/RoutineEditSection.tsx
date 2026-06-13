'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { Sun, Moon, Sparkles, Plus, X, RotateCcw } from 'lucide-react'
import { useRoutineConfig } from '@/hooks/useRoutineConfig'
import { SmallCaps, Diamond, RomanNumeral } from '@/components/ui'

type RoutineTab = 'morning' | 'daily' | 'evening'

const ROUTINE_TABS: { id: RoutineTab; label: string; icon: typeof Sun; roman: number }[] = [
  { id: 'morning', label: 'Ranek',   icon: Sun,      roman: 1 },
  { id: 'daily',   label: 'Dzień',   icon: Sparkles, roman: 2 },
  { id: 'evening', label: 'Wieczór', icon: Moon,     roman: 3 },
]

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={clsx(
        'flex-shrink-0 w-9 h-5 transition-colors relative border',
        on ? 'bg-gold border-gold' : 'bg-cream/50 border-hairline'
      )}
    >
      <div
        className={clsx(
          'absolute top-0.5 w-3.5 h-3.5 transition-transform',
          on ? 'bg-ivory left-[18px]' : 'bg-muted-light left-0.5'
        )}
      />
    </button>
  )
}

export default function RoutineEditSection() {
  const {
    getDefaultItems, getCustomItems, isItemDisabled,
    toggleItemEnabled, addCustomItem, removeCustomItem, resetToDefaults,
  } = useRoutineConfig()

  const [tab, setTab] = useState<RoutineTab>('morning')
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newXP, setNewXP] = useState(10)

  const defaults = getDefaultItems(tab)
  const customs = getCustomItems(tab)

  const handleAdd = () => {
    if (!newText.trim()) return
    addCustomItem(newText.trim(), tab, newXP)
    setNewText(''); setNewXP(10); setAdding(false)
  }

  return (
    <section className="panel-frame bg-ivory border border-hairline overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} strokeWidth={1.5} className="text-gold-deep" />
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Rutyna
            </SmallCaps>
          </div>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-muted-light hover:text-gold-deep transition-colors"
          >
            <RotateCcw size={10} strokeWidth={1.5} />
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              przywróć domyślne
            </SmallCaps>
          </button>
        </div>
        <h2 className="font-display text-dark text-[22px] tracking-tight mt-1">Edytuj elementy</h2>
        <p className="font-serif-body italic text-muted text-[13px] mt-1">
          wyłącz elementy, których nie potrzebujesz, lub dodaj własne.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-hairline mx-6">
        {ROUTINE_TABS.map(({ id, label, roman }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => { setTab(id); setAdding(false) }}
              className="flex-1 group flex flex-col items-center gap-1.5 py-3 transition-colors"
            >
              <span className="flex items-baseline gap-2">
                <RomanNumeral
                  value={roman}
                  className={clsx(
                    'text-sm transition-colors',
                    active ? 'text-gold' : 'text-muted-light group-hover:text-gold-light'
                  )}
                />
                <SmallCaps tone={active ? 'gold' : 'muted'} tracking="luxury" size="sm">
                  {label}
                </SmallCaps>
              </span>
              <span className={clsx('h-px w-10 transition-colors', active ? 'bg-gold' : 'bg-transparent')} />
            </button>
          )
        })}
      </div>

      {/* Items */}
      <div className="px-6 py-3 space-y-1.5">
        {defaults.length === 0 && customs.length === 0 && (
          <p className="font-serif-body italic text-muted-light text-[13px] py-5 text-center">
            brak elementów w tej kategorii.
          </p>
        )}

        {defaults.map((item) => {
          const disabled = isItemDisabled(item.id)
          return (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2">
              <Toggle on={!disabled} onClick={() => toggleItemEnabled(item.id)} />
              <span
                className={clsx(
                  'font-serif-body text-[14px] flex-1',
                  disabled ? 'text-muted line-through decoration-1' : 'text-dark'
                )}
              >
                {item.text}
              </span>
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                + {item.xp}
              </SmallCaps>
            </div>
          )
        })}

        {customs.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-gold-pale/40 border border-gold-light/40">
            <Diamond size={6} className="text-gold shrink-0" filled />
            <span className="font-serif-body italic text-dark text-[14px] flex-1">{item.text}</span>
            <SmallCaps tone="gold" tracking="luxury" size="xs">
              + {item.xp}
            </SmallCaps>
            <button
              onClick={() => removeCustomItem(item.id)}
              className="text-muted hover:text-red-500 transition-colors"
              aria-label="Usuń"
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {/* Add custom */}
      <div className="px-6 pb-5">
        {adding ? (
          <div className="border border-hairline p-4 space-y-3">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full border border-hairline bg-cream/40 px-4 py-2.5 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold transition-colors"
              placeholder="nazwa elementu…"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <SmallCaps tone="muted" tracking="luxury" size="xs">XP:</SmallCaps>
              <select
                value={newXP}
                onChange={(e) => setNewXP(Number(e.target.value))}
                className="border border-hairline bg-cream/40 px-2 py-1.5 font-serif-body text-[13px] text-dark focus:outline-none focus:border-gold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={() => setAdding(false)}
                className="font-ui uppercase tracking-luxury text-[10px] text-muted-light hover:text-dark transition-colors"
              >
                anuluj
              </button>
              <button
                onClick={handleAdd}
                disabled={!newText.trim()}
                className="bg-dark-deep text-ivory border border-gold py-2 px-4 hover:bg-forest transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                <Diamond size={4} className="text-gold" />
                <SmallCaps tone="ivory" tracking="luxury" size="xs">
                  dodaj
                </SmallCaps>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-muted hover:text-gold-deep transition-colors"
          >
            <Plus size={12} strokeWidth={1.5} />
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              dodaj własny element
            </SmallCaps>
          </button>
        )}
      </div>
    </section>
  )
}
