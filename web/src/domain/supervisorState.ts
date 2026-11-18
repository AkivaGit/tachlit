/**
 * Whether the supervisor screen is unlocked in this app session. Android keeps
 * SupervisorActivity alive while the lists are open; in the web app screens
 * unmount, so this flag lets the supervisor screen come back already logged in.
 * It is in memory only: after reopening the app the splash auto-login applies.
 */
let unlocked = false

export const isSupervisorUnlocked = () => unlocked
export const unlockSupervisor = () => { unlocked = true }
export const resetSupervisorUnlock = () => { unlocked = false }
