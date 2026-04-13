'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration: number
}

interface ToastContextType {
  addToast: (toast: { message: string; type: Toast['type']; duration?: number }) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const NOOP_TOAST: ToastContextType = { addToast: () => {} }

export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx ?? NOOP_TOAST
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(({ message, type, duration = 4000 }: { message: string; type: Toast['type']; duration?: number }) => {
    const id = `toast_${Date.now()}`
    setToasts((prev) => [...prev.slice(-2), { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-80 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={clsx(
        'pointer-events-auto rounded-xl shadow-elegant-lg px-4 py-3 flex items-start gap-3 animate-slide-up font-sans text-sm',
        toast.type === 'success' && 'bg-forest text-ivory',
        toast.type === 'error' && 'bg-red-600 text-white',
        toast.type === 'info' && 'bg-dark text-ivory',
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Zamknij"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}
