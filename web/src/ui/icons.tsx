/** Material icons used by the Android app, as inline SVG. */

export const ErrorIcon = (props: { className?: string; 'data-testid'?: string }) => (
  <svg viewBox="0 0 24 24" className={props.className} data-testid={props['data-testid']} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <rect x="11" y="6" width="2" height="8" rx="1" fill="#FFFFFF" />
    <circle cx="12" cy="17" r="1.25" fill="#FFFFFF" />
  </svg>
)

export const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    {off && <path stroke="currentColor" strokeWidth="2" d="M3 3l18 18" />}
  </svg>
)

export const ArrowDropDown = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="currentColor" d="M7 10l5 5 5-5z" />
  </svg>
)

/** android:drawable/ic_menu_share */
export const ShareIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 21 5a3 3 0 1 0-5.91.7L8.04 9.81A2.99 2.99 0 0 0 3 12a3 3 0 0 0 5.04 2.19l7.12 4.16c-.05.21-.08.43-.08.65A2.92 2.92 0 1 0 18 16.08z" />
  </svg>
)
