import type { ViewType } from './domain/management'

/** Web addresses of the screens (see PWA_PLAN.md §4). */
export const ROUTES = {
  splash: '/',
  main: '/main',
  register: (slug: string) => `/register/${slug}`,
  home: '/home',
  donations: '/donations',
  supervisor: '/supervisor',
  manage: (view: ViewType) => `/supervisor/manage/${view}`,
  send: '/supervisor/send',
} as const

/** Asset in web/public, respecting the base URL. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
