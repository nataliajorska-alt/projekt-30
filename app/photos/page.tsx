'use client'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { usePhotos } from '@/hooks/usePhotos'
import { Camera, Trash2, X, Upload } from 'lucide-react'
import type { PhotoEntry } from '@/types'
import { SmallCaps, GoldRule, Diamond, Fleuron } from '@/components/ui'

const PL_MONTHS = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']

function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return `${d} ${PL_MONTHS[m - 1]} ${y}`
}

function groupByMonth(photos: PhotoEntry[]): { monthKey: string; label: string; items: PhotoEntry[] }[] {
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
      return { monthKey: key, label: `${PL_MONTHS[m - 1]} ${y}`, items }
    })
}

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
    const url = URL.createObjectURL(f)
    setPreview(url)
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
            <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
              Photo Timeline
            </SmallCaps>
            <h2 className="font-display text-dark text-2xl mt-1 leading-tight">Dodaj zdjęcie</h2>
          </div>
          <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div
          className={clsx(
            'w-full h-48 border mb-4 flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
            preview
              ? 'border-gold-light/60'
              : 'border-2 border-dashed border-hairline hover:border-gold'
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
              <SmallCaps tone="muted" tracking="luxury" size="xs">
                Kliknij lub przeciągnij zdjęcie
              </SmallCaps>
              <p className="font-serif-body italic text-muted-light text-[12px] mt-1.5">
                jpg · png · webp
              </p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        <input
          type="text"
          placeholder="podpis (opcjonalnie)…"
          value={caption}
          onChange={e => setCaption(e.target.value.slice(0, 120))}
          className="w-full font-serif-body text-[14px] text-dark bg-cream/40 px-4 py-3 border border-hairline outline-none focus:border-gold mb-4 placeholder:text-muted-light/60 transition-colors"
        />

        {uploadError && (
          <div className="mb-3 px-4 py-3 bg-red-50/50 border border-red-200">
            <p className="font-serif-body italic text-red-700 text-[12.5px] leading-relaxed">
              {uploadError}
            </p>
            <SmallCaps tone="muted" tracking="luxury" size="xs" className="mt-1.5 block opacity-70">
              firebase console → build → storage → utwórz
            </SmallCaps>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!file || uploading}
            className="flex-1 py-3 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Diamond size={5} className="text-gold" />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              {uploading ? 'wgrywam…' : 'zapisz zdjęcie'}
            </SmallCaps>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 border border-hairline text-muted hover:text-dark hover:border-gold transition-colors"
          >
            <SmallCaps tone="muted" tracking="luxury" size="xs">
              anuluj
            </SmallCaps>
          </button>
        </div>
      </div>
    </div>
  )
}

interface LightboxProps {
  photo: PhotoEntry
  onClose: () => void
  onDelete: (p: PhotoEntry) => void
}

function Lightbox({ photo, onClose, onDelete }: LightboxProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="fixed inset-0 z-[130] bg-forest-deep/95 grain-linen flex flex-col animate-fade-in" onClick={onClose}>
      <div
        className="flex items-center justify-between px-6 pt-7 pb-4 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <SmallCaps tone="gold-light" tracking="luxury" size="xs">
            Dzień {photo.dayOfProject}
          </SmallCaps>
          <p className="font-serif-body italic text-parchment text-[13px] mt-0.5">
            {formatDateShort(photo.dateKey)}
          </p>
        </div>
        <button onClick={onClose} className="text-ivory/50 hover:text-ivory transition-colors">
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-4 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={photo.url}
          alt={photo.caption ?? ''}
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>

      {photo.caption && (
        <p
          className="text-center font-serif-body italic text-parchment text-[14px] px-6 py-4"
          onClick={e => e.stopPropagation()}
        >
          „{photo.caption}"
        </p>
      )}

      <div
        className="px-6 py-5 flex justify-between items-center flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <SmallCaps tone="parchment" tracking="luxury" size="xs">
              usunąć?
            </SmallCaps>
            <button
              onClick={() => { onDelete(photo); onClose() }}
              className="font-ui uppercase tracking-luxury text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              tak, usuń
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors"
            >
              anuluj
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-parchment/40 hover:text-parchment/80 transition-colors"
          >
            <Trash2 size={12} strokeWidth={1.5} />
            <SmallCaps tracking="luxury" size="xs">
              <span className="!text-current">usuń</span>
            </SmallCaps>
          </button>
        )}
        <button
          onClick={onClose}
          className="font-ui uppercase tracking-luxury text-[10px] text-parchment/50 hover:text-parchment transition-colors"
        >
          zamknij  ◆
        </button>
      </div>
    </div>
  )
}

