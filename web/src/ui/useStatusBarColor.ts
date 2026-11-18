import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { THEME } from '../colors'

/**
 * On Android, the splash, main, donations and send-notification screens are
 * full-screen (no status bar); the rest have a purple status bar. A web app
 * can't hide the status bar per screen, so on those screens it takes the
 * screen's background colour instead.
 */
export function statusBarColorFor(pathname: string): string {
  if (pathname === '/' || pathname === '/supervisor/send') return '#FFFFFF'
  if (pathname === '/main' || pathname === '/donations') return '#F5F5F5'
  return THEME.statusBar
}

export function useStatusBarColor(): void {
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', statusBarColorFor(pathname))
  }, [pathname])
}
