import { afterEach, describe, expect, it, vi } from 'vitest'
import { dismissInstallGuide, isIos, isStandalone, shouldShowInstallGuide } from './platform'

function fake({ ua, standalone = false, platform = 'iPhone', touch = 5 }: { ua: string; standalone?: boolean; platform?: string; touch?: number }) {
  vi.stubGlobal('navigator', { userAgent: ua, platform, maxTouchPoints: touch, standalone })
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: standalone && q.includes('standalone') }))
}
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36'

describe('platform', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('recognises iPhone, iPad (desktop mode) and Android', () => {
    fake({ ua: IPHONE }); expect(isIos()).toBe(true)
    fake({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', platform: 'MacIntel', touch: 5 }); expect(isIos()).toBe(true)
    fake({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', platform: 'MacIntel', touch: 0 }); expect(isIos()).toBe(false)
    fake({ ua: ANDROID, platform: 'Linux armv8l' }); expect(isIos()).toBe(false)
  })

  it('knows when it runs as an installed app', () => {
    fake({ ua: IPHONE, standalone: true }); expect(isStandalone()).toBe(true)
    fake({ ua: IPHONE }); expect(isStandalone()).toBe(false)
  })

  it('shows the install guide only in iPhone Safari, until dismissed', () => {
    fake({ ua: IPHONE }); expect(shouldShowInstallGuide()).toBe(true)
    fake({ ua: IPHONE, standalone: true }); expect(shouldShowInstallGuide()).toBe(false)
    fake({ ua: ANDROID, platform: 'Linux' }); expect(shouldShowInstallGuide()).toBe(false)
    fake({ ua: IPHONE }); dismissInstallGuide(); expect(shouldShowInstallGuide()).toBe(false)
  })
})
