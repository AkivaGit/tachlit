import { useCallback, useEffect, useRef } from 'react'

/** Android's long-press timeout. */
const LONG_PRESS_MS = 500

/**
 * Android-style long click (used to delete a user from the supervisor lists).
 * Hold for 500 ms, or right-click on a computer. A long press swallows the
 * click that follows it.
 */
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fired = useRef(false)
  const callback = useRef(onLongPress)
  useEffect(() => { callback.current = onLongPress }, [onLongPress])
  useEffect(() => () => clearTimeout(timer.current), [])

  const cancel = useCallback(() => clearTimeout(timer.current), [])

  const handlers = {
    onPointerDown: () => {
      fired.current = false
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        fired.current = true
        callback.current()
      }, LONG_PRESS_MS)
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: { preventDefault: () => void }) => {
      e.preventDefault()
      clearTimeout(timer.current)
      if (!fired.current) callback.current()
      fired.current = true
    },
  }

  const wrapClick = (onClick?: () => void) => () => {
    if (fired.current) {
      fired.current = false
      return
    }
    onClick?.()
  }

  return { handlers, wrapClick }
}
