// Skróty z ikony aplikacji (public/manifest.json → "shortcuts"): przytrzymanie
// ikony na Androidzie albo prawy klik w Chrome na komputerze otwiera np.
// /?akcja=nastroj. Komponent, który obsługuje daną akcję, „zabiera" ją z adresu,
// żeby odświeżenie strony nie otwierało okna drugi raz.

export type ShortcutAction = 'plan' | 'nastroj' | 'papieros' | 'protokol'

export function takeShortcut(handles: readonly ShortcutAction[]): ShortcutAction | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const action = params.get('akcja') as ShortcutAction | null
  if (!action || !handles.includes(action)) return null
  params.delete('akcja')
  const qs = params.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
  return action
}
