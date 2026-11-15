'use client'
import { Fragment, useMemo } from 'react'
import clsx from 'clsx'
import { parseMarkdown, type Inline, type MdBlock } from '@/lib/miniMarkdown'
import { Diamond } from '@/components/ui'

// Odpowiedź asystentki w typografii apki. Tekst modelu nigdy nie idzie jako HTML —
// parser (lib/miniMarkdown) zwraca drzewo, a tu powstają z niego elementy Reacta.

export function InlineText({ inline }: { inline: Inline[] }) {
  return (
    <>
      {inline.map((s, i) => {
        switch (s.t) {
          case 'bold': return <strong key={i} className="font-semibold text-dark">{s.v}</strong>
          case 'italic': return <em key={i}>{s.v}</em>
          case 'code': return <code key={i} className="font-mono text-[0.85em] bg-cream px-1">{s.v}</code>
          default: return <Fragment key={i}>{s.v}</Fragment>
        }
      })}
    </>
  )
}

export function MdBlocks({ blocks, className }: { blocks: MdBlock[]; className?: string }) {
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            if (b.level <= 1) {
              return (
                <h3 key={i} className="font-display text-dark text-[21px] leading-tight mt-5 first:mt-0 mb-2">
                  <InlineText inline={b.inline} />
                </h3>
              )
            }
            if (b.level === 2) {
              return (
                <div key={i} className="flex items-center gap-2 mt-5 first:mt-0 mb-2">
                  <Diamond size={5} className="text-gold" />
                  <h4 className="font-ui uppercase tracking-luxury text-[10px] text-gold-deep">
                    <InlineText inline={b.inline} />
                  </h4>
                  <span className="h-px flex-1 bg-hairline/70" />
                </div>
              )
            }
            return (
              <h5 key={i} className="font-display text-dark text-[16px] leading-snug mt-4 first:mt-0 mb-1.5">
                <InlineText inline={b.inline} />
              </h5>
            )
          case 'paragraph':
            return (
              <p key={i} className="font-serif-body text-dark text-[15.5px] leading-relaxed mb-3 last:mb-0">
                {b.lines.map((line, j) => (
                  <Fragment key={j}>{j > 0 && <br />}<InlineText inline={line} /></Fragment>
                ))}
              </p>
            )
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul'
            return (
              <Tag key={i} className="mb-3 last:mb-0 space-y-1.5">
                {b.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex gap-2.5 font-serif-body text-dark text-[15px] leading-snug"
                    style={item.depth ? { paddingLeft: item.depth * 18 } : undefined}
                  >
                    {b.ordered ? (
                      <span className="font-ui tabular-nums text-[11px] text-gold-deep w-5 shrink-0 pt-[0.2em]">{item.marker}</span>
                    ) : (
                      <span className={clsx('shrink-0 rotate-45 mt-[0.5em]', item.depth ? 'w-1 h-1 border border-gold' : 'w-1.5 h-1.5 bg-gold')} />
                    )}
                    <span className="min-w-0"><InlineText inline={item.inline} /></span>
                  </li>
                ))}
              </Tag>
            )
          }
          case 'quote':
            return (
              <blockquote key={i} className="border-l-2 border-gold-light pl-3 mb-3 last:mb-0 font-serif-body italic text-muted text-[15px] leading-relaxed">
                {b.lines.map((line, j) => (
                  <Fragment key={j}>{j > 0 && <br />}<InlineText inline={line} /></Fragment>
                ))}
              </blockquote>
            )
          case 'rule':
            return <div key={i} className="my-4 h-px bg-hairline/80" />
        }
      })}
    </div>
  )
}

export default function CoachMarkdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  const blocks = useMemo(() => parseMarkdown(text), [text])
  return (
    <div>
      <MdBlocks blocks={blocks} />
      {streaming && (
        <span aria-hidden className="inline-block w-2 h-4 align-middle bg-gold/70 animate-pulse mt-1" />
      )}
    </div>
  )
}
