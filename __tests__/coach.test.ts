import { describe, it, expect } from 'vitest'
import {
  drainCoachEvents, encodeCoachEvent, checkCoachRequest, MAX_PROMPT_CHARS, COACH_ERROR_TEXT,
} from '@/lib/coach'
import { parseMarkdown, parseInline, inlineText } from '@/lib/miniMarkdown'
import {
  parsePlanBlocks, locateInPlan, planClockMinutes, formatClock, minimumSection,
} from '@/lib/dayPlan'

describe('strumień asystentki', () => {
  it('składa zdarzenia z linii i oddaje niedokończony ogon', () => {
    const wire =
      encodeCoachEvent({ type: 'text', text: 'Dzień ' }) +
      encodeCoachEvent({ type: 'text', text: 'dobry\n— z nową linią' }) +
      '{"type":"te'
    const { events, rest } = drainCoachEvents(wire)
    expect(events).toEqual([
      { type: 'text', text: 'Dzień ' },
      { type: 'text', text: 'dobry\n— z nową linią' },
    ])
    expect(rest).toBe('{"type":"te')
  })

  it('strumień pocięty w dowolnym miejscu daje ten sam tekst', () => {
    const wire =
      encodeCoachEvent({ type: 'text', text: 'żółć „w cudzysłowie”' }) +
      encodeCoachEvent({ type: 'text', text: ' i reszta' }) +
      encodeCoachEvent({ type: 'done', truncated: false, model: 'claude-opus-5-5' })
    for (let cut = 1; cut < wire.length; cut++) {
      let buffer = '', text = '', done = false
      for (const chunk of [wire.slice(0, cut), wire.slice(cut)]) {
        const out = drainCoachEvents(buffer + chunk)
        buffer = out.rest
        for (const e of out.events) {
          if (e.type === 'text') text += e.text
          if (e.type === 'done') done = true
        }
      }
      expect(text).toBe('żółć „w cudzysłowie” i reszta')
      expect(done).toBe(true)
      expect(buffer).toBe('')
    }
  })

  it('pomija śmieci i nieznane kody błędów sprowadza do „unknown”', () => {
    const { events } = drainCoachEvents('nie-json\n{"type":"cos"}\n{"type":"error","code":"wymyslony"}\n\n')
    expect(events).toEqual([{ type: 'error', code: 'unknown', message: COACH_ERROR_TEXT.unknown }])
  })

  it('zapytanie: odrzuca zły rodzaj, pusty i za długi prompt — nie ucina', () => {
    expect(checkCoachRequest({ kind: 'day', prompt: 'brief' })).toEqual({ ok: true, kind: 'day', prompt: 'brief' })
    expect(checkCoachRequest({ kind: 'week', prompt: 'x' })).toEqual({ ok: false, code: 'bad_request' })
    expect(checkCoachRequest({ kind: 'day', prompt: '   ' })).toEqual({ ok: false, code: 'bad_request' })
    expect(checkCoachRequest(null)).toEqual({ ok: false, code: 'bad_request' })
    expect(checkCoachRequest({ kind: 'month', prompt: 'x'.repeat(MAX_PROMPT_CHARS + 1) }))
      .toEqual({ ok: false, code: 'too_long' })
    expect(checkCoachRequest({ kind: 'month', prompt: 'x'.repeat(MAX_PROMPT_CHARS) }).ok).toBe(true)
  })
})

describe('mini-markdown', () => {
  it('rozpoznaje pogrubienie, kursywę, kod i link (zostaje sam tekst)', () => {
    expect(parseInline('**07:30–08:00** — *spokojny* start, `woda` i [plan](https://x.pl)')).toEqual([
      { t: 'bold', v: '07:30–08:00' },
      { t: 'text', v: ' — ' },
      { t: 'italic', v: 'spokojny' },
      { t: 'text', v: ' start, ' },
      { t: 'code', v: 'woda' },
      { t: 'text', v: ' i plan' },
    ])
  })

  it('niedomknięte znaczniki w trakcie strumienia zostają tekstem', () => {
    expect(parseInline('**Rano — zaczynam')).toEqual([{ t: 'text', v: '**Rano — zaczynam' }])
    expect(inlineText(parseInline('2 * 3 * 4'))).toBe('2 * 3 * 4')
  })

  it('składa nagłówki, listy z zagnieżdżeniem, cytat i linię', () => {
    const blocks = parseMarkdown([
      '# Plan na jutro',
      'Ten dzień ma znaczenie.',
      'Druga linia akapitu.',
      '',
      '## Rano',
      '- **07:30–08:00** — rutyna',
      '  - szklanka wody',
      '- **08:00–08:30** — śniadanie',
      '',
      '1. pierwsze',
      '2) drugie',
      '> dasz radę',
      '---',
      '| tabela | zostaje | akapitem |',
    ].join('\n'))
    expect(blocks.map(b => b.type)).toEqual(['heading', 'paragraph', 'heading', 'list', 'list', 'quote', 'rule', 'paragraph'])
    const [h1, para, , list, ordered] = blocks
    expect(h1).toMatchObject({ type: 'heading', level: 1 })
    expect(para).toMatchObject({ type: 'paragraph' })
    if (para.type === 'paragraph') expect(para.lines).toHaveLength(2)
    if (list.type === 'list') {
      expect(list.ordered).toBe(false)
      expect(list.items.map(i => i.depth)).toEqual([0, 1, 0])
    }
    if (ordered.type === 'list') {
      expect(ordered.ordered).toBe(true)
      expect(ordered.items.map(i => i.marker)).toEqual(['1.', '2.'])
    }
  })
})

