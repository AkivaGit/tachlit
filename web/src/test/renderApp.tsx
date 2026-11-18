import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { AppRoutes } from '../App'
import { UiProvider } from '../ui/UiProvider'

/** Shows the current address so tests can check navigation. */
function Location() {
  const loc = useLocation()
  return <div data-testid="location" hidden>{loc.pathname}</div>
}

/** Renders the whole app (all screens) at `path`, in memory. */
export function renderApp(path: string, state?: unknown) {
  return render(
    <UiProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <AppRoutes />
        <Location />
      </MemoryRouter>
    </UiProvider>,
  )
}
