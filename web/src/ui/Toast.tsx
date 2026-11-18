import { isLatinOnly } from './script'

/** Android 12+ toast: white pill with the app icon at the bottom of the screen. */
export function Toast({ text }: { text: string }) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <img className="toast__icon" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
      <span className={`toast__text ${isLatinOnly(text) ? 'latin' : ''}`}>{text}</span>
    </div>
  )
}
