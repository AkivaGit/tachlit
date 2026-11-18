import { setupServer } from 'msw/node'

/**
 * Fake Tachlit server for unit/component tests. Tests add the handlers they
 * need with `server.use(...)`; any request without a handler fails the test,
 * so no test can reach the live server by accident.
 */
export const server = setupServer()