describe('plan dnia — bloki godzinowe', () => {
  const PLAN = [
    '# Plan na czwartek',
    'Dzień 224 — domykasz tydzień.',
    '',
    '## Rano',
    '- **07:00** — pobudka, szklanka wody',
    '- **07:15–08:00** — rutyna poranna',
    '- 08:00 - 08:30: śniadanie',
    '',
    '## Praca',
    '* **9.00–9.45** — blok głębokiej pracy *(najtrudniejsza rzecz)*',
    '* **09:45–10:00** — przerwa, woda',
    '',
    '## Wieczór',
    '1. **22:30–23:15** — rutyna wieczorna',
    '2. **23:15–00:30** — czytanie',
    '3. **00:30** — sen',
    '',
    'Do rzucenia zostało 142 dni (5.04.2027).',
    '',
    '## Wersja minimum',
    '- 08:00 śniadanie',
    '- woda',
    '- 10 minut spaceru',
  ].join('\n')

  const blocks = parsePlanBlocks(PLAN)

  it('czyta zakresy, same godziny i różne zapisy; pomija sekcję minimum i daty', () => {
    expect(blocks.map(b => [formatClock(b.start), formatClock(b.end), b.label])).toEqual([
      ['07:00', '07:15', 'pobudka, szklanka wody'],
      ['07:15', '08:00', 'rutyna poranna'],
      ['08:00', '08:30', 'śniadanie'],
      ['09:00', '09:45', 'blok głębokiej pracy (najtrudniejsza rzecz)'],
      ['09:45', '10:00', 'przerwa, woda'],
      ['22:30', '23:15', 'rutyna wieczorna'],
      ['23:15', '00:30', 'czytanie'],
      ['00:30', '01:00', 'sen'],
    ])
  })

  it('każdy blok pamięta swoją sekcję planu', () => {
    expect(blocks.map(b => b.section)).toEqual(['Rano', 'Rano', 'Rano', 'Praca', 'Praca', 'Wieczór', 'Wieczór', 'Wieczór'])
  })

  it('godziny po północy liczą się jako dalszy ciąg tego samego dnia', () => {
    const czytanie = blocks.find(b => b.label === 'czytanie')!
    const sen = blocks.find(b => b.label === 'sen')!
    expect(czytanie.end).toBe(24 * 60 + 30)
    expect(sen.start).toBe(24 * 60 + 30)
  })

  it('wskazuje blok „teraz”, następny i ile zostało', () => {
    const at = (h: number, m: number) => locateInPlan(blocks, h * 60 + m)
    expect(at(6, 30)).toMatchObject({ current: null, passed: 0 })
    expect(at(6, 30).next?.label).toBe('pobudka, szklanka wody')
    expect(at(9, 15)).toMatchObject({ minutesLeft: 30, passed: 3 })
    expect(at(9, 15).current?.label).toContain('blok głębokiej pracy')
    expect(at(9, 15).next?.label).toBe('przerwa, woda')
    // Luka w planie: nic nie trwa, ale wiadomo, co będzie.
    expect(at(14, 0).current).toBeNull()
    expect(at(14, 0).next?.label).toBe('rutyna wieczorna')
  })

  it('zegar planu przed 3:00 w nocy należy do poprzedniego dnia', () => {
    expect(planClockMinutes(new Date(2026, 10, 14, 0, 40))).toBe(24 * 60 + 40)
    expect(planClockMinutes(new Date(2026, 10, 14, 7, 5))).toBe(7 * 60 + 5)
    const late = locateInPlan(blocks, planClockMinutes(new Date(2026, 10, 14, 0, 40)))
    expect(late.current?.label).toBe('sen')
  })

  it('wyciąga wersję minimum — także zapisaną pogrubieniem zamiast nagłówka', () => {
    const min = minimumSection(parseMarkdown(PLAN))
    expect(min).toHaveLength(1)
    expect(min[0].type === 'list' && min[0].items.length).toBe(3)

    const alt = minimumSection(parseMarkdown('## Plan\n- 08:00 start\n\n**Wersja minimum:**\n- woda\n- spacer\n\n## Zasady\n- brak'))
    expect(alt[0].type === 'list' && alt[0].items.map(i => inlineText(i.inline))).toEqual(['woda', 'spacer'])
    expect(minimumSection(parseMarkdown('## Plan\n- nic'))).toEqual([])
  })

  it('blok, który wspomina wersję minimum, nie kończy czytania planu', () => {
    const plan = parsePlanBlocks('- **22:00–22:15** — wersja minimum rutyny wieczornej\n- **22:15–23:00** — czytanie\n\n## Wersja minimum\n- 08:00 woda')
    expect(plan.map(b => b.label)).toEqual(['wersja minimum rutyny wieczornej', 'czytanie'])
  })

  it('plan bez godzin nie udaje, że je ma', () => {
    expect(parsePlanBlocks('Zrób 3 rzeczy.\n- 4.5 km spaceru\n- kup 12 jajek')).toEqual([])
  })
})
