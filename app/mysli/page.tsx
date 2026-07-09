'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { ChevronLeft, ChevronDown, Plus, X } from 'lucide-react'
import { useCBT } from '@/hooks/useCBT'
import { RitualSurface, SmallCaps, GoldRule, Diamond, Fleuron } from '@/components/ui'
import { XP_VALUES, todayKey, getISOWeekKey, getEffectiveNow } from '@/lib/gameLogic'
import {
  SOCRATIC, BOOK_SHIELD, COPING_STYLES, copingStyle, restructureComplete, upsertPctWeek,
  experimentComplete, sortRungs, emptyExperiment, emptyExposureRung, cbtUid,
  type CBTThoughtEntry, type CBTEmotionEntry, type CBTBeliefEntry, type CBTBeliefPctPoint, type CBTCopingEntry, type CBTCopingStyle,
  type CBTBeliefExperiment, type CBTExposureLadder, type CBTExposureRung, type CBTEmotionTag, type CBTShield,
} from '@/lib/cbt-data'

const ROSE = '#8f4d63'
const DOWN = '#3f7d5c' // natężenie spadło — dobrze
const UP = '#8A3A2C'   // natężenie wzrosło — wino

// ── Formatowanie daty ──────────────────────────────────────────────
const MONTHS = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia']
const DAYS = ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota']
function fmtDate(ts: number): string {
  const d = new Date(ts)
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ════════════════════════════════════════════════════════════════════
//  STRONA
// ════════════════════════════════════════════════════════════════════
type Tab = 'mysli' | 'emocje' | 'przekonania' | 'style' | 'ekspozycja' | 'tarcza'

export default function CBTPage() {
  const cbt = useCBT()
  const [tab, setTab] = useState<Tab>('mysli')

  return (
    <RitualSurface tone="forest-deep" frame="double" className="animate-fade-in">
      <style>{`
        .cbt-card{position:relative;background:#dcd5bc;color:#2a2a26;border:1px solid rgba(178,147,85,.20);box-shadow:0 14px 34px -28px rgba(0,0,0,.5)}
        .cbt-card::before,.cbt-card::after{content:"";position:absolute;width:11px;height:11px;border:1px solid #c9b27f;opacity:.85;pointer-events:none}
        .cbt-card::before{top:9px;left:9px;border-right:0;border-bottom:0}
        .cbt-card::after{bottom:9px;right:9px;border-left:0;border-top:0}
        .cbt-ta,.cbt-input{width:100%;color:#2a2a26;font-family:'Cormorant Garamond','EB Garamond',serif;font-size:15px;line-height:26px;padding:9px 14px;outline:none;background:#d2cab0;border:1px solid #d9cda8;transition:border-color .15s,box-shadow .15s}
        .cbt-ta{resize:vertical;min-height:62px;line-height:28px}
        .cbt-ta::placeholder,.cbt-input::placeholder{color:#9d9173;font-style:italic}
        .cbt-ta:focus,.cbt-input:focus{border-color:#b56a82;box-shadow:0 0 0 3px rgba(181,106,130,.12)}
        .cbt-lab{display:block;font-family:'Bodoni Moda',serif;font-weight:500;font-size:15px;color:#2a2a26;margin-bottom:6px}
        .cbt-hint{display:block;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13px;color:#7c7256;margin-top:1px;font-weight:400}
        .cbt-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:4px;background:#c3b994;outline:none}
        .cbt-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#f1ebda;border:2px solid ${ROSE};cursor:pointer}
        .cbt-range::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#f1ebda;border:2px solid ${ROSE};cursor:pointer}
      `}</style>

      <div className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-10 pt-10 pb-16">
        <Link href="/" className="inline-flex items-center gap-1 font-ui uppercase tracking-luxury text-[10px] text-parchment hover:text-gold-light transition-colors mb-6">
          <ChevronLeft size={12} /> Wróć
        </Link>

        {/* Header */}
        <header className="text-center">
          <SmallCaps tone="gold-light" tracking="editorial" size="xs">
            Reading Room · Myśli i emocje
          </SmallCaps>
          <h1 className="font-display text-ivory text-[clamp(1.9rem,5vw,2.4rem)] leading-[1.06] mt-4">
            Codzienny trening
            <span className="block font-serif-body italic text-parchment text-[14px] mt-2">
              złap myśl · rozbrój ją · wróć do siebie
            </span>
          </h1>
          <GoldRule variant="fleuron" tone="gold" className="mt-6 max-w-xs mx-auto" />
        </header>

        {/* Zakładki — 6 sztuk: dwa rzędy po 3 (każda col-span-2 z 6) */}
        <div className="mt-9 grid grid-cols-6 gap-1.5 border border-gold-light/25 p-1.5">
          {([['mysli','Myśli'],['emocje','Emocje'],['przekonania','Przekonania'],['style','Style'],['ekspozycja','Ekspozycja'],['tarcza','Tarcza']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'py-2.5 col-span-2 transition-colors text-center',
                tab === key ? 'bg-forest/60 border border-gold-light/30' : 'hover:bg-forest/30 border border-transparent',
              )}
            >
              <SmallCaps tone={tab === key ? 'gold-light' : 'parchment'} tracking="luxury" size="xs">{label}</SmallCaps>
            </button>
          ))}
        </div>

        <div className="mt-7">
          {cbt.loading ? (
            <div className="cbt-card h-40 animate-pulse" />
          ) : tab === 'mysli' ? (
            <ThoughtTab cbt={cbt} />
          ) : tab === 'emocje' ? (
            <EmotionTab cbt={cbt} />
          ) : tab === 'przekonania' ? (
            <BeliefTab cbt={cbt} />
          ) : tab === 'style' ? (
            <CopingTab cbt={cbt} />
          ) : tab === 'ekspozycja' ? (
            <ExposureTab cbt={cbt} />
          ) : (
            <ShieldTab shield={cbt.shield} onSave={cbt.saveShield} />
          )}
        </div>

        {/* Stopka */}
        <footer className="mt-16">
          <GoldRule variant="diamond" tone="gold-deep" className="max-w-sm mx-auto opacity-40" />
          <div className="mt-4 flex items-center justify-center gap-3">
            <Fleuron size={10} className="text-gold-deep" />
            <SmallCaps tone="parchment" tracking="editorial" size="xs">
              narzędzie do pracy własnej · nie zastępuje terapeuty
            </SmallCaps>
            <Fleuron size={10} className="text-gold-deep" />
          </div>
        </footer>
      </div>
    </RitualSurface>
  )
}

// ════════════════════════════════════════════════════════════════════
//  ZAKŁADKA: MYŚLI
// ════════════════════════════════════════════════════════════════════
function ThoughtTab({ cbt }: { cbt: ReturnType<typeof useCBT> }) {
  const [situation, setSituation] = useState('')
  const [thoughtsText, setThoughtsText] = useState('')
  const [emotions, setEmotions] = useState<{ name: string; pct: string }[]>([{ name: '', pct: '' }])
  const [altText, setAltText] = useState('')
  const [altPct, setAltPct] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const addEmotion = () => emotions.length < 6 && setEmotions([...emotions, { name: '', pct: '' }])
  const setEmo = (i: number, k: 'name' | 'pct', v: string) =>
    setEmotions(emotions.map((e, j) => j === i ? { ...e, [k]: k === 'pct' ? v.replace(/[^0-9]/g, '').slice(0, 3) : v } : e))
  const rmEmo = (i: number) => setEmotions(emotions.filter((_, j) => j !== i))

  const save = async () => {
    const emo: CBTEmotionTag[] = emotions.filter(e => e.name.trim()).map(e => ({ name: e.name.trim(), pct: Number(e.pct) || 0 }))
    if (!situation.trim() && !thoughtsText.trim() && !emo.length && !altText.trim()) {
      setFlash('Najpierw coś zapisz'); setTimeout(() => setFlash(null), 1500); return
    }
    const created = await cbt.createThought({
      situation: situation.trim(), emotions: emo, thoughts: thoughtsText.trim(),
      alt: altText.trim(), altPct: Math.min(100, Number(altPct) || 0),
    })
    setSituation(''); setThoughtsText(''); setEmotions([{ name: '', pct: '' }]); setAltText(''); setAltPct('')
    setFlash(created && created.xpEarned > 0 ? `Zapisano · +${created.xpEarned} XP` : 'Zapisano ✓')
    setTimeout(() => setFlash(null), 1800)
  }

  return (
    <div>
      <p className="font-serif-body italic text-parchment text-[14px] leading-[1.8] text-center mb-7 max-w-lg mx-auto">
        Złap sytuację, emocje z ich natężeniem i myśli, które pojawiły się automatycznie.
        Robiąc to codziennie i patrząc na nie z boku, łatwiej zauważyć, jak nieracjonalne bywają.
      </p>

      {/* Formularz */}
      <div className="cbt-card px-6 md:px-8 py-7">
        <div className="mb-5">
          <label className="cbt-lab">Sytuacja<span className="cbt-hint">Gdzie i kiedy dokładnie? Co się działo?</span></label>
          <textarea className="cbt-ta" rows={3} value={situation} onChange={e => setSituation(e.target.value)}
            placeholder="Piątek, 19.30. Dostaję maila z wynikami kolokwium…" />
        </div>

        <div className="mb-5">
          <label className="cbt-lab">Emocje i ich natężenie</label>
          {emotions.map((e, i) => (
            <div key={i} className="grid grid-cols-[1fr_92px_28px] gap-2 items-center mb-2">
              <input className="cbt-input" value={e.name} onChange={ev => setEmo(i, 'name', ev.target.value)} placeholder="złość" />
              <div className="relative">
                <input className="cbt-input text-right pr-7" inputMode="numeric" value={e.pct} onChange={ev => setEmo(i, 'pct', ev.target.value)} placeholder="90" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#7c7256] pointer-events-none">%</span>
              </div>
              {emotions.length > 1
                ? <button onClick={() => rmEmo(i)} aria-label="usuń" className="text-[#7c7256] hover:text-[#8A3A2C] transition-colors flex justify-center"><X size={16} /></button>
                : <span />}
            </div>
          ))}
          {emotions.length < 6 && (
            <button onClick={addEmotion} className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 border border-dashed border-[#c9b27f] text-[#6f6448] hover:border-[#b56a82] transition-colors">
              <Plus size={13} /><span className="font-ui uppercase tracking-luxury text-[10px]">dodaj emocję</span>
            </button>
          )}
        </div>

        <div className="mb-5">
          <label className="cbt-lab">Myśli automatyczne<span className="cbt-hint">Co przeleciało Ci przez głowę?</span></label>
          <textarea className="cbt-ta" rows={3} value={thoughtsText} onChange={e => setThoughtsText(e.target.value)}
            placeholder="Jak zwykle zawaliłam. Jestem za głupia. Nic mi się nie udaje." />
        </div>

        <div className="mb-6">
          <label className="cbt-lab">Myśl alternatywna<span className="cbt-hint">Łagodniej i prawdziwiej — jak inaczej dałoby się to ująć?</span></label>
          <textarea className="cbt-ta" rows={3} value={altText} onChange={e => setAltText(e.target.value)}
            placeholder="Jedno kolokwium nie przesądza o niczym. Wiele rzeczy mi wychodzi." />
          <div className="grid grid-cols-[1fr_92px] gap-2 items-center mt-2.5">
            <span className="cbt-lab mb-0 font-normal" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '14px' }}>Na ile w nią wierzę?</span>
            <div className="relative">
              <input className="cbt-input text-right pr-7" inputMode="numeric" value={altPct}
                onChange={e => setAltPct(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} placeholder="40" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#7c7256] pointer-events-none">%</span>
            </div>
          </div>
        </div>

        <SaveButton onClick={save} flash={flash}>zapisz wpis</SaveButton>
      </div>

      {/* Lista wpisów */}
      <div className="mt-9 mb-4 flex items-center gap-2">
        <Diamond size={6} className="text-gold" />
        <SmallCaps tone="gold-light" tracking="luxury" size="xs">Twoje wpisy · {cbt.thoughts.length}</SmallCaps>
      </div>

      {cbt.thoughts.length === 0 ? (
        <EmptyNote>Tu pojawią się Twoje wpisy. Pierwszy krok to po prostu zauważyć.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {cbt.thoughts.map(t => (
            <ThoughtRow key={t.id} entry={t} open={openId === t.id}
              onToggle={() => setOpenId(openId === t.id ? null : t.id)}
              onSave={cbt.updateThought} onDelete={() => { cbt.deleteEntry(t.id); setOpenId(null) }} />
          ))}
        </div>
      )}
    </div>
  )
}

