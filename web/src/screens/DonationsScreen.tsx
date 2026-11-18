import { C } from '../colors'
import { K, S } from '../strings'
import { Fragment } from 'react'
import heart from '../assets/heart.png'
import { Card } from '../ui/Card'
import { ShareIcon } from '../ui/icons'

/**
 * Android breaks long URLs before '.', '/' and '-'; <wbr> gives the browser the
 * same break points. The hyphen becomes a non-breaking one (U+2011) so the
 * browser doesn't also break after it.
 */
function breakableUrl(url: string) {
  return url.split(/(?=[./-])/).map((part, i) => <Fragment key={i}>{i > 0 && <wbr />}{part.replace('-', '\u2011')}</Fragment>)
}

function DonationCard({ title, text, url, color, className }: { title: string; text: string; url: string; color: string; className: string }) {
  return (
    <Card className={`donation-card ${className}`} background="var(--card)" radius={16} elevation={8}>
      {/* Android's ❤️ (Noto Color Emoji, Apache 2.0), so every phone shows the same heart. */}
      <div className="donation-card__heart" aria-hidden="true"><img src={heart} alt="" /></div>
      <div className="donation-card__title">{title}</div>
      <div className="donation-card__divider" />
      <div className="donation-card__text">{text}</div>
      <a className="btn ripple donation-card__link" style={{ backgroundColor: color }} href={url} target="_blank" rel="noopener noreferrer" aria-label={url}>
        <ShareIcon className="btn__icon" />
        <span className="latin">{breakableUrl(url)}</span>
      </a>
    </Card>
  )
}

/** DonationsActivity: the amuta's donations page and J-Give, opened outside the app. */
export function DonationsScreen() {
  return (
    <div className="screen donations">
      <DonationCard className="donation-card--first" title={S.donations_title} text={S.donations_link_text} url={S.donations_url} color={C.secondary_color} />
      <DonationCard className="donation-card--second" title={K.jgive} text={S.jgive_link_text} url={S.jgive_url} color={C.main_color} />
    </div>
  )
}
