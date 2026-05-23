'use client'
import { useState } from 'react'
import { Plus, X, Phone } from 'lucide-react'
import { useNominatedContacts } from '@/hooks/useNominatedContacts'
import type { NominatedContact } from '@/types'
import { SmallCaps, Diamond } from '@/components/ui'

export default function NominatedContactsSection() {
  const { contacts, loading, saveContacts } = useNominatedContacts()
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [saved, setSaved] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim() || !newPhone.trim()) return
    const updated: NominatedContact[] = [...contacts, { name: newName.trim(), phone: newPhone.trim() }]
    await saveContacts(updated)
    setNewName('')
    setNewPhone('')
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRemove = async (phone: string) => {
    await saveContacts(contacts.filter(c => c.phone !== phone))
  }

  if (loading) return null

  return (
    <section className="bg-ivory border border-gold-light/40 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Phone size={14} strokeWidth={1.5} className="text-gold-deep" />
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs">
          Nominated Contacts
        </SmallCaps>
      </div>
      <h2 className="font-heading text-dark text-xl mt-1">Osoby na trudną chwilę</h2>
      <p className="font-serif-body italic text-muted text-[13px] mt-1 mb-5 leading-relaxed">
        osoby, do których dzwonisz zamiast pisać do niego. widoczne w emergency lock.
      </p>

      {contacts.length > 0 && (
        <div className="space-y-2 mb-4">
          {contacts.map(c => (
            <div key={c.phone} className="flex items-center gap-3 bg-cream/40 border border-hairline px-4 py-3">
              <Diamond size={5} className="text-gold-deep shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-dark text-[14px]">{c.name}</p>
                <p className="font-serif-body italic text-muted text-[12.5px]">{c.phone}</p>
              </div>
              <button
                onClick={() => handleRemove(c.phone)}
                className="text-muted hover:text-red-500 transition-colors"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {contacts.length < 3 && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 text-muted hover:text-gold-deep transition-colors"
        >
          <Plus size={12} strokeWidth={1.5} />
          <SmallCaps tone="muted" tracking="luxury" size="xs">
            dodaj kontakt · max III
          </SmallCaps>
        </button>
      )}

      {editing && (
        <div className="border border-hairline p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="imię"
            className="w-full border border-hairline bg-cream/40 px-3 py-2 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold transition-colors"
          />
          <input
            type="tel"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            placeholder="+48 123 456 789"
            className="w-full border border-hairline bg-cream/40 px-3 py-2 font-serif-body text-[14px] text-dark focus:outline-none focus:border-gold transition-colors"
          />
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setEditing(false)}
              className="font-ui uppercase tracking-luxury text-[10px] text-muted-light hover:text-dark transition-colors"
            >
              anuluj
            </button>
            <div className="flex-1" />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newPhone.trim()}
              className="bg-dark-deep text-ivory border border-gold py-2 px-4 hover:bg-forest transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              <Diamond size={4} className="text-gold" />
              <SmallCaps tone="ivory" tracking="luxury" size="xs">
                dodaj
              </SmallCaps>
            </button>
          </div>
        </div>
      )}

      {saved && (
        <SmallCaps tone="gold-deep" tracking="luxury" size="xs" className="mt-3 block animate-fade-in">
          zapisano ◆
        </SmallCaps>
      )}
    </section>
  )
}
