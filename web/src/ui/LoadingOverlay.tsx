import { K } from '../strings'

/** overlay_loading.xml: dark overlay, spinner and "בטעינה". Blocks touches. */
export function LoadingOverlay() {
  return (
    <div className="loading" aria-busy="true" onClick={(e) => e.stopPropagation()}>
      <div className="loading__box">
        <svg className="loading__spinner" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" />
        </svg>
        <span className="loading__text">{K.loading}</span>
      </div>
    </div>
  )
}