function ThoughtRow({ entry, open, onToggle, onSave, onDelete }: {
  entry: CBTThoughtEntry; open: boolean; onToggle: () => void
  onSave: (id: string, patch: Partial<Pick<CBTThoughtEntry, 'hot' | 'interro' | 'reframe' | 'reframeFeel'>>) => Promise<void>
  onDelete: () => void
}) {
  return (
    <div className="cbt-card">
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">{fmtDate(entry.timestamp)}</div>
          <div className="font-serif-body text-[15px] text-[#2a2a26] mt-1 line-clamp-2">{entry.situation || entry.thoughts || '(bez opisu)'}</div>
          {entry.emotions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entry.emotions.map((e, i) => (
                <span key={i} className="text-[11.5px] text-[#6f6448] border border-[#c9b27f] px-2 py-0.5 rounded-full">
                  <b className="text-[#2a2a26] font-semibold">{e.name}</b>{e.pct ? ` ${e.pct}%` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown size={15} className={clsx('text-[#8e7338] shrink-0 mt-1 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#c9b27f]/40">
          {entry.thoughts && (
            <div className="mt-4">
              <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338] mb-1.5">Myśli automatyczne</div>
              <div className="font-serif-body text-[14.5px] text-[#2a2a26] whitespace-pre-wrap">{entry.thoughts}</div>
            </div>
          )}
          {entry.alt && (
            <div className="mt-4">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">Myśl alternatywna</span>
                {entry.altPct > 0 && <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8f4d63]">wiara {entry.altPct}%</span>}
              </div>
              <div className="font-serif-body text-[14.5px] text-[#2a2a26] whitespace-pre-wrap">{entry.alt}</div>
            </div>
          )}
          <ThoughtInterrogation entry={entry} onSave={onSave} />
          <div className="mt-5 flex items-center">
            <button onClick={onDelete} className="ml-auto font-ui text-[11px] text-[#7c7256] underline underline-offset-2 hover:text-[#8A3A2C] transition-colors">usuń wpis</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Wywiad z gorącą myślą — lokalny stan + autozapis (debounce 700ms).
function ThoughtInterrogation({ entry, onSave }: {
  entry: CBTThoughtEntry
  onSave: (id: string, patch: Partial<Pick<CBTThoughtEntry, 'hot' | 'interro' | 'reframe' | 'reframeFeel'>>) => Promise<void>
}) {
  const [hot, setHot] = useState(entry.hot)
  const [interro, setInterro] = useState<Record<string, string>>(entry.interro || {})
  const [reframe, setReframe] = useState(entry.reframe)
  const [reframeFeel, setReframeFeel] = useState(entry.reframeFeel)
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await onSave(entry.id, { hot, interro, reframe, reframeFeel })
      setSaved(true); setTimeout(() => setSaved(false), 1400)
    }, 700)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [hot, interro, reframe, reframeFeel])

  return (
    <div className="mt-5 pt-4 border-t border-dashed border-[#c9b27f]/60">
      <h4 className="font-display font-medium text-[16px] text-[#2a2a26]">Wywiad z gorącą myślą</h4>
      <p className="font-serif-body italic text-[12.5px] text-[#7c7256] mt-0.5 mb-4">
        Zaznacz myśl, która najlepiej tłumaczy emocję — i przesłuchaj ją jak prokurator.
      </p>

      <div className="mb-3">
        <label className="cbt-lab">Gorąca myśl</label>
        <textarea className="cbt-ta" rows={2} value={hot} onChange={e => setHot(e.target.value)} placeholder="ta jedna myśl, która boli najbardziej" />
      </div>

      {SOCRATIC.map(s => (
        <div key={s.id} className="mb-3">
          <label className="cbt-lab font-normal" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '14px' }}>{s.q}</label>
          <textarea className="cbt-ta" rows={2} value={interro[s.id] || ''} onChange={e => setInterro({ ...interro, [s.id]: e.target.value })} />
        </div>
      ))}

      <div className="mt-4 border border-[#c9b27f] bg-[#d3ccaf] p-3.5">
        <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8A3A2C] mb-1.5">Przeformułowana myśl</div>
        <textarea className="cbt-ta" rows={2} value={reframe} onChange={e => setReframe(e.target.value)} placeholder="jak inaczej, łagodniej i prawdziwiej mogę to ująć?" />
        <label className="cbt-lab mt-3" style={{ fontWeight: 400, fontFamily: "'Cormorant Garamond',serif", fontSize: '14px' }}>Jak poczuję się, kierując się tą myślą?</label>
        <textarea className="cbt-ta" rows={2} value={reframeFeel} onChange={e => setReframeFeel(e.target.value)} />
      </div>

      <div className="mt-3 flex items-center gap-3 min-h-[18px]">
        {entry.reframeAwarded
          ? <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">◆ przeformułowanie zaliczone · +{XP_VALUES.cbtReframe} XP</span>
          : <span className="font-ui uppercase tracking-luxury text-[9px] text-[#7c7256] opacity-70">domknij gorącą myśl + przeformułowanie → +{XP_VALUES.cbtReframe} XP</span>}
        {saved && <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8f4d63] ml-auto">zapisano ✓</span>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
//  ZAKŁADKA: EMOCJE
// ════════════════════════════════════════════════════════════════════
function EmotionTab({ cbt }: { cbt: ReturnType<typeof useCBT> }) {
  const blank = { name: '', body: '', color: '', shape: '', texture: '', smell: '', sound: '', metaphor: '' }
  const [f, setF] = useState(blank)
  const [before, setBefore] = useState(5)
  const [after, setAfter] = useState(5)
  const [openId, setOpenId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<CBTEmotionEntry | null>(null)

  const set = (k: keyof typeof blank, v: string) => setF({ ...f, [k]: v })

  const save = async () => {
    if (!f.name.trim()) { setFlash('Najpierw nazwij emocję'); setTimeout(() => setFlash(null), 1500); return }
    const created = await cbt.createEmotion({ name: f.name.trim(), before, after, body: f.body.trim(), color: f.color.trim(), shape: f.shape.trim(), texture: f.texture.trim(), smell: f.smell.trim(), sound: f.sound.trim(), metaphor: f.metaphor.trim() })
    if (created) setLastSaved(created)
    setF(blank); setBefore(5); setAfter(5)
    setFlash(created && created.xpEarned > 0 ? `Zapisano · +${created.xpEarned} XP` : 'Zapisano ✓')
    setTimeout(() => setFlash(null), 1800)
  }

  const fields: [keyof typeof blank, string, string][] = [
    ['body', 'Gdzie czujesz ją w ciele? Jakie to uczucie?', 'ucisk z tyłu czaszki, kłucie w barkach'],
    ['color', 'Gdyby miała kolor, byłby to…', 'granatowy z cieniami'],
    ['shape', 'Gdyby miała kształt, byłby to…', 'duży walec'],
    ['texture', 'Gdyby miała fakturę, w dotyku byłaby…', 'szorstka jak papier ścierny'],
    ['smell', 'Gdyby miała zapach, byłby to…', 'przypalane włosy'],
    ['sound', 'Gdyby była dźwiękiem, byłby to…', 'pisk widelca na talerzu'],
  ]

  return (
    <div>
      <p className="font-serif-body italic text-parchment text-[14px] leading-[1.8] text-center mb-7 max-w-lg mx-auto">
        Gdy złapie Cię silna emocja, nadaj jej kształt. Zamieniasz mgliste „źle mi" w konkretny obiekt,
        który możesz obejrzeć z dystansu. Na końcu oceń natężenie ponownie — i zobacz różnicę.
      </p>

      <div className="cbt-card px-6 md:px-8 py-7">
        <div className="mb-5">
          <label className="cbt-lab">Nazwij emocję, którą odczuwasz</label>
          <input className="cbt-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="lęk" />
        </div>

        <Slider label="Natężenie teraz" value={before} onChange={setBefore} />

        {fields.map(([k, label, ph]) => (
          <div key={k} className="mb-4">
            <label className="cbt-lab">{label}</label>
            <input className="cbt-input" value={f[k]} onChange={e => set(k, e.target.value)} placeholder={ph} />
          </div>
        ))}

        <div className="mb-5">
          <label className="cbt-lab">Opisz tę emocję metaforą</label>
          <textarea className="cbt-ta" rows={2} value={f.metaphor} onChange={e => set('metaphor', e.target.value)}
            placeholder="ten lęk jest jak walec, który taranuje wszystko na drodze" />
        </div>

        <Slider label="Natężenie po ćwiczeniu" value={after} onChange={setAfter} />

        <SaveButton onClick={save} flash={flash}>zapisz i zobacz różnicę</SaveButton>
      </div>

      {lastSaved && (
        <div className="cbt-card mt-5 px-6 py-6">
          <div className="font-display font-medium text-[16px] text-[#2a2a26] text-center">{lastSaved.name}</div>
          <EmotionArc before={lastSaved.before} after={lastSaved.after} />
          <DeltaLine before={lastSaved.before} after={lastSaved.after} />
        </div>
      )}

      <div className="mt-9 mb-4 flex items-center gap-2">
        <Diamond size={6} className="text-gold" />
        <SmallCaps tone="gold-light" tracking="luxury" size="xs">Twoje emocje · {cbt.emotionEntries.length}</SmallCaps>
      </div>

      {cbt.emotionEntries.length === 0 ? (
        <EmptyNote>Tu zbiorą się Twoje emocje rozłożone na czynniki. Wróć, gdy następnym razem coś Cię złapie.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {cbt.emotionEntries.map(e => (
            <div key={e.id} className="cbt-card">
              <button onClick={() => setOpenId(openId === e.id ? null : e.id)} className="w-full text-left px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">{fmtDate(e.timestamp)}</div>
                  <div className="font-display text-[16px] text-[#2a2a26] mt-0.5">{e.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <MiniArc before={e.before} after={e.after} />
                    <span className="font-ui text-[12px] text-[#6f6448]">{e.before} → {e.after}</span>
                  </div>
                </div>
                <ChevronDown size={15} className={clsx('text-[#8e7338] shrink-0 transition-transform', openId === e.id && 'rotate-180')} />
              </button>
              {openId === e.id && (
                <div className="px-5 pb-5 border-t border-[#c9b27f]/40 pt-3">
                  {([['w ciele', e.body], ['kolor', e.color], ['kształt', e.shape], ['faktura', e.texture], ['zapach', e.smell], ['dźwięk', e.sound], ['metafora', e.metaphor]] as [string, string][])
                    .filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="mt-2.5">
                        <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">{k}</div>
                        <div className="font-serif-body text-[14.5px] text-[#2a2a26]">{v}</div>
                      </div>
                    ))}
                  <div className="mt-4 flex">
                    <button onClick={() => { cbt.deleteEntry(e.id); setOpenId(null) }} className="ml-auto font-ui text-[11px] text-[#7c7256] underline underline-offset-2 hover:text-[#8A3A2C] transition-colors">usuń</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-2">
        <span className="cbt-lab mb-0">{label}</span>
        <span className="font-display font-semibold text-[22px]" style={{ color: ROSE }}>{value}</span>
      </div>
      <input type="range" min={0} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="cbt-range" />
    </div>
  )
}

// ── Łuk natężenia przed→po ─────────────────────────────────────────
function EmotionArc({ before, after }: { before: number; after: number }) {
  const w = 300, h = 96, x1 = 46, x2 = 254, top = 20, span = 52
  const y = (v: number) => top + (1 - v / 10) * span
  const y1 = y(before), y2 = y(after), cx = (x1 + x2) / 2
  const color = after < before ? DOWN : UP
  return (
    <div className="flex justify-center my-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[300px] h-[96px]" aria-hidden="true">
        <path d={`M${x1} ${y1} C${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={x1} cy={y1} r={5} fill={ROSE} />
        <circle cx={x2} cy={y2} r={5} fill={color} />
        <text x={x1} y={h - 8} textAnchor="middle" fontSize={11} fill="#7c7256" fontFamily="Inter,sans-serif">przed</text>
        <text x={x2} y={h - 8} textAnchor="middle" fontSize={11} fill="#7c7256" fontFamily="Inter,sans-serif">po</text>
        <text x={x1} y={y1 - 12} textAnchor="middle" fontSize={18} fontWeight={600} fill={ROSE} fontFamily="'Bodoni Moda',serif">{before}</text>
        <text x={x2} y={y2 - 12} textAnchor="middle" fontSize={18} fontWeight={600} fill={color} fontFamily="'Bodoni Moda',serif">{after}</text>
      </svg>
    </div>
  )
}

function MiniArc({ before, after }: { before: number; after: number }) {
  const w = 78, h = 26, x1 = 8, x2 = 70, top = 5, span = 14
  const y = (v: number) => top + (1 - v / 10) * span
  const y1 = y(before), y2 = y(after), cx = (x1 + x2) / 2
  const color = after < before ? DOWN : UP
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[78px] h-[26px]">
      <path d={`M${x1} ${y1} C${cx} ${y1},${cx} ${y2},${x2} ${y2}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={x1} cy={y1} r={3} fill={ROSE} />
      <circle cx={x2} cy={y2} r={3} fill={color} />
    </svg>
  )
}

function DeltaLine({ before, after }: { before: number; after: number }) {
  const d = before - after
  if (d > 0) return <p className="text-center font-serif-body text-[14px] text-[#3f7d5c] mt-1">Natężenie spadło o <b className="font-display">{d}</b>. To działa.</p>
  if (d < 0) return <p className="text-center font-serif-body text-[14px] text-[#8A3A2C] mt-1">Natężenie wzrosło o <b className="font-display">{-d}</b> — też ważna informacja. Bądź dla siebie łagodna.</p>
  return <p className="text-center font-serif-body text-[14px] text-[#7c7256] mt-1">Natężenie bez zmian. Czasem samo nazwanie to już dużo.</p>
}

// Krzywa % wiary tydzień-po-tygodniu. Wzrost = zdrowienie (zielony).
function PctTrend({ history }: { history: CBTBeliefPctPoint[] }) {
  const pts = [...history].sort((a, b) => a.weekKey.localeCompare(b.weekKey))
  if (pts.length < 2) return null
  const w = 300, h = 70, padX = 12, padY = 12, n = pts.length
  const x = (i: number) => padX + (i / (n - 1)) * (w - 2 * padX)
  const y = (v: number) => padY + (1 - v / 100) * (h - 2 * padY)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.pct).toFixed(1)}`).join(' ')
  const color = pts[n - 1].pct >= pts[0].pct ? DOWN : UP
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[320px] h-[70px]" aria-hidden>
      <line x1={padX} y1={y(0)} x2={w - padX} y2={y(0)} stroke="#c3b994" strokeWidth={0.75} />
      <line x1={padX} y1={y(100)} x2={w - padX} y2={y(100)} stroke="#c3b994" strokeWidth={0.75} strokeDasharray="2 3" />
      <path d={d} fill="none" stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.pct)} r={i === n - 1 ? 4 : 3} fill={i === n - 1 ? color : ROSE} />)}
      <text x={x(n - 1)} y={y(pts[n - 1].pct) - 8} textAnchor="end" fontSize={13} fontWeight={600} fill={color} fontFamily="'Bodoni Moda',serif">{pts[n - 1].pct}%</text>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════
//  ZAKŁADKA: PRZEKONANIA (strzałka w dół)
// ════════════════════════════════════════════════════════════════════
function BeliefTab({ cbt }: { cbt: ReturnType<typeof useCBT> }) {
  const [trigger, setTrigger] = useState('')
  const [ladder, setLadder] = useState<string[]>([''])
  const [core, setCore] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const setRung = (i: number, v: string) => setLadder(ladder.map((r, j) => (j === i ? v : r)))
  const addRung = () => ladder.length < 6 && setLadder([...ladder, ''])
  const rmRung = (i: number) => ladder.length > 1 && setLadder(ladder.filter((_, j) => j !== i))

  const save = async () => {
    const rungs = ladder.map(r => r.trim()).filter(Boolean)
    if (!trigger.trim() && !core.trim() && !rungs.length) {
      setFlash('Najpierw coś zapisz'); setTimeout(() => setFlash(null), 1500); return
    }
    const created = await cbt.createBelief({ trigger: trigger.trim(), ladder: rungs, coreBelief: core.trim() })
    setTrigger(''); setLadder(['']); setCore('')
    setFlash(created && created.xpEarned > 0 ? `Zapisano · +${created.xpEarned} XP` : 'Zapisano ✓')
    setTimeout(() => setFlash(null), 1800)
  }

  return (
    <div>
      <p className="font-serif-body italic text-parchment text-[14px] leading-[1.8] text-center mb-7 max-w-lg mx-auto">
        Weź myśl, która wróciła w silnej emocji, i schodź w dół — po każdej odpowiedzi pytaj
        „jeśli to prawda, co to o mnie mówi?" — aż dojdziesz do prostego zdania. To Twoje przekonanie kluczowe.
        Potem, spokojnie, ułóż w jego miejsce nowe, zdrowe.
      </p>

      {/* Formularz — ćw. 1: zejście do przekonania kluczowego */}
      <div className="cbt-card px-6 md:px-8 py-7">
        <div className="mb-5">
          <label className="cbt-lab">Myśl na start<span className="cbt-hint">Sytuacja i myśl, która wywołała silne emocje.</span></label>
          <textarea className="cbt-ta" rows={2} value={trigger} onChange={e => setTrigger(e.target.value)}
            placeholder="Nie odpisała mi cały dzień. Pewnie ma mnie dość." />
        </div>

        <div className="mb-5">
          <label className="cbt-lab">Strzałka w dół<span className="cbt-hint">Po każdej odpowiedzi: „a jeśli to prawda — co to o mnie mówi?"</span></label>
          {ladder.map((r, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-center gap-1.5 mb-1 text-[#8e7338]">
                <ChevronDown size={14} /><span className="font-ui uppercase tracking-luxury text-[9px]">krok {i + 1}</span>
              </div>
              <div className="grid grid-cols-[1fr_28px] gap-2 items-start">
                <textarea className="cbt-ta" rows={2} value={r} onChange={e => setRung(i, e.target.value)}
                  placeholder={i === 0 ? '…to znaczy, że jestem nieważna' : '…a to znaczy, że…'} />
                {ladder.length > 1
                  ? <button onClick={() => rmRung(i)} aria-label="usuń krok" className="text-[#7c7256] hover:text-[#8A3A2C] transition-colors flex justify-center pt-2"><X size={16} /></button>
                  : <span />}
              </div>
            </div>
          ))}
          {ladder.length < 6 && (
            <button onClick={addRung} className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 border border-dashed border-[#c9b27f] text-[#6f6448] hover:border-[#b56a82] transition-colors">
              <Plus size={13} /><span className="font-ui uppercase tracking-luxury text-[10px]">głębiej</span>
            </button>
          )}
        </div>

        <div className="mb-6 border border-[#c9b27f] bg-[#d3ccaf] p-3.5">
          <label className="cbt-lab">Przekonanie kluczowe<span className="cbt-hint">Dno drabiny — proste zdanie o sobie, innych albo świecie.</span></label>
          <textarea className="cbt-ta" rows={2} value={core} onChange={e => setCore(e.target.value)}
            placeholder="Jestem nie do pokochania." />
        </div>

        <SaveButton onClick={save} flash={flash}>zapisz przekonanie</SaveButton>
      </div>

      {/* Lista */}
      <div className="mt-9 mb-4 flex items-center gap-2">
        <Diamond size={6} className="text-gold" />
        <SmallCaps tone="gold-light" tracking="luxury" size="xs">Twoje przekonania · {cbt.beliefs.length}</SmallCaps>
      </div>

      {cbt.beliefs.length === 0 ? (
        <EmptyNote>Tu wylądują przekonania, które uda Ci się nazwać — i te nowe, zdrowe, które w ich miejsce budujesz.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {cbt.beliefs.map(b => (
            <BeliefRow key={b.id} entry={b} cbt={cbt} open={openId === b.id}
              onToggle={() => setOpenId(openId === b.id ? null : b.id)}
              onDelete={() => { cbt.deleteEntry(b.id); setOpenId(null) }} />
          ))}
        </div>
      )}
    </div>
  )
}

function BeliefRow({ entry, cbt, open, onToggle, onDelete }: {
  entry: CBTBeliefEntry; cbt: ReturnType<typeof useCBT>; open: boolean; onToggle: () => void; onDelete: () => void
}) {
  return (
    <div className="cbt-card">
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">{fmtDate(entry.timestamp)}</div>
          <div className="font-display text-[16px] text-[#2a2a26] mt-1 leading-[1.35] line-clamp-2">{entry.coreBelief || entry.trigger || '(bez nazwy)'}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {entry.newBelief && <span className="text-[11px] text-[#3f7d5c] border border-[#3f7d5c]/40 px-2 py-0.5 rounded-full">nowe · wiara {entry.newBeliefPct}%</span>}
            {entry.restructureAwarded && <span className="text-[11px] text-[#8e7338] border border-[#c9b27f] px-2 py-0.5 rounded-full">◆ zrestrukturyzowane</span>}
          </div>
        </div>
        <ChevronDown size={15} className={clsx('text-[#8e7338] shrink-0 mt-1 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#c9b27f]/40">
          {entry.trigger && (
            <div className="mt-4">
              <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338] mb-1.5">Myśl na start</div>
              <div className="font-serif-body text-[14.5px] text-[#2a2a26] whitespace-pre-wrap">{entry.trigger}</div>
            </div>
          )}
          {entry.ladder.length > 0 && (
            <div className="mt-4">
              <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338] mb-1.5">Strzałka w dół</div>
              <ul className="space-y-1.5">
                {entry.ladder.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 font-serif-body text-[14px] text-[#2a2a26]">
                    <ChevronDown size={13} className="text-[#8e7338] shrink-0 mt-1" /><span className="whitespace-pre-wrap">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <BeliefWork entry={entry} cbt={cbt} />
          <div className="mt-5 flex items-center">
            <button onClick={onDelete} className="ml-auto font-ui text-[11px] text-[#7c7256] underline underline-offset-2 hover:text-[#8A3A2C] transition-colors">usuń przekonanie</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Pogłębienie + restrukturyzacja — lokalny stan + autozapis (debounce 700ms).
// Bonus +25 przyznawany raz, gdy przekonanie kluczowe + nowe zdrowe wypełnione.
function BeliefWork({ entry, cbt }: { entry: CBTBeliefEntry; cbt: ReturnType<typeof useCBT> }) {
  const [behave, setBehave] = useState(entry.behaveWhenActive)
  const [opposite, setOpposite] = useState(entry.ifOpposite)
  const [source, setSource] = useState(entry.source)
  const [aSelf, setASelf] = useState(entry.axisSelf)
  const [aOthers, setAOthers] = useState(entry.axisOthers)
  const [aWorld, setAWorld] = useState(entry.axisWorld)
  const [newBelief, setNewBelief] = useState(entry.newBelief)
  const [pct, setPct] = useState(entry.newBeliefPct)
  const [evidence, setEvidence] = useState<string[]>(entry.evidence.length ? entry.evidence : [''])
  const [confirmations, setConfirmations] = useState(entry.confirmations)
  const [confInput, setConfInput] = useState('')
  const [experiments, setExperiments] = useState<CBTBeliefExperiment[]>(entry.experiments)
  const [saved, setSaved] = useState(false)
  const [onShield, setOnShield] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = useRef(true)

  // Krzywa % — jeden punkt na tydzień ISO, tylko gdy jest już nowe przekonanie.
  const thisWeek = getISOWeekKey(getEffectiveNow())
  const liveHistory: CBTBeliefPctPoint[] = newBelief.trim()
    ? upsertPctWeek(entry.pctHistory, thisWeek, pct)
    : entry.pctHistory

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await cbt.updateBelief(entry.id, {
        behaveWhenActive: behave, ifOpposite: opposite, source,
        axisSelf: aSelf, axisOthers: aOthers, axisWorld: aWorld,
        newBelief, newBeliefPct: pct, evidence: evidence.map(x => x.trim()).filter(Boolean),
        confirmations, experiments,
        pctHistory: newBelief.trim() ? upsertPctWeek(entry.pctHistory, thisWeek, pct) : entry.pctHistory,
      })
      setSaved(true); setTimeout(() => setSaved(false), 1400)
    }, 700)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [behave, opposite, source, aSelf, aOthers, aWorld, newBelief, pct, evidence, confirmations, experiments])

  const setEv = (i: number, v: string) => setEvidence(evidence.map((e, j) => (j === i ? v : e)))
  const addEv = () => evidence.length < 5 && setEvidence([...evidence, ''])
  const rmEv = (i: number) => evidence.length > 1 && setEvidence(evidence.filter((_, j) => j !== i))

  const today = todayKey()
  const todayConfs = confirmations.filter(c => c.dateKey === today)
  const olderConfs = confirmations.filter(c => c.dateKey !== today)
  const addConf = () => {
    const v = confInput.trim()
    if (!v) return
    setConfirmations([...confirmations, { dateKey: today, text: v }])
    setConfInput('')
  }
  const rmConf = (target: { dateKey: string; text: string }) =>
    setConfirmations(confirmations.filter(c => c !== target))

  // Trwały `awarded` czytamy z propa `entry` (świeży po nagrodzie), nie z
  // lokalnego stanu (zainicjowany raz, zostaje na false — patrz updateBelief).
  const awardedExpIds = new Set(entry.experiments.filter(e => e.awarded).map(e => e.id))
  const setExpField = (i: number, field: 'task' | 'worry' | 'results' | 'conclusion', v: string) =>
    setExperiments(experiments.map((x, j) => (j === i ? { ...x, [field]: v } : x)))
  const addExperiment = () =>
    experiments.length < 5 && setExperiments([...experiments, emptyExperiment(cbtUid(), today)])
  const rmExperiment = (i: number) => setExperiments(experiments.filter((_, j) => j !== i))

  const done = restructureComplete({ coreBelief: entry.coreBelief, newBelief })
  const nb = newBelief.trim()
  const alreadyOnShield = nb.length > 0 && (BOOK_SHIELD.includes(nb) || cbt.shield.custom.includes(nb))
  const addToShield = () => {
    if (!nb) return
    if (!BOOK_SHIELD.includes(nb) && !cbt.shield.custom.includes(nb)) {
      cbt.saveShield({ ...cbt.shield, custom: [...cbt.shield.custom, nb], selected: [...cbt.shield.selected, nb] })
    }
    setOnShield(true)
  }

  const cormorant = { fontFamily: "'Cormorant Garamond',serif", fontSize: '14px' } as const

  return (
    <div className="mt-5 pt-4 border-t border-dashed border-[#c9b27f]/60">
      <h4 className="font-display font-medium text-[16px] text-[#2a2a26]">Zrozum to przekonanie</h4>
      <p className="font-serif-body italic text-[12.5px] text-[#7c7256] mt-0.5 mb-4">
        Popatrz na nie z dystansu — to nabyta koncepcja, nie prawda o świecie.
      </p>

      <div className="mb-3">
        <label className="cbt-lab font-normal" style={cormorant}>Jak się zachowuję i czuję, gdy to przekonanie działa?</label>
        <textarea className="cbt-ta" rows={2} value={behave} onChange={e => setBehave(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="cbt-lab font-normal" style={cormorant}>Jak zachowałabym się, gdyby było ODWROTNE?</label>
        <textarea className="cbt-ta" rows={2} value={opposite} onChange={e => setOpposite(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="cbt-lab font-normal" style={cormorant}>Skąd się wzięło?<span className="cbt-hint">Czyjeś słowa z dzieciństwa? Interpretacja zachowań bliskich?</span></label>
        <textarea className="cbt-ta" rows={2} value={source} onChange={e => setSource(e.target.value)} />
      </div>

      <div className="grid gap-2 mt-4">
        {([['Ja jestem…', aSelf, setASelf], ['Inni ludzie są…', aOthers, setAOthers], ['Świat jest…', aWorld, setAWorld]] as [string, string, (v: string) => void][]).map(([lab, val, set]) => (
          <div key={lab} className="grid grid-cols-[112px_1fr] gap-2 items-center">
            <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8f4d63]">{lab}</span>
            <input className="cbt-input" value={val} onChange={e => set(e.target.value)} />
          </div>
        ))}
      </div>

      <div className="mt-5 border border-[#c9b27f] bg-[#d3ccaf] p-3.5">
        <div className="font-ui uppercase tracking-luxury text-[9px] text-[#3f7d5c] mb-1.5">Nowe, zdrowe przekonanie</div>
        <textarea className="cbt-ta" rows={2} value={newBelief} onChange={e => setNewBelief(e.target.value)}
          placeholder="jak brzmi zdanie, które by Cię wspierało?" />

        <div className="flex items-baseline justify-between mt-3 mb-1.5">
          <span className="cbt-lab mb-0 font-normal" style={cormorant}>Na ile wierzę w nowe?</span>
          <span className="font-display font-semibold text-[20px]" style={{ color: ROSE }}>{pct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={pct} onChange={e => setPct(Number(e.target.value))} className="cbt-range" />

        {liveHistory.length >= 2 && (
          <div className="mt-4">
            <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338] mb-1">Wiara w czasie · {liveHistory.length} tyg.</div>
            <PctTrend history={liveHistory} />
          </div>
        )}

        <div className="mt-4">
          <label className="cbt-lab font-normal" style={cormorant}>Dowody, że nowe jest prawdziwe<span className="cbt-hint">Realne sytuacje, które je potwierdzają.</span></label>
          {evidence.map((ev, i) => (
            <div key={i} className="grid grid-cols-[20px_1fr_24px] gap-2 items-center mb-2">
              <span className="font-display text-[14px] text-[#8e7338] text-right">{i + 1}.</span>
              <input className="cbt-input" value={ev} onChange={e => setEv(i, e.target.value)} />
              {evidence.length > 1
                ? <button onClick={() => rmEv(i)} aria-label="usuń dowód" className="text-[#7c7256] hover:text-[#8A3A2C] transition-colors flex justify-center"><X size={15} /></button>
                : <span />}
            </div>
          ))}
          {evidence.length < 5 && (
            <button onClick={addEv} className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 border border-dashed border-[#c9b27f] text-[#6f6448] hover:border-[#b56a82] transition-colors">
              <Plus size={13} /><span className="font-ui uppercase tracking-luxury text-[10px]">dodaj dowód</span>
            </button>
          )}
        </div>
      </div>

      {/* Eksperyment behawioralny (rozdz. 11, ćw. 3) — realny test przekonania */}
      <div className="mt-5 pt-4 border-t border-dashed border-[#c9b27f]/60">
        <h4 className="font-display font-medium text-[16px] text-[#2a2a26]">Eksperyment behawioralny</h4>
        <p className="font-serif-body italic text-[12.5px] text-[#7c7256] mt-0.5 mb-3">
          Przetestuj to przekonanie w realu. Zaplanuj małe zadanie, wykonaj je i sprawdź, czy Twoje obawy się potwierdziły. Wynik to najmocniejszy dowód.
        </p>
        {entry.coreBelief.trim() && (
          <div className="mb-3 text-[13px]">
            <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8f4d63]">Przekonanie, które testuję</span>
            <div className="font-serif-body italic text-[#2a2a26] mt-0.5">„{entry.coreBelief}"</div>
          </div>
        )}
        {experiments.map((ex, i) => {
          const expDone = experimentComplete(ex)
          return (
            <div key={ex.id} className="border border-[#c9b27f] bg-[#d3ccaf] p-3.5 mb-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">Eksperyment {i + 1}</span>
                <button onClick={() => rmExperiment(i)} aria-label="usuń eksperyment" className="text-[#7c7256] hover:text-[#8A3A2C] transition-colors"><X size={14} /></button>
              </div>
              <div className="mb-2.5">
                <label className="cbt-lab font-normal" style={cormorant}>Zadanie<span className="cbt-hint">Co zrobię, żeby to sprawdzić?</span></label>
                <textarea className="cbt-ta" rows={2} value={ex.task} onChange={e => setExpField(i, 'task', e.target.value)} placeholder="Założyć konto na Tinderze." />
              </div>
              <div className="mb-2.5">
                <label className="cbt-lab font-normal" style={cormorant}>Obawy<span className="cbt-hint">Czego się boję, że się stanie?</span></label>
                <textarea className="cbt-ta" rows={2} value={ex.worry} onChange={e => setExpField(i, 'worry', e.target.value)} placeholder="Wszyscy przesuną mnie w lewo, nikt nie napisze." />
              </div>
              <div className="mb-2.5">
                <label className="cbt-lab font-normal" style={cormorant}>Wyniki eksperymentu<span className="cbt-hint">Co się realnie wydarzyło?</span></label>
                <textarea className="cbt-ta" rows={2} value={ex.results} onChange={e => setExpField(i, 'results', e.target.value)} placeholder="Z 20 potencjalnych matchów miałam 7." />
              </div>
              <div>
                <label className="cbt-lab font-normal" style={cormorant}>Wniosek<span className="cbt-hint">Czy obawy się potwierdziły?</span></label>
                <textarea className="cbt-ta" rows={2} value={ex.conclusion} onChange={e => setExpField(i, 'conclusion', e.target.value)} placeholder="Nie zawsze jestem odrzucana. Są osoby, które chcą rozmawiać." />
              </div>
              <div className="mt-2.5 flex items-center gap-3 min-h-[16px]">
                {awardedExpIds.has(ex.id)
                  ? <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">◆ eksperyment domknięty · +{XP_VALUES.cbtExperiment} XP</span>
                  : <span className="font-ui uppercase tracking-luxury text-[9px] text-[#7c7256] opacity-70">domknij: zadanie + wynik + wniosek → +{XP_VALUES.cbtExperiment} XP</span>}
                {expDone && newBelief.trim() !== ex.conclusion.trim() && (
                  <button onClick={() => setNewBelief(ex.conclusion.trim())} className="ml-auto font-ui text-[10px] text-[#3f7d5c] underline underline-offset-2 hover:text-[#2a2a26] transition-colors">→ jako nowe przekonanie</button>
                )}
              </div>
            </div>
          )
        })}
        {experiments.length < 5 && (
          <button onClick={addExperiment} className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 border border-dashed border-[#c9b27f] text-[#6f6448] hover:border-[#b56a82] transition-colors">
            <Plus size={13} /><span className="font-ui uppercase tracking-luxury text-[10px]">zaplanuj eksperyment</span>
          </button>
        )}
      </div>

      {newBelief.trim() && (
        <div className="mt-5 pt-4 border-t border-dashed border-[#c9b27f]/60">
          <h4 className="font-display font-medium text-[16px] text-[#2a2a26]">Codzienna pielęgnacja</h4>
          <p className="font-serif-body italic text-[12.5px] text-[#7c7256] mt-0.5 mb-3">
            Zapisuj sytuacje, które potwierdziły nowe przekonanie — bez punktów, to spokojne podlewanie. Dziś: {todayConfs.length}/3.
          </p>
          <div className="flex gap-2">
            <input className="cbt-input flex-1" value={confInput} onChange={e => setConfInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addConf() }} placeholder="co dziś to potwierdziło?" />
            <button onClick={addConf} className="px-4 bg-dark-deep border border-gold text-ivory hover:bg-forest transition-colors">
              <SmallCaps tone="ivory" tracking="luxury" size="xs">dopisz</SmallCaps>
            </button>
          </div>
          {todayConfs.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {todayConfs.map((c, i) => (
                <li key={i} className="flex items-start gap-2 font-serif-body text-[14px] text-[#2a2a26]">
                  <span className="text-[#3f7d5c] shrink-0 mt-0.5">✓</span>
                  <span className="flex-1 whitespace-pre-wrap">{c.text}</span>
                  <button onClick={() => rmConf(c)} aria-label="usuń" className="text-[#7c7256] hover:text-[#8A3A2C] transition-colors shrink-0"><X size={14} /></button>
                </li>
              ))}
            </ul>
          )}
          {olderConfs.length > 0 && (
            <div className="mt-2 font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">wcześniej · {olderConfs.length} zapisanych</div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 min-h-[18px]">
        {entry.restructureAwarded
          ? <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">◆ restrukturyzacja zaliczona · +{XP_VALUES.cbtRestructure} XP</span>
          : <span className="font-ui uppercase tracking-luxury text-[9px] text-[#7c7256] opacity-70">domknij: przekonanie kluczowe + nowe zdrowe → +{XP_VALUES.cbtRestructure} XP</span>}
        {saved && <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8f4d63] ml-auto">zapisano ✓</span>}
      </div>

      {done && (
        <button onClick={addToShield} disabled={onShield || alreadyOnShield}
          className="mt-3 w-full py-2.5 bg-dark-deep border border-gold text-ivory hover:bg-forest transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <Diamond size={6} className="text-gold" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">{onShield || alreadyOnShield ? '✓ jest w Tarczy' : 'dodaj nowe przekonanie do Tarczy'}</SmallCaps>
          <Diamond size={6} className="text-gold" />
        </button>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
//  ZAKŁADKA: STYLE (radzenia sobie ze schematem)
// ════════════════════════════════════════════════════════════════════
function CopingTab({ cbt }: { cbt: ReturnType<typeof useCBT> }) {
  const [styleKey, setStyleKey] = useState<CBTCopingStyle>('avoid')
  const [what, setWhat] = useState('')
  const [ways, setWays] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const meta = copingStyle(styleKey)

  const save = async () => {
    if (!what.trim() && !ways.trim()) {
      setFlash('Najpierw coś zapisz'); setTimeout(() => setFlash(null), 1500); return
    }
    const created = await cbt.createCoping({ style: styleKey, what: what.trim(), ways: ways.trim() })
    setWhat(''); setWays('')
    setFlash(created && created.xpEarned > 0 ? `Zapisano · +${created.xpEarned} XP` : 'Zapisano ✓')
    setTimeout(() => setFlash(null), 1800)
  }

  return (
    <div>
      <p className="font-serif-body italic text-parchment text-[14px] leading-[1.8] text-center mb-7 max-w-lg mx-auto">
        Schemat podtrzymuje się na trzy sposoby: poddajesz mu się, unikasz go albo kompensujesz nadmiarem.
        Gdy uświadomisz sobie, którego stylu używasz, dostrzeganie go staje się łatwiejsze —
        a tylko wtedy przechodzisz od życia na automacie do mądrego wyboru strategii.
      </p>

      {/* Formularz — przyłapanie się na automacie */}
      <div className="cbt-card px-6 md:px-8 py-7">
        <div className="mb-5">
          <label className="cbt-lab">Który automat się włączył?</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {COPING_STYLES.map(s => (
              <button key={s.key} onClick={() => setStyleKey(s.key)}
                className={clsx('px-3 py-1.5 border transition-colors font-ui uppercase tracking-luxury text-[10px]',
                  styleKey === s.key ? 'border-[#b56a82] bg-[#d3ccaf] text-[#2a2a26]' : 'border-[#c9b27f] text-[#6f6448] hover:border-[#b56a82]')}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="font-serif-body italic text-[13px] text-[#7c7256] mt-2.5">{meta.def}</p>
        </div>

        <div className="mb-5">
          <label className="cbt-lab">{meta.whatQ}<span className="cbt-hint">{meta.whatHint}</span></label>
          <textarea className="cbt-ta" rows={2} value={what} onChange={e => setWhat(e.target.value)} placeholder={meta.whatPh} />
        </div>

        <div className="mb-6">
          <label className="cbt-lab">{meta.waysQ}</label>
          <textarea className="cbt-ta" rows={2} value={ways} onChange={e => setWays(e.target.value)} placeholder={meta.waysPh} />
        </div>

        <SaveButton onClick={save} flash={flash}>zapisz obserwację</SaveButton>
      </div>

      {/* Lista */}
      <div className="mt-9 mb-4 flex items-center gap-2">
        <Diamond size={6} className="text-gold" />
        <SmallCaps tone="gold-light" tracking="luxury" size="xs">Złapane automaty · {cbt.copings.length}</SmallCaps>
      </div>

      {cbt.copings.length === 0 ? (
        <EmptyNote>Tu pojawią się zachowania, na których uda Ci się przyłapać. Pierwszy krok to zauważyć — bez oceniania.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {cbt.copings.map(c => (
            <CopingRow key={c.id} entry={c} cbt={cbt} open={openId === c.id}
              onToggle={() => setOpenId(openId === c.id ? null : c.id)}
              onDelete={() => { cbt.deleteEntry(c.id); setOpenId(null) }} />
          ))}
        </div>
      )}
    </div>
  )
}

function CopingRow({ entry, cbt, open, onToggle, onDelete }: {
  entry: CBTCopingEntry; cbt: ReturnType<typeof useCBT>; open: boolean; onToggle: () => void; onDelete: () => void
}) {
  const meta = copingStyle(entry.style)
  return (
    <div className="cbt-card">
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">{fmtDate(entry.timestamp)}</div>
          <div className="font-serif-body text-[15px] text-[#2a2a26] mt-1 line-clamp-2">{entry.what || entry.ways || '(bez opisu)'}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] text-[#8f4d63] border border-[#8f4d63]/40 px-2 py-0.5 rounded-full">{meta.label}</span>
            {entry.copingAwarded && <span className="text-[11px] text-[#8e7338] border border-[#c9b27f] px-2 py-0.5 rounded-full">◆ przepytany</span>}
          </div>
        </div>
        <ChevronDown size={15} className={clsx('text-[#8e7338] shrink-0 mt-1 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#c9b27f]/40">
          {entry.ways && (
            <div className="mt-4">
              <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338] mb-1.5">{meta.waysQ}</div>
              <div className="font-serif-body text-[14.5px] text-[#2a2a26] whitespace-pre-wrap">{entry.ways}</div>
            </div>
          )}
          <CopingWork entry={entry} cbt={cbt} />
          <div className="mt-5 flex items-center">
            <button onClick={onDelete} className="ml-auto font-ui text-[11px] text-[#7c7256] underline underline-offset-2 hover:text-[#8A3A2C] transition-colors">usuń wpis</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Pytania z ćwiczenia — lokalny stan + autozapis (debounce 700ms).
// Bonus +20 przyznawany raz, gdy konfrontacja + zdrowa alternatywa wypełnione.
function CopingWork({ entry, cbt }: { entry: CBTCopingEntry; cbt: ReturnType<typeof useCBT> }) {
  const [confront, setConfront] = useState(entry.confront)
  const [source, setSource] = useState(entry.source)
  const [healthy, setHealthy] = useState(entry.healthy)
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await cbt.updateCoping(entry.id, { confront, source, healthy })
      setSaved(true); setTimeout(() => setSaved(false), 1400)
    }, 700)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [confront, source, healthy])

  const cormorant = { fontFamily: "'Cormorant Garamond',serif", fontSize: '14px' } as const

  return (
    <div className="mt-5 pt-4 border-t border-dashed border-[#c9b27f]/60">
      <h4 className="font-display font-medium text-[16px] text-[#2a2a26]">Przepytaj ten automat</h4>
      <p className="font-serif-body italic text-[12.5px] text-[#7c7256] mt-0.5 mb-4">
        Te pytania książka radzi mieć zawsze przy sobie — wracaj do nich, gdy złapiesz się na tym zachowaniu.
      </p>

      <div className="mb-3">
        <label className="cbt-lab font-normal" style={cormorant}>Co by się stało, gdybym się tak nie zachowywała? Z czym musiałabym się zmierzyć? Jakich emocji unikam?</label>
        <textarea className="cbt-ta" rows={3} value={confront} onChange={e => setConfront(e.target.value)}
          placeholder="Mogłabym zrobić coś źle i kogoś zawieść. Zmierzyłabym się z przekonaniem, że jestem niewystarczająca. Unikam lęku." />
      </div>
      <div className="mb-3">
        <label className="cbt-lab font-normal" style={cormorant}>Jakie jest źródło tego zachowania? Czy przypomina sytuację z dzieciństwa?</label>
        <textarea className="cbt-ta" rows={3} value={source} onChange={e => setSource(e.target.value)}
          placeholder="Gdy byłam mała, liczyły się przede wszystkim dobre oceny — czułam, że nie mogę zawieść." />
      </div>

      <div className="mt-4 border border-[#c9b27f] bg-[#d3ccaf] p-3.5">
        <div className="font-ui uppercase tracking-luxury text-[9px] text-[#3f7d5c] mb-1.5">Jak bym się zachowała, gdyby nie dysfunkcyjne przekonania?</div>
        <textarea className="cbt-ta" rows={3} value={healthy} onChange={e => setHealthy(e.target.value)}
          placeholder="Robiłabym to bez presji. Gdyby coś wyszło źle — po prostu bym to poprawiła, bez poczucia, że zawiodłam." />
      </div>

      <div className="mt-3 flex items-center gap-3 min-h-[18px]">
        {entry.copingAwarded
          ? <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">◆ automat przepytany · +{XP_VALUES.cbtCoping} XP</span>
          : <span className="font-ui uppercase tracking-luxury text-[9px] text-[#7c7256] opacity-70">domknij: z czym się mierzę + jak bym się zachowała → +{XP_VALUES.cbtCoping} XP</span>}
        {saved && <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8f4d63] ml-auto">zapisano ✓</span>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
//  ZAKŁADKA: EKSPOZYCJA (drabina lęków + stopniowana ekspozycja)
// ════════════════════════════════════════════════════════════════════
function fearColor(fear: number): string {
  return fear < 34 ? DOWN : fear < 67 ? '#b58a3c' : UP
}

// Drabina lęków — szczeble od najniższego (dół) do najwyższego (góra), jak w książce.
// Szerszy u dołu = łatwiejszy start; kolor od zieleni (mały lęk) do wina (panika).
function FearLadderSVG({ rungs }: { rungs: CBTExposureRung[] }) {
  const sorted = sortRungs(rungs)
  if (sorted.length === 0) return null
  const n = sorted.length, w = 320, barH = 24, gap = 9, padY = 8, padX = 6
  const h = padY * 2 + n * barH + (n - 1) * gap
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[340px] mx-auto block" role="img" aria-label="Drabina lęków">
      {sorted.map((r, i) => {
        const fromTop = n - 1 - i // i=0 (najniższy lęk) ląduje na dole
        const y = padY + fromTop * (barH + gap)
        const t = Math.max(0, Math.min(100, r.fear)) / 100
        const barW = (w - 2 * padX) * (0.55 + 0.4 * (1 - t)) // szerszy = mniejszy lęk
        const color = fearColor(r.fear)
        const label = r.situation.length > 34 ? r.situation.slice(0, 33) + '…' : r.situation
        return (
          <g key={r.id}>
            <rect x={padX} y={y} width={barW} height={barH} rx={5} fill={r.done ? color : 'none'} fillOpacity={r.done ? 0.14 : 0} stroke={color} strokeWidth={1.4} />
            <text x={padX + 10} y={y + barH / 2 + 4} fontSize={11.5} fill="#2a2a26" fontFamily="'Cormorant Garamond',serif">{label || '—'}</text>
            <text x={padX + barW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize={11} fontWeight={600} fill={color} fontFamily="'Bodoni Moda',serif">{r.fear}{r.done ? ' ✓' : ''}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ExposureTab({ cbt }: { cbt: ReturnType<typeof useCBT> }) {
  const [area, setArea] = useState('')
  const [rows, setRows] = useState<{ situation: string; fear: number }[]>([{ situation: '', fear: 40 }, { situation: '', fear: 60 }, { situation: '', fear: 80 }])
  const [openId, setOpenId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const setRow = (i: number, k: 'situation' | 'fear', v: string | number) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const addRow = () => rows.length < 10 && setRows([...rows, { situation: '', fear: 50 }])
  const rmRow = (i: number) => rows.length > 1 && setRows(rows.filter((_, j) => j !== i))

  const save = async () => {
    const built: CBTExposureRung[] = rows.filter(r => r.situation.trim())
      .map(r => ({ ...emptyExposureRung(cbtUid()), situation: r.situation.trim(), fear: r.fear }))
    if (!area.trim() && built.length === 0) {
      setFlash('Najpierw nazwij lęk i dodaj sytuacje'); setTimeout(() => setFlash(null), 1600); return
    }
    const created = await cbt.createExposure({ area: area.trim(), rungs: built })
    setArea(''); setRows([{ situation: '', fear: 40 }, { situation: '', fear: 60 }, { situation: '', fear: 80 }])
    setFlash(created && created.xpEarned > 0 ? `Zapisano · +${created.xpEarned} XP` : 'Zapisano ✓')
    setTimeout(() => setFlash(null), 1800)
  }

  return (
    <div>
      <p className="font-serif-body italic text-parchment text-[14px] leading-[1.8] text-center mb-7 max-w-lg mx-auto">
        Wybierz jeden obszar lęku i rozłóż go na 10 sytuacji o różnej trudności. Oceń strach w każdej (0 = brak, 100 = panika)
        i ułóż je w drabinę — od najłatwiejszej. Potem wchodź na kolejne szczeble, wielokrotnie, aż strach opadnie.
      </p>

      {/* Ćw. 1 — budowa drabiny lęków */}
      <div className="cbt-card px-6 md:px-8 py-7">
        <div className="mb-5">
          <label className="cbt-lab">Obszar lęku<span className="cbt-hint">Jeden temat, np. „bliskość", „perfekcjonizm", „pająki".</span></label>
          <input className="cbt-input" value={area} onChange={e => setArea(e.target.value)} placeholder="perfekcjonizm" />
        </div>

        <label className="cbt-lab">Sytuacje i poziom strachu</label>
        {rows.map((r, i) => (
          <div key={i} className="mb-3">
            <div className="grid grid-cols-[1fr_28px] gap-2 items-start">
              <textarea className="cbt-ta" rows={2} value={r.situation} onChange={e => setRow(i, 'situation', e.target.value)}
                placeholder={i === 0 ? 'napisanie zdania z błędem' : 'kolejna sytuacja z tym lękiem'} />
              {rows.length > 1
                ? <button onClick={() => rmRow(i)} aria-label="usuń" className="text-[#7c7256] hover:text-[#8A3A2C] transition-colors flex justify-center pt-2"><X size={16} /></button>
                : <span />}
            </div>
            <div className="flex items-center gap-3 mt-1.5 pr-9">
              <span className="font-ui uppercase tracking-luxury text-[9px] text-[#7c7256] shrink-0">strach</span>
              <input type="range" min={0} max={100} step={5} value={r.fear} onChange={e => setRow(i, 'fear', Number(e.target.value))} className="cbt-range" />
              <span className="font-display font-semibold text-[16px] w-9 text-right" style={{ color: fearColor(r.fear) }}>{r.fear}</span>
            </div>
          </div>
        ))}
        {rows.length < 10 && (
          <button onClick={addRow} className="inline-flex items-center gap-1.5 mt-1 mb-6 px-3 py-1.5 border border-dashed border-[#c9b27f] text-[#6f6448] hover:border-[#b56a82] transition-colors">
            <Plus size={13} /><span className="font-ui uppercase tracking-luxury text-[10px]">dodaj sytuację</span>
          </button>
        )}

        <SaveButton onClick={save} flash={flash}>utwórz drabinę</SaveButton>
      </div>

      {/* Lista drabin */}
      <div className="mt-9 mb-4 flex items-center gap-2">
        <Diamond size={6} className="text-gold" />
        <SmallCaps tone="gold-light" tracking="luxury" size="xs">Twoje drabiny · {cbt.exposures.length}</SmallCaps>
      </div>

      {cbt.exposures.length === 0 ? (
        <EmptyNote>Tu staną Twoje drabiny lęków. Wielkie zmiany składają się z bardzo wielu małych kroków.</EmptyNote>
      ) : (
        <div className="space-y-3">
          {cbt.exposures.map(x => (
            <ExposureLadderCard key={x.id} entry={x} cbt={cbt} open={openId === x.id}
              onToggle={() => setOpenId(openId === x.id ? null : x.id)}
              onDelete={() => { cbt.deleteEntry(x.id); setOpenId(null) }} />
          ))}
        </div>
      )}
    </div>
  )
}

// Jedna drabina — lokalny stan szczebli + autozapis (debounce 700 ms).
// Bonus +15 za KAŻDY opanowany szczebel (done + „co mi się udało") — w useCBT.
function ExposureLadderCard({ entry, cbt, open, onToggle, onDelete }: {
  entry: CBTExposureLadder; cbt: ReturnType<typeof useCBT>; open: boolean; onToggle: () => void; onDelete: () => void
}) {
  const [area, setArea] = useState(entry.area)
  const [rungs, setRungs] = useState<CBTExposureRung[]>(entry.rungs)
  const [openRung, setOpenRung] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await cbt.updateExposure(entry.id, { area, rungs })
      setSaved(true); setTimeout(() => setSaved(false), 1400)
    }, 700)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [area, rungs])

  const patchRung = (id: string, patch: Partial<CBTExposureRung>) =>
    setRungs(rungs.map(r => (r.id === id ? { ...r, ...patch } : r)))
  const addRung = () => rungs.length < 10 && setRungs([...rungs, emptyExposureRung(cbtUid())])
  const rmRung = (id: string) => setRungs(rungs.filter(r => r.id !== id))

  const masteredCount = rungs.filter(r => r.done).length
  const sorted = sortRungs(rungs)
  // Trwały `awarded` z propa `entry` (świeży po nagrodzie), nie z lokalnego stanu.
  const awardedRungIds = new Set(entry.rungs.filter(r => r.awarded).map(r => r.id))
  const cormorant = { fontFamily: "'Cormorant Garamond',serif", fontSize: '14px' } as const

  return (
    <div className="cbt-card">
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">{fmtDate(entry.timestamp)}</div>
          <div className="font-display text-[16px] text-[#2a2a26] mt-1 leading-[1.35]">{entry.area || '(bez nazwy)'}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[11px] text-[#6f6448] border border-[#c9b27f] px-2 py-0.5 rounded-full">{rungs.length} szczebli</span>
            {masteredCount > 0 && <span className="text-[11px] text-[#3f7d5c] border border-[#3f7d5c]/40 px-2 py-0.5 rounded-full">◆ {masteredCount} opanowanych</span>}
          </div>
        </div>
        <ChevronDown size={15} className={clsx('text-[#8e7338] shrink-0 mt-1 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#c9b27f]/40">
          <div className="mt-4">
            <label className="cbt-lab font-normal" style={cormorant}>Obszar lęku</label>
            <input className="cbt-input" value={area} onChange={e => setArea(e.target.value)} />
          </div>

          {rungs.length > 0 && (
            <div className="mt-5">
              <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338] mb-2 text-center">Twoja drabina lęków</div>
              <FearLadderSVG rungs={rungs} />
            </div>
          )}

          <div className="mt-5 space-y-2">
            {sorted.map(r => {
              const isOpen = openRung === r.id
              return (
                <div key={r.id} className="border border-[#c9b27f] bg-[#d3ccaf]">
                  <button onClick={() => setOpenRung(isOpen ? null : r.id)} className="w-full text-left px-3.5 py-3 flex items-center gap-2.5">
                    <span className="font-display font-semibold text-[15px] w-8 shrink-0" style={{ color: fearColor(r.fear) }}>{r.fear}</span>
                    <span className="flex-1 min-w-0 font-serif-body text-[14px] text-[#2a2a26] line-clamp-1">{r.situation || '(sytuacja)'}</span>
                    {r.done && <span className="text-[#3f7d5c] shrink-0 text-[13px]">✓</span>}
                    <ChevronDown size={14} className={clsx('text-[#8e7338] shrink-0 transition-transform', isOpen && 'rotate-180')} />
                  </button>

                  {isOpen && (
                    <div className="px-3.5 pb-4 border-t border-[#c9b27f]/50">
                      <div className="mt-3">
                        <label className="cbt-lab font-normal" style={cormorant}>Sytuacja</label>
                        <textarea className="cbt-ta" rows={2} value={r.situation} onChange={e => patchRung(r.id, { situation: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="font-ui uppercase tracking-luxury text-[9px] text-[#7c7256] shrink-0">poziom strachu</span>
                        <input type="range" min={0} max={100} step={5} value={r.fear} onChange={e => patchRung(r.id, { fear: Number(e.target.value) })} className="cbt-range" />
                        <span className="font-display font-semibold text-[16px] w-9 text-right" style={{ color: fearColor(r.fear) }}>{r.fear}</span>
                      </div>
                      <div className="mt-3">
                        <label className="cbt-lab font-normal" style={cormorant}>Czynnik pomocniczy<span className="cbt-hint">Co pomoże Ci zrobić tę ekspozycję? np. towarzystwo bliskiej osoby.</span></label>
                        <input className="cbt-input" value={r.helper} onChange={e => patchRung(r.id, { helper: e.target.value })} />
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-dashed border-[#c9b27f]/60">
                        <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8A3A2C] mb-2">Przed ekspozycją</div>
                        <label className="cbt-lab font-normal" style={cormorant}>Plan ekspozycji<span className="cbt-hint">Co, kiedy, gdzie i jak?</span></label>
                        <textarea className="cbt-ta" rows={2} value={r.plan} onChange={e => patchRung(r.id, { plan: e.target.value })} />
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-dashed border-[#c9b27f]/60">
                        <div className="font-ui uppercase tracking-luxury text-[9px] text-[#3f7d5c] mb-2">Po ekspozycji</div>
                        <div className="mb-2.5">
                          <label className="cbt-lab font-normal" style={cormorant}>Jak przebiegła? (obserwacje)</label>
                          <textarea className="cbt-ta" rows={2} value={r.observations} onChange={e => patchRung(r.id, { observations: e.target.value })} />
                        </div>
                        <div className="mb-2.5">
                          <label className="cbt-lab font-normal" style={cormorant}>Jakie myśli się pojawiły?</label>
                          <textarea className="cbt-ta" rows={2} value={r.thoughts} onChange={e => patchRung(r.id, { thoughts: e.target.value })} />
                        </div>
                        <div>
                          <label className="cbt-lab font-normal" style={cormorant}>Co mi się udało?<span className="cbt-hint">Doceń swoją pracę — choćby najmniejszy krok.</span></label>
                          <textarea className="cbt-ta" rows={2} value={r.success} onChange={e => patchRung(r.id, { success: e.target.value })} />
                        </div>
                      </div>

                      <button onClick={() => patchRung(r.id, { done: !r.done })}
                        className={clsx('mt-3.5 w-full py-2.5 border transition-colors text-center font-ui uppercase tracking-luxury text-[10px]',
                          r.done ? 'bg-[#3f7d5c]/15 border-[#3f7d5c] text-[#3f7d5c]' : 'bg-dark-deep border-gold text-ivory hover:bg-forest')}>
                        {r.done ? '✓ szczebel opanowany' : 'oznacz jako opanowany'}
                      </button>
                      <div className="mt-2 flex items-center gap-3 min-h-[16px]">
                        {awardedRungIds.has(r.id)
                          ? <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8e7338]">◆ +{XP_VALUES.cbtExposure} XP za ekspozycję</span>
                          : <span className="font-ui uppercase tracking-luxury text-[9px] text-[#7c7256] opacity-70">opanuj szczebel + „co mi się udało" → +{XP_VALUES.cbtExposure} XP</span>}
                        <button onClick={() => rmRung(r.id)} aria-label="usuń szczebel" className="ml-auto font-ui text-[10px] text-[#7c7256] underline underline-offset-2 hover:text-[#8A3A2C] transition-colors">usuń</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {rungs.length < 10 && (
              <button onClick={addRung} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#c9b27f] text-[#6f6448] hover:border-[#b56a82] transition-colors">
                <Plus size={13} /><span className="font-ui uppercase tracking-luxury text-[10px]">dodaj szczebel</span>
              </button>
            )}
            {saved && <span className="font-ui uppercase tracking-luxury text-[9px] text-[#8f4d63]">zapisano ✓</span>}
            <button onClick={onDelete} className="ml-auto font-ui text-[11px] text-[#7c7256] underline underline-offset-2 hover:text-[#8A3A2C] transition-colors">usuń drabinę</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
//  ZAKŁADKA: TARCZA
// ════════════════════════════════════════════════════════════════════

// Herbowa tarcza (escutcheon) rytowana cienką kreską: rama z trzech części
// (barki / proste boki / ostrze), żeby rosła z liczbą zdań. SVG skalują się
// z szerokością kontenera, więc linie środkowej sekcji muszą być pozycjonowane
// PROCENTOWO na tych samych odciętych co ścieżki (x/320) — stały px by się
// rozjechał na szwach przy każdej szerokości ≠ 320.
const SHIELD_STROKE = '#b29355'
function ShieldTop() {
  return (
    <svg viewBox="0 0 320 30" className="w-full block" aria-hidden>
      <path d="M 0.5 30 L 0.5 12 Q 0.5 3.5 10 3.5 L 310 3.5 Q 319.5 3.5 319.5 12 L 319.5 30" fill="none" stroke={SHIELD_STROKE} strokeWidth="1" opacity="0.8" />
      <path d="M 5.5 30 L 5.5 14 Q 5.5 8 12 8 L 308 8 Q 314.5 8 314.5 14 L 314.5 30" fill="none" stroke={SHIELD_STROKE} strokeWidth="0.8" opacity="0.45" />
    </svg>
  )
}
function ShieldBottom() {
  return (
    <svg viewBox="0 0 320 96" className="w-full block" aria-hidden>
      <path d="M 0.5 0 L 0.5 14 C 0.5 46 40 68 160 88 C 280 68 319.5 46 319.5 14 L 319.5 0" fill="none" stroke={SHIELD_STROKE} strokeWidth="1" opacity="0.8" />
      <path d="M 5.5 0 L 5.5 13 C 5.5 42 44 62 160 80 C 276 62 314.5 42 314.5 13 L 314.5 0" fill="none" stroke={SHIELD_STROKE} strokeWidth="0.8" opacity="0.45" />
      <rect x="156.75" y="40.75" width="6.5" height="6.5" transform="rotate(45 160 44)" fill={SHIELD_STROKE} opacity="0.85" />
    </svg>
  )
}
function ShieldMid({ children }: { children: React.ReactNode }) {
  // Odcięte linii jak w ścieżkach SVG: zewnętrzna x=0.5/320, wewnętrzna x=5.5/320.
  const OUTER = `${(0.5 / 320) * 100}%`
  const INNER = `${(5.5 / 320) * 100}%`
  return (
    <div className="relative">
      <span aria-hidden className="absolute top-0 bottom-0 w-px -translate-x-1/2" style={{ left: OUTER, background: 'rgba(178,147,85,0.8)' }} />
      <span aria-hidden className="absolute top-0 bottom-0 w-px -translate-x-1/2" style={{ left: INNER, background: 'rgba(178,147,85,0.45)' }} />
      <span aria-hidden className="absolute top-0 bottom-0 w-px translate-x-1/2" style={{ right: OUTER, background: 'rgba(178,147,85,0.8)' }} />
      <span aria-hidden className="absolute top-0 bottom-0 w-px translate-x-1/2" style={{ right: INNER, background: 'rgba(178,147,85,0.45)' }} />
      <div className="px-7 md:px-9">{children}</div>
    </div>
  )
}

function ShieldTab({ shield, onSave }: { shield: CBTShield; onSave: (s: CBTShield) => Promise<void> }) {
  const [input, setInput] = useState('')
  const all = [...BOOK_SHIELD, ...shield.custom]
  const selected = all.filter(s => shield.selected.includes(s))

  const toggle = (s: string) => {
    const next = shield.selected.includes(s) ? shield.selected.filter(x => x !== s) : [...shield.selected, s]
    onSave({ ...shield, selected: next })
  }
  const removeCustom = (s: string) =>
    onSave({ ...shield, custom: shield.custom.filter(c => c !== s), selected: shield.selected.filter(c => c !== s) })
  const add = () => {
    const v = input.trim()
    if (!v || BOOK_SHIELD.includes(v) || shield.custom.includes(v)) { setInput(''); return }
    onSave({ ...shield, custom: [...shield.custom, v], selected: [...shield.selected, v] })
    setInput('')
  }

  return (
    <div>
      <p className="font-serif-body italic text-parchment text-[14px] leading-[1.8] text-center mb-7 max-w-lg mx-auto">
        Wybierz zdania, które są dla Ciebie kojące — które byłyby wsparciem, gdybyś usłyszała je od kogoś bliskiego.
        Dopisz własne. W gorszych chwilach przywołuj je do siebie.
      </p>

      {/* Aktywna tarcza — zdania wyryte w herbowym obrysie */}
      <div className="cbt-card px-6 md:px-8 py-6">
        <div className="font-ui uppercase tracking-luxury text-[9px] text-[#8A3A2C] mb-4 text-center">Twoja tarcza</div>
        {selected.length === 0 ? (
          <p className="font-serif-body italic text-[14px] text-[#7c7256] text-center">Zaznacz poniżej zdania, które Cię wspierają — pojawią się tutaj.</p>
        ) : (
          <div className="max-w-[380px] mx-auto">
            <ShieldTop />
            <ShieldMid>
              <ul className="space-y-0 py-1">
                {selected.map(s => (
                  <li
                    key={s}
                    className="font-display text-[16px] text-[#2a2a26] leading-[1.4] py-2.5 border-b border-[#c9b27f]/40 last:border-0 text-center animate-slide-up"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </ShieldMid>
            <ShieldBottom />
          </div>
        )}
      </div>

      <div className="mt-8 mb-4 flex items-center gap-2">
        <Diamond size={6} className="text-gold" />
        <SmallCaps tone="gold-light" tracking="luxury" size="xs">Wybierz, co Cię wspiera</SmallCaps>
      </div>

      <div className="space-y-2">
        {all.map(s => {
          const on = shield.selected.includes(s)
          const custom = shield.custom.includes(s)
          return (
            <div key={s}
              onClick={() => toggle(s)}
              className={clsx('cbt-card flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors', on ? 'ring-1 ring-[#b56a82]' : '')}>
              <span className={clsx('w-5 h-5 shrink-0 mt-0.5 rotate-45 relative border', on ? 'border-[#b56a82]' : 'border-[#8e7338]')}>
                {on && <span className="absolute inset-[3px]" style={{ background: ROSE }} />}
              </span>
              <span className="font-serif-body text-[14.5px] text-[#2a2a26] flex-1">{s}</span>
              {custom && (
                <button onClick={ev => { ev.stopPropagation(); removeCustom(s) }} aria-label="usuń własne" className="text-[#7c7256] hover:text-[#8A3A2C] transition-colors shrink-0"><X size={15} /></button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <input className="cbt-input flex-1" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }} placeholder="dopisz własne zdanie…" />
        <button onClick={add} className="px-5 bg-dark-deep border border-gold text-ivory hover:bg-forest transition-colors">
          <SmallCaps tone="ivory" tracking="luxury" size="xs">dodaj</SmallCaps>
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
//  WSPÓLNE DROBNE KOMPONENTY
// ════════════════════════════════════════════════════════════════════
function SaveButton({ onClick, flash, children }: { onClick: () => void; flash: string | null; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full py-3.5 bg-dark-deep border border-gold text-ivory hover:bg-forest hover:border-gold-light transition-colors flex items-center justify-center gap-2.5">
      <Diamond size={6} className="text-gold" />
      <SmallCaps tone="ivory" tracking="luxury" size="sm">{flash || children}</SmallCaps>
      <Diamond size={6} className="text-gold" />
    </button>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-gold-light/30 px-6 py-8 text-center">
      <p className="font-serif-body italic text-parchment text-[14px]">{children}</p>
    </div>
  )
}
