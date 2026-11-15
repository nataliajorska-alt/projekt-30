// Mały parser markdownu dla odpowiedzi asystentki. Celowo wąski: nagłówki,
// listy, pogrubienie/kursywa/kod, cytat, linia. Wynik to drzewo, które komponent
// zamienia na elementy Reacta — bez wstawiania HTML-a z tekstu modelu.
//
// Tolerancyjny: nieznana składnia (np. tabela) zostaje zwykłym akapitem,
// niedomknięte `**` w trakcie strumienia wyświetla się jako tekst.

export type Inline = { t: 'text' | 'bold' | 'italic' | 'code'; v: string }

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; inline: Inline[] }
  | { type: 'paragraph'; lines: Inline[][] }
  | { type: 'list'; ordered: boolean; items: { depth: number; marker: string; inline: Inline[] }[] }
  | { type: 'quote'; lines: Inline[][] }
  | { type: 'rule' }

// **pogrubienie** · `kod` · *kursywa* · _kursywa_ · [tekst](adres) → sam tekst
const INLINE = /\*\*([^*\n]+?)\*\*|`([^`\n]+?)`|\*([^*\s][^*\n]*?)\*|\b_([^_\n]+?)_\b|\[([^\]\n]+?)\]\([^)\s]+\)/g

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  const push = (t: Inline['t'], v: string) => {
    if (!v) return
    const last = out[out.length - 1]
    if (t === 'text' && last?.t === 'text') last.v += v
    else out.push({ t, v })
  }
  let at = 0
  INLINE.lastIndex = 0
  for (let m = INLINE.exec(src); m; m = INLINE.exec(src)) {
    push('text', src.slice(at, m.index))
    if (m[1] !== undefined) push('bold', m[1])
    else if (m[2] !== undefined) push('code', m[2])
    else if (m[3] !== undefined) push('italic', m[3])
    else if (m[4] !== undefined) push('italic', m[4])
    else if (m[5] !== undefined) push('text', m[5])
    at = m.index + m[0].length
  }
  push('text', src.slice(at))
  return out
}

const HEADING = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/
const RULE = /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/
const BULLET = /^(\s*)([-*•])\s+(.*)$/
const NUMBER = /^(\s*)(\d{1,3})[.)]\s+(.*)$/
const QUOTE = /^\s{0,3}>\s?(.*)$/

export function parseMarkdown(src: string): MdBlock[] {
  const blocks: MdBlock[] = []
  let para: Inline[][] | null = null
  let quote: Inline[][] | null = null
  let list: Extract<MdBlock, { type: 'list' }> | null = null

  const flush = () => {
    if (para) blocks.push({ type: 'paragraph', lines: para })
    if (quote) blocks.push({ type: 'quote', lines: quote })
    if (list) blocks.push(list)
    para = null; quote = null; list = null
  }

  for (const raw of src.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) { flush(); continue }

    if (RULE.test(line)) { flush(); blocks.push({ type: 'rule' }); continue }

    const h = HEADING.exec(line)
    if (h) {
      flush()
      blocks.push({ type: 'heading', level: Math.min(4, h[1].length) as 1 | 2 | 3 | 4, inline: parseInline(h[2]) })
      continue
    }

    const b = BULLET.exec(line)
    const n = b ? null : NUMBER.exec(line)
    if (b || n) {
      const m = (b ?? n)!
      const ordered = !!n
      const depth = Math.min(2, Math.floor(m[1].replace(/\t/g, '  ').length / 2))
      // Zagnieżdżony punkt zostaje w liście rodzica, nawet gdy zmienia rodzaj znacznika.
      if (!list || (depth === 0 && list.ordered !== ordered)) {
        flush()
        list = { type: 'list', ordered, items: [] }
      }
      list.items.push({ depth, marker: ordered ? `${m[2]}.` : '◆', inline: parseInline(m[3]) })
      continue
    }

    const q = QUOTE.exec(line)
    if (q) {
      if (!quote) { flush(); quote = [] }
      quote.push(parseInline(q[1]))
      continue
    }

    if (!para) { flush(); para = [] }
    para.push(parseInline(line.trim()))
  }
  flush()
  return blocks
}

/** Sam tekst, bez znaczników — do schowka, udostępniania i podglądów. */
export const inlineText = (inline: Inline[]): string => inline.map(i => i.v).join('')
