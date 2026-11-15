'use client'
import { Fragment, useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  parsePlanBlocks, locateInPlan, minimumSection, formatClock, formatDuration, type PlanBlock,
} from '@/lib/dayPlan'
import { parseMarkdown, type MdBlock } from '@/lib/miniMarkdown'
import { SmallCaps, Diamond } from '@/components/ui'
import CoachMarkdown, { MdBlocks } from './CoachMarkdown'

// Plan dnia jako oś czasu: godziny po lewej, bloki po prawej, „teraz" podświetlone
// z paskiem upływu, minione wyciszone. Plan bez godzin (model nie trzymał formatu)
// pokazujemy po prostu jako tekst — nic nie ginie.

interface Props {
  text: string
  /** Minuty zegara planu (planClockMinutes) — tylko dla planu na dziś, inaczej null. */
  nowMin: number | null
  /** Skrót na karcie: kilka najbliższych bloków zamiast całego dnia. */
  compact?: boolean
}

const COMPACT_ROWS = 4

type RowState = 'past' | 'now' | 'next' | 'later'

/** Akapity przed pierwszą listą — wstęp asystentki („dlaczego ten dzień ma znaczenie"). */
function lead(md: MdBlock[]): MdBlock[] {
  const out: MdBlock[] = []
  for (const b of md) {
    if (b.type === 'paragraph' || b.type === 'quote') out.push(b)
    else if (b.type === 'heading' && b.level === 1) continue // tytuł planu — nagłówek jest już w karcie
    else break
  }
  return out
}

function NowMeter({ block, nowMin }: { block: PlanBlock; nowMin: number }) {
  const total = Math.max(1, block.end - block.start)
  const pct = Math.min(100, Math.max(0, ((nowMin - block.start) / total) * 100))
  return (
    <div className="mt-2 flex items-center gap-2.5">
      <SmallCaps tone="gold-deep" size="xs">teraz</SmallCaps>
      <span className="relative flex-1 h-[3px] bg-hairline/70 overflow-hidden">
        <span className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-ui tabular-nums text-[10.5px] text-muted whitespace-nowrap">
        zostało {formatDuration(block.end - nowMin)}
      </span>
    </div>
  )
}

export default function PlanTimeline({ text, nowMin, compact = false }: Props) {
  const md = useMemo(() => parseMarkdown(text), [text])
  const blocks = useMemo(() => parsePlanBlocks(text), [text])
  const [expanded, setExpanded] = useState(false)

  if (blocks.length === 0) return <CoachMarkdown text={text} />

  const pos = nowMin === null ? null : locateInPlan(blocks, nowMin)
  const focus = pos?.current ?? pos?.next ?? null
  const short = compact && !expanded
  const from = short && focus ? blocks.indexOf(focus) : 0
  const visible = short ? blocks.slice(from, from + COMPACT_ROWS) : blocks
  const hidden = blocks.length - visible.length
  const intro = lead(md)
  const minimum = compact ? [] : minimumSection(md)

  const stateOf = (b: PlanBlock): RowState => {
    if (!pos || nowMin === null) return 'later'
    if (b === pos.current) return 'now'
    if (b.end <= nowMin) return 'past'
    if (b === pos.next) return 'next'
    return 'later'
  }

  return (
    <div>
      {!compact && intro.length > 0 && (
        <MdBlocks blocks={intro} className="mb-5 [&_p]:italic [&_p]:text-muted [&_p]:text-[15px]" />
      )}

      {pos && !pos.current && pos.passed === blocks.length && (
        <p className="font-serif-body italic text-muted text-[14px] mb-3">
          wszystkie bloki planu za Tobą — reszta wieczoru jest Twoja.
        </p>
      )}

      <ol aria-label="Plan dnia godzina po godzinie">
        {visible.map((b, i) => {
          const state = stateOf(b)
          const showSection = b.section && b.section !== visible[i - 1]?.section
          return (
            <Fragment key={`${b.start}-${i}`}>
              {showSection && (
                <li aria-hidden className="flex items-center gap-2 mt-3 first:mt-0 mb-2">
                  <SmallCaps tone="gold-deep" size="xs">{b.section}</SmallCaps>
                  <span className="h-px flex-1 bg-hairline/60" />
                </li>
              )}
              <li
                aria-current={state === 'now' ? 'step' : undefined}
                className={clsx(
                  'grid grid-cols-[3.1rem_1fr] gap-x-3',
                  state === 'now' && 'bg-gold-pale/45 -mx-2 px-2 pt-2',
                )}
              >
                <div className="text-right pt-[1px]">
                  <div className={clsx('font-ui tabular-nums text-[12px] leading-tight', state === 'past' ? 'text-muted' : 'text-dark')}>
                    {formatClock(b.start)}
                  </div>
                  <div className="font-ui tabular-nums text-[10px] leading-tight text-muted mt-0.5">
                    {formatClock(b.end)}
                  </div>
                </div>
                <div className="relative pl-5 pb-4 border-l border-hairline">
                  <span
                    aria-hidden
                    className={clsx(
                      'absolute -left-[5.5px] top-[4px] w-[10px] h-[10px] rotate-45 border',
                      state === 'now' && 'bg-gold border-gold shadow-[0_0_0_3px_rgba(178,147,85,0.18)]',
                      state === 'past' && 'bg-gold-light/70 border-gold-light',
                      state === 'next' && 'bg-ivory border-gold',
                      state === 'later' && 'bg-ivory border-hairline',
                    )}
                  />
                  <p
                    className={clsx(
                      'leading-snug',
                      state === 'now' ? 'font-display text-dark text-[16.5px]' : 'font-serif-body text-[15px]',
                      state === 'past' ? 'text-muted' : 'text-dark',
                    )}
                  >
                    {b.label}
                  </p>
                  {state === 'now' && nowMin !== null && <NowMeter block={b} nowMin={nowMin} />}
                  {state === 'next' && (
                    <SmallCaps tone="gold-deep" size="xs" as="div" className="mt-1">
                      następne{nowMin !== null && b.start > nowMin ? ` · za ${formatDuration(b.start - nowMin)}` : ''}
                    </SmallCaps>
                  )}
                </div>
              </li>
            </Fragment>
          )
        })}
      </ol>

      {compact && (hidden > 0 || expanded) && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-1 font-ui uppercase tracking-luxury text-[10px] text-gold-deep hover:text-dark transition-colors"
        >
          {expanded ? 'zwiń' : `cały plan · jeszcze ${hidden} ${hidden === 1 ? 'blok' : hidden < 5 ? 'bloki' : 'bloków'}`}
        </button>
      )}

      {minimum.length > 0 && (
        <div className="mt-5 border border-dashed border-gold-light bg-cream/50 px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="gold-deep" size="xs">wersja minimum · gdy dzień się sypie</SmallCaps>
          </div>
          <MdBlocks blocks={minimum} />
        </div>
      )}

      {!compact && (
        <details className="mt-5 group">
          <summary className="cursor-pointer list-none font-ui uppercase tracking-luxury text-[10px] text-muted hover:text-dark transition-colors">
            <span className="group-open:hidden">pokaż cały tekst od asystentki</span>
            <span className="hidden group-open:inline">ukryj tekst</span>
          </summary>
          <div className="mt-3 border-l-2 border-hairline pl-4">
            <CoachMarkdown text={text} />
          </div>
        </details>
      )}
    </div>
  )
}