export default function PhotosPage() {
  const { photos, loading, uploading, uploadError, uploadPhoto, deletePhoto } = usePhotos()
  const [showUpload, setShowUpload] = useState(false)
  const [lightbox, setLightbox] = useState<PhotoEntry | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('action') === 'upload') setShowUpload(true)
  }, [searchParams])

  const grouped = groupByMonth(photos)

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-12 animate-fade-in">
      {/* Editorial header */}
      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <SmallCaps tone="muted" tracking="editorial" size="xs">
            Dokumentacja · Vol. I
          </SmallCaps>
          <h1 className="font-display text-dark text-[clamp(2rem,5vw,2.75rem)] leading-tight mt-2">
            Photo Timeline
          </h1>
          <p className="font-serif-body italic text-muted text-[14px] mt-2">
            {photos.length} {photos.length === 1 ? 'zdjęcie' : photos.length < 5 ? 'zdjęcia' : 'zdjęć'} · trafi do annual report.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors shrink-0"
        >
          <Camera size={13} strokeWidth={1.5} />
          <SmallCaps tone="ivory" tracking="luxury" size="xs">
            dodaj
          </SmallCaps>
        </button>
      </header>

      <GoldRule variant="diamond" tone="gold-deep" className="mb-8 opacity-50" />

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square bg-cream border border-hairline animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-ivory border border-gold-light/40 px-6 py-16 text-center">
          <Fleuron size={16} className="text-gold-deep mx-auto mb-4 inline-block" />
          <h3 className="font-display text-dark text-2xl">Zacznij dokumentować rok</h3>
          <p className="font-serif-body italic text-muted text-[14px] mt-3 mb-7 max-w-sm mx-auto leading-relaxed">
            zdjęcia z transformacji — nie dla innych, dla siebie i annual report.
            za rok zobaczysz jak daleko zaszłaś.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-dark-deep text-ivory border border-gold hover:bg-forest transition-colors"
          >
            <Camera size={13} strokeWidth={1.5} />
            <SmallCaps tone="ivory" tracking="luxury" size="xs">
              dodaj pierwsze zdjęcie
            </SmallCaps>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.monthKey}>
              <div className="flex items-center gap-3 mb-4">
                <Diamond size={5} className="text-gold-deep" />
                <SmallCaps tone="gold-deep" tracking="luxury" size="sm">
                  {group.label}
                </SmallCaps>
                <span className="flex-1 h-px bg-hairline" />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {group.items.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => setLightbox(photo)}
                    className="aspect-square overflow-hidden hover:opacity-90 transition-opacity relative group border border-hairline"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? ''}
                      fill
                      sizes="(min-width: 640px) 25vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-forest-deep/0 group-hover:bg-forest-deep/15 transition-colors" />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-forest-deep/70 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="font-serif-body italic text-ivory text-[11px] truncate">
                          {photo.caption}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onUpload={uploadPhoto}
          uploading={uploading}
          uploadError={uploadError}
          onClose={() => setShowUpload(false)}
        />
      )}

      {lightbox && (
        <Lightbox
          photo={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={deletePhoto}
        />
      )}
    </div>
  )
}
