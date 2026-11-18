import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Dialog, type DialogOptions } from './Dialog'
import { LoadingOverlay } from './LoadingOverlay'
import { Toast } from './Toast'

/** Toast.LENGTH_SHORT / LENGTH_LONG */
const TOAST_MS = { short: 2000, long: 3500 } as const

interface UiApi {
  /** Opens an AlertDialog. Several can be open; each closes on its own. */
  showDialog: (options: DialogOptions) => void
  showToast: (text: string, length?: keyof typeof TOAST_MS) => void
  showLoading: () => void
  hideLoading: () => void
}

const UiContext = createContext<UiApi | null>(null)

export function useUi(): UiApi {
  const ui = useContext(UiContext)
  if (!ui) throw new Error('useUi must be used inside <UiProvider>')
  return ui
}

/** Dialogs, toasts and the loading overlay for every screen (BaseActivity helpers). */
export function UiProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<{ id: number; options: DialogOptions }[]>([])
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const nextId = useRef(1)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showDialog = useCallback((options: DialogOptions) => {
    const id = nextId.current++
    setDialogs((d) => [...d, { id, options }])
  }, [])

  const showToast = useCallback((text: string, length: keyof typeof TOAST_MS = 'short') => {
    const id = nextId.current++
    setToast({ id, text })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), TOAST_MS[length])
  }, [])

  const api = useMemo<UiApi>(() => ({
    showDialog,
    showToast,
    showLoading: () => setLoading(true),
    hideLoading: () => setLoading(false),
  }), [showDialog, showToast])

  return (
    <UiContext.Provider value={api}>
      {children}
      {dialogs.map(({ id, options }) => (
        <Dialog
          key={id}
          {...options}
          onDismiss={() => {
            setDialogs((d) => d.filter((x) => x.id !== id))
          }}
        />
      ))}
      {loading && <LoadingOverlay />}
      {toast && <Toast key={toast.id} text={toast.text} />}
    </UiContext.Provider>
  )
}
