/** Where the web app runs: iPhone or not, installed (home screen) or in a browser tab. */

const DISMISSED_KEY = 'install_guide_dismissed'

export function isIos(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
}

/** Opened from the home-screen icon (not in a browser tab). */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches)
}

/** iPhone Safari, not installed yet, and the user hasn't closed the guide (difference D3). */
export function shouldShowInstallGuide(): boolean {
  return isIos() && !isStandalone() && localStorage.getItem(DISMISSED_KEY) !== '1'
}

export function dismissInstallGuide(): void {
  localStorage.setItem(DISMISSED_KEY, '1')
}
