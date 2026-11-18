import { useState } from 'react'
import { dismissInstallGuide, shouldShowInstallGuide } from '../platform'

/**
 * iPhone Safari only (difference D3): explains how to install the app, which
 * is also what makes push notifications work on iPhone.
 */
export function InstallGuide() {
  const [open, setOpen] = useState(() => shouldShowInstallGuide())
  if (!open) return null
  const close = () => { dismissInstallGuide(); setOpen(false) }
  return (
    <div className="install-guide" role="dialog" aria-labelledby="install-guide-title">
      <h2 id="install-guide-title" className="install-guide__title">התקנת תכלית באייפון</h2>
      <p className="install-guide__text">
        הקישו על כפתור השיתוף <ShareIosIcon /> בתחתית המסך, ואז על <b>"הוספה למסך הבית"</b>.
        כך תכלית תיפתח כמו אפליקציה ותוכלו לקבל התראות.
      </p>
      <p className="install-guide__text latin-line" dir="ltr">
        Tap the Share button <ShareIosIcon />, then <b>"Add to Home Screen"</b> to install Tachlit and get notifications.
      </p>
      <button type="button" className="dialog__button ripple install-guide__close" onClick={close}>הבנתי</button>
    </div>
  )
}

const ShareIosIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-label="שיתוף" style={{ verticalAlign: 'text-bottom' }}>
    <path fill="#007AFF" d="M12 2l4 4-1.4 1.4L13 5.8V15h-2V5.8L9.4 7.4 8 6l4-4zm-7 8h4v2H6v8h12v-8h-3v-2h5v12H4V10z" />
  </svg>
)
