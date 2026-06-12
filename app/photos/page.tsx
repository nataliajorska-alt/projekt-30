'use client'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { usePhotos } from '@/hooks/usePhotos'
import { Camera, Trash2, X, Upload } from 'lucide-react'
import type { PhotoEntry } from '@/types'
import { SmallCaps, Diamond, Fleuron } from '@/components/ui'
import { toRoman } from '@/lib/romanNumerals'

const PL_MONTHS = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']
const PL_MONTHS_FULL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return `${d} ${PL_MONTHS[m - 1]} ${y}`
}

function odbitkiWord(n: number): string {
  if (n === 1) return 'odbitka'
  const lastDigit = n % 10
  const lastTwo = n % 100
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'odbitki'
  return 'odbitek'
}

interface MonthGroup { monthKey: string; monthName: string; year: number; items: PhotoEntry[] }

function groupByMonth(photos: PhotoEntry[]): MonthGroup[] {
  const map: Record<string, PhotoEntry[]> = {}
  for (const p of photos) {
    const [y, m] = p.dateKey.split('-')
    const key = `${y}-${m}`
    if (!map[key]) map[key] = []
    map[key].push(p)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [y, m] = key.split('-').map(Number)
      return {
        monthKey: key,
        monthName: PL_MONTHS_FULL[m - 1],
        year: y,
        items: items.slice().sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
      }
    })
}

// ── Upload modal (zachowany) ─────────────────────────────────────

interface UploadModalProps {
  onUpload: (file: File, caption?: string) => Promise<unknown>
  uploading: boolean
  uploadError: string | null
  onClose: () => void
}

