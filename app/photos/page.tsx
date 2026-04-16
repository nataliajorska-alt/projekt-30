'use client'
import { useRef, useState } from 'react'
import { usePhotos } from '@/hooks/usePhotos'
import { Camera, Trash2, X, Upload } from 'lucide-react'
import type { PhotoEntry } from '@/types'
import clsx from 'clsx'

const PL_MONTHS = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']

function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return `${d} ${PL_MONTHS[m - 1]} ${y}`
}

// Group photos by month
function groupByMonth(photos: PhotoEntry[]): { monthKey: string; label: string; items: PhotoEntry[] }[] {
  const map: Record<string, PhotoEntry[]> = {}
  for (const p of photos) {
    const [y, m] = p.dateKey.split('-')
    const key = `${y}-${m}`
    if (!map[key]) map[key] = []
    map[key].push(p)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a)) // newest first
    .map(([key, items]) => {
      const [y, m] = key.split('-').map(Number)
      return { monthKey: key, label: `${PL_MONTHS[m - 1]} ${y}`, items }
    })
}

interface UploadModalProps {
  onUpload: (file: File, caption?: string) => Promise<unknown>
  uploading: boolean
  onClose: () => void
}

function UploadModal({ onUpload, uploading, onClose }: UploadModalProps) {
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
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md mx-4 mb-4 sm:mb-0 bg-ivory rounded-2xl shadow-2xl border border-cream/60 p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-0.5">Photo Timeline</p>
            <h2 className="font-serif text-dark text-lg">Dodaj zdjęcie</h2>
          </div>
          <button onClick={onClose} className="text-muted-light hover:text-dark transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Drop zone / preview */}
        <div
          className={clsx(
            'w-full h-48 rounded-xl border-2 border-dashed mb-4 flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
            preview ? 'border-transparent' : 'border-cream hover:border-gold/40'
          )}
          onClick={() => !preview && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {preview ? (
            <div className="relative w-full h-full group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-dark/60 text-ivory rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="text-center px-4">
              <Upload size={24} className="text-muted-light mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-sans text-sm text-muted">Kliknij lub przeciągnij zdjęcie</p>
              <p className="font-sans text-xs text-muted-light mt-1">JPG, PNG, WEBP</p>
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
          placeholder="Podpis (opcjonalnie)..."
          value={caption}
          onChange={e => setCaption(e.target.value.slice(0, 120))}
          className="w-full font-sans text-sm text-dark bg-cream/50 rounded-xl px-4 py-2.5 border border-cream outline-none focus:border-gold/40 mb-4 placeholder:text-muted-light/50 transition-colors"
        />

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!file || uploading}
            className="flex-1 py-2.5 rounded-xl bg-forest text-ivory font-sans text-sm disabled:opacity-40 hover:bg-forest/90 transition-colors"
          >
            {uploading ? 'Wgrywam...' : 'Zapisz zdjęcie ✦'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-cream font-sans text-sm text-muted hover:text-dark transition-colors"
          >
            Anuluj
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
    <div className="fixed inset-0 z-[130] bg-dark/95 flex flex-col animate-fade-in" onClick={onClose}>
      <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <div>
          <p className="font-sans text-[10px] text-gold/60 uppercase tracking-widest">Dzień {photo.dayOfProject}</p>
          <p className="font-sans text-sm text-ivory/70">{formatDateShort(photo.dateKey)}</p>
        </div>
        <button onClick={onClose} className="text-ivory/50 hover:text-ivory transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ?? ''}
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>

      {photo.caption && (
        <p className="text-center font-serif text-ivory/70 text-sm px-6 py-4 italic" onClick={e => e.stopPropagation()}>
          {photo.caption}
        </p>
      )}

      <div className="px-5 py-4 flex justify-between items-center flex-shrink-0" onClick={e => e.stopPropagation()}>
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-ivory/50">Usunąć?</span>
            <button onClick={() => { onDelete(photo); onClose() }} className="font-sans text-xs text-red-400">Usuń</button>
            <button onClick={() => setConfirmDelete(false)} className="font-sans text-xs text-ivory/40">Anuluj</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-ivory/30 hover:text-ivory/60 transition-colors">
            <Trash2 size={14} strokeWidth={1.5} />
            <span className="font-sans text-xs">Usuń</span>
          </button>
        )}
        <button onClick={onClose} className="font-sans text-sm text-ivory/40 hover:text-ivory/70 transition-colors">
          Zamknij ✦
        </button>
      </div>
    </div>
  )
}

export default function PhotosPage() {
  const { photos, loading, uploading, uploadPhoto, deletePhoto } = usePhotos()
  const [showUpload, setShowUpload] = useState(false)
  const [lightbox, setLightbox] = useState<PhotoEntry | null>(null)

  const grouped = groupByMonth(photos)

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 animate-fade-in">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-widest mb-1">Dokumentacja</p>
          <h1 className="font-serif text-dark text-2xl mb-1">Photo Timeline</h1>
          <p className="font-sans text-sm text-muted">
            {photos.length} {photos.length === 1 ? 'zdjęcie' : photos.length < 5 ? 'zdjęcia' : 'zdjęć'} · trafi do Annual Report
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest text-ivory rounded-xl font-sans text-sm hover:bg-forest/90 transition-colors"
        >
          <Camera size={15} strokeWidth={1.5} />
          Dodaj
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square bg-cream rounded-xl animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📸</div>
          <p className="font-serif text-dark text-lg mb-2">Zacznij dokumentować rok</p>
          <p className="font-sans text-sm text-muted mb-6 max-w-xs mx-auto leading-relaxed">
            Zdjęcia z transformacji — nie dla innych, dla siebie i Annual Report.
            Za rok zobaczysz jak daleko zaszłaś.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-forest text-ivory rounded-xl font-sans text-sm hover:bg-forest/90 transition-colors"
          >
            <Camera size={15} strokeWidth={1.5} />
            Dodaj pierwsze zdjęcie
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.monthKey}>
              <p className="font-serif text-dark text-base mb-3">{group.label}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {group.items.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => setLightbox(photo)}
                    className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity relative group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? ''}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/10 transition-colors rounded-xl" />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-dark/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="font-sans text-[10px] text-ivory truncate">{photo.caption}</p>
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
