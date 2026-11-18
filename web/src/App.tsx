import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { ROUTES } from './routes'
import { DonationsScreen } from './screens/DonationsScreen'
import { MainScreen } from './screens/MainScreen'
import { RegistrationScreen } from './screens/RegistrationScreen'
import { RoleHomeScreen } from './screens/RoleHomeScreen'
import { SplashScreen } from './screens/SplashScreen'
import { SupervisorScreen } from './screens/SupervisorScreen'
import { ManagementScreen } from './screens/ManagementScreen'
import { SendNotificationScreen } from './screens/SendNotificationScreen'
import * as session from './session/session'
import { BackButton } from './ui/BackButton'
import { InstallGuide } from './ui/InstallGuide'
import { UiProvider } from './ui/UiProvider'
import { useStatusBarColor } from './ui/useStatusBarColor'

/**
 * A registered volunteer can't go back to the main screen or a form – like
 * Android, where the personal area replaces them and only logout leads out.
 */
function VolunteerGuard({ children }: { children: ReactNode }) {
  const role = session.getRole()
  if (session.isLoggedIn() && role !== 'SUPERVISOR') return <Navigate to={ROUTES.home} replace />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.splash} element={<SplashScreen />} />
      <Route path={ROUTES.main} element={<VolunteerGuard><MainScreen /></VolunteerGuard>} />
      <Route path="/register/:slug" element={<VolunteerGuard><RegistrationScreen /></VolunteerGuard>} />
      <Route path={ROUTES.home} element={<RoleHomeScreen />} />
      <Route path={ROUTES.donations} element={<DonationsScreen />} />
      <Route path={ROUTES.supervisor} element={<SupervisorScreen />} />
      <Route path="/supervisor/manage/:view" element={<ManagementScreen />} />
      <Route path={ROUTES.send} element={<SendNotificationScreen />} />
      <Route path="*" element={<Navigate to={ROUTES.splash} replace />} />
    </Routes>
  )
}

/** Web-only extras around the screens: status-bar colour, iPhone back button and install guide. */
function PwaChrome() {
  useStatusBarColor()
  const { pathname } = useLocation()
  return (
    <>
      <BackButton />
      {pathname !== '/' && <InstallGuide />}
    </>
  )
}

export function App() {
  return (
    <UiProvider>
      <BrowserRouter>
        <AppRoutes />
        <PwaChrome />
      </BrowserRouter>
    </UiProvider>
  )
}