function UploadModal({ onUpload, uploading, uploadError, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFile(f)
  }
  const handleSave = async () => {
    if (!file) return
    await onUpload(file, caption.trim() || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-forest-deep/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md mx-4 mb-4 sm:mb-0 bg-ivory border border-gold-light/40 p-7 animate-slide-up">
        <div className="flex items-start justify-between mb-5">
          <div>
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">Photo Timeline</SmallCaps>
            <h2 className="font-display text-dark text-2xl mt-1 leading-tight">Dodaj zdjęcie</h2>
          </div>
          <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div
          className={clsx(
            'w-full h-48 border mb-4 flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
            preview ? 'border-gold-light/60' : 'border-2 border-dashed border-hairline hover:border-gold'
          )}
          onClick={() => !preview && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {preview ? (
            <div className="relative w-full h-full group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-dark-deep/70 text-ivory p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="text-center px-4">
              <Upload size={22} className="text-muted-light mx-auto mb-3" strokeWidth={1.5} />
              <SmallCaps tone="muted" tracking="luxury" size="xs">Kliknij lub przeciągnij zdjęcie</SmallCaps>
              <p className="font-serif-body italic text-muted-light text-[12px] mt-1.5">jpg · png · webp</p>
            </div>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        <input
          type="text"
          placeholder="podpis (opcjonalnie)…"
          value={caption}
          onChange={e => setCaption(e.target.value.slice(0, 120))}
          className="w-full font-serif-body text-[14px] text-dark bg-cream/40 px-4 py-3 border border-hairline outline-none focus:border-gold mb-4 placeholder:text-muted-light/60 transition-colors"
        />

        {uploadError && (
          <div className="mb-3 px-4 py-3 bg-red-50/50 border border-red-200">
            <p className="font-serif-body italic text-red-700 text-[12.5px] leading-relaxed">{uploadError}</p>
            <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1.5 block opacity-70">
              firebase console → build → storage → utwórz
            </SmallCaps>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={!file || uploading}
            className="flex-1 py-3 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">{uploading ? 'wgrywam…' : 'zapisz zdjęcie'}</SmallCaps>
          </button>
          <button onClick={onClose}
            className="px-4 py-3 border border-hairline text-muted hover:text-dark hover:border-gold transition-colors">
            <SmallCaps tone="muted" tracking="luxury" size="xs">anuluj</SmallCaps>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lightbox (kadr + nawigacja) ──────────────────────────────────

interface LbItem { photo: PhotoEntry; no: number; monthName: string; year: number }

function Lightbox({ items, index, onNav, onClose, onDelete }: {
  items: LbItem[]
  index: number
  onNav: (i: number) => void
  onClose: () => void
  onDelete: (p: PhotoEntry) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cur = items[index]

  useEffect(() => { setConfirmDelete(false) }, [index])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNav((index - 1 + items.length) % items.length)
      if (e.key === 'ArrowRight') onNav((index + 1) % items.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, items.length, onNav, onClose])

  if (!cur) return null
  const { photo, no, monthName, year } = cur

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center animate-fade-in" style={{ background: 'rgba(16,20,17,.95)' }} onClick={onClose}>
      <button onClick={onClose} aria-label="Zamknij"
        className="absolute top-7 right-8 w-11 h-11 flex items-center justify-center border border-gold-light/45 text-gold-light font-serif-body text-xl hover:bg-gold/[0.12] transition-colors">✕</button>

      {items.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); onNav((index - 1 + items.length) % items.length) }} aria-label="Poprzednie"
            className="absolute left-4 sm:left-12 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-gold-light/45 text-gold-light font-serif-body text-2xl hover:bg-gold/[0.12] hover:border-gold transition-colors">‹</button>
          <button onClick={e => { e.stopPropagation(); onNav((index + 1) % items.length) }} aria-label="Następne"
            className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-gold-light/45 text-gold-light font-serif-body text-2xl hover:bg-gold/[0.12] hover:border-gold transition-colors">›</button>
        </>
      )}

      <div className="text-center max-w-[760px] px-4" onClick={e => e.stopPropagation()}>
        <div className="relative inline-block bg-paper-soft p-3 border border-gold-light/55" style={{ background: '#F8F3E6' }}>
          <span className="pointer-events-none absolute inset-[5px] border border-gold-light/35" />
          <div className="relative" style={{ width: 'min(58vh, 560px)', height: 'min(58vh, 560px)' }}>
            <Image src={photo.url} alt={photo.caption ?? ''} fill sizes="58vh" className="object-cover" />
          </div>
        </div>
        <div className="mt-[18px]">
          <div className="font-ui uppercase text-[9px] tracking-[0.34em] text-gold-light">
            № {toRoman(no)} · {monthName} {toRoman(year)}
          </div>
          <div className={clsx('mt-2 font-serif-body italic text-[19px]', photo.caption ? 'text-gold-pale' : 'text-muted-light')}>
            {photo.caption ? `„${photo.caption}"` : 'bez podpisu'}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-5">
          <SmallCaps tone="parchment" tracking="luxury" size="xs" className="opacity-60">
            dzień {photo.dayOfProject} · {formatDateShort(photo.dateKey)}
          </SmallCaps>
          {confirmDelete ? (
            <span className="flex items-center gap-3">
              <button onClick={() => { onDelete(photo); onClose() }}
                className="font-ui uppercase tracking-luxury text-[10px] text-red-400 hover:text-red-300 transition-colors">tak, usuń</button>
              <button onClick={() => setConfirmDelete(false)}
                className="font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors">anuluj</button>
            </span>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-parchment/40 hover:text-parchment/80 transition-colors">
              <Trash2 size={11} strokeWidth={1.5} />
              <SmallCaps tracking="luxury" size="xs"><span className="!text-current">usuń</span></SmallCaps>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Plate (odbitka) ──────────────────────────────────────────────

function Plate({ photo, no, lead, onOpen }: { photo: PhotoEntry; no: number; lead: boolean; onOpen: () => void }) {
  return (
    <figure className={clsx('group cursor-pointer', lead && 'col-span-2 row-span-2')} onClick={onOpen}>
      <div className={clsx(
        'relative bg-paper-soft border border-hairline px-2.5 pt-2.5 transition-all duration-200 group-hover:border-gold-light group-hover:-translate-y-[3px]',
        lead && 'h-full flex flex-col'
      )} style={{ background: '#F8F3E6', boxShadow: 'none' }}>
        <span className="pointer-events-none absolute top-1 left-1 w-2 h-2 border-l border-t border-gold-light opacity-0 group-hover:opacity-90 transition-opacity" />
        <span className="pointer-events-none absolute bottom-1 right-1 w-2 h-2 border-r border-b border-gold-light opacity-0 group-hover:opacity-90 transition-opacity" />
        <div className={clsx('relative overflow-hidden', lead ? 'flex-1 min-h-0' : 'aspect-square')} style={{ outline: '1px solid rgba(178,147,85,.4)', outlineOffset: -1 }}>
          <Image
            src={photo.url}
            alt={photo.caption ?? ''}
            fill
            sizes={lead ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 640px) 25vw, 50vw'}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            style={{ filter: 'saturate(.96)' }}
          />
          <span className="absolute right-2.5 bottom-2.5 w-[30px] h-[30px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(22,27,24,.78)', color: '#C9B27F' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-3.5 h-3.5">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16" y2="16" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </span>
        </div>
        <figcaption className="flex items-baseline gap-2.5 px-1 py-2.5">
          <span className="font-ui uppercase text-[8px] tracking-[0.26em] text-gold-deep whitespace-nowrap">№ {toRoman(no)}</span>
          <span className="flex-1 h-px bg-border self-center min-w-[14px]" />
          {photo.caption ? (
            <span className={clsx('font-serif-body italic text-ink-text overflow-hidden text-ellipsis whitespace-nowrap', lead ? 'text-[16px]' : 'text-[14px]')} style={{ color: '#2A2A26' }}>
              {photo.caption}
            </span>
          ) : (
            <span className="font-serif-body italic text-[14px] text-muted-light opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              dodaj podpis&nbsp;✎
            </span>
          )}
        </figcaption>
      </div>
    </figure>
  )
}

// ── Strona ───────────────────────────────────────────────────────

export default function PhotosPage() {
  const { photos, loading, uploading, uploadError, uploadPhoto, deletePhoto } = usePhotos()
  const [showUpload, setShowUpload] = useState(false)
  const [lbIndex, setLbIndex] = useState<number | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('action') === 'upload') setShowUpload(true)
  }, [searchParams])

  const groups = groupByMonth(photos)
  const ordered: LbItem[] = []
  for (const g of groups) {
    for (const p of g.items) ordered.push({ photo: p, no: 0, monthName: g.monthName, year: g.year })
  }
  const total = ordered.length
  ordered.forEach((o, i) => { o.no = total - i })
  const indexById = new Map(ordered.map((o, i) => [o.photo.id, i]))
  const oldest = groups[groups.length - 1]

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="grid grid-cols-[1fr_auto] items-end gap-4">
        <div className="min-w-0">
          <SmallCaps tone="muted" tracking="editorial" size="xs">Dokumentacja · Vol. I</SmallCaps>
          <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">Photo Timeline</h1>
          <p className="font-serif-body italic text-muted text-[14px] mt-2">
            {total > 0 ? <>{toRoman(total)} {odbitkiWord(total)} w archiwum · trafią do annual report.</> : 'archiwum czeka na pierwszą odbitkę.'}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2.5 px-5 py-3 bg-dark text-ivory border border-gold hover:bg-forest transition-colors shrink-0"
        >
          <Camera size={14} strokeWidth={1.5} className="text-gold-light" />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">Dodaj</SmallCaps>
        </button>
      </header>

      <div className="flex items-center gap-3.5 mt-7 mb-2.5">
        <span className="flex-1 h-px bg-hairline" />
        <span className="text-gold text-[13px]">◆</span>
        <span className="flex-1 h-px bg-hairline" />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="aspect-square bg-cream border border-hairline animate-pulse" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="bg-ivory border border-gold-light/40 px-6 py-16 text-center mt-8">
          <Fleuron size={16} className="text-gold-deep mx-auto mb-4 inline-block" />
          <h3 className="font-display text-dark text-2xl">Zacznij dokumentować rok</h3>
          <p className="font-serif-body italic text-muted text-[14px] mt-3 mb-7 max-w-sm mx-auto leading-relaxed">
            zdjęcia z transformacji — nie dla innych, dla siebie i annual report.
            za rok zobaczysz jak daleko zaszłaś.
          </p>
          <button onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-dark text-ivory border border-gold hover:bg-forest transition-colors">
            <Camera size={13} strokeWidth={1.5} className="text-gold-light" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">dodaj pierwsze zdjęcie</SmallCaps>
          </button>
        </div>
      ) : (
        <>
          {groups.map(group => {
            const useLead = group.items.length >= 3
            return (
              <section key={group.monthKey} className="mt-10">
                <div className="flex items-baseline gap-4 mb-5">
                  <span className="text-gold text-[9px] self-center">◆</span>
                  <h2 className="font-display text-dark text-[23px] tracking-tight whitespace-nowrap">{group.monthName}</h2>
                  <span className="font-ui uppercase text-[9px] tracking-[0.3em] text-gold-deep">{toRoman(group.year)}</span>
                  <span className="flex-1 h-px bg-hairline self-center" />
                  <span className="font-serif-body italic text-muted text-[14px] whitespace-nowrap">
                    <b className="not-italic font-display text-gold-deep text-[13px] tracking-[0.06em]">{toRoman(group.items.length)}</b> {odbitkiWord(group.items.length)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 [grid-auto-flow:dense]">
                  {group.items.map((p, i) => (
                    <Plate
                      key={p.id}
                      photo={p}
                      no={total - (indexById.get(p.id) ?? 0)}
                      lead={useLead && i === 0}
                      onOpen={() => setLbIndex(indexById.get(p.id) ?? 0)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          <div className="mt-14 text-center">
            <div className="text-gold text-[12px]" style={{ letterSpacing: '0.8em', paddingLeft: '0.8em' }}>∴ ∴ ∴</div>
            {oldest && (
              <div className="mt-2.5 font-serif-body italic text-muted text-[14px]">
                początek archiwum · {oldest.monthName.toLowerCase()} {oldest.year}
              </div>
            )}
          </div>
        </>
      )}

      {showUpload && (
        <UploadModal
          onUpload={uploadPhoto}
          uploading={uploading}
          uploadError={uploadError}
          onClose={() => setShowUpload(false)}
        />
      )}

      {lbIndex !== null && (
        <Lightbox
          items={ordered}
          index={lbIndex}
          onNav={setLbIndex}
          onClose={() => setLbIndex(null)}
          onDelete={deletePhoto}
        />
      )}
    </div>
  )
}
