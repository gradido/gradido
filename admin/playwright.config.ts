// AI-GENERATED — not an architecture reference
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config()

// A port of its own, so that a dev server on 8080 is neither reused nor in the way. From the
// environment or .env where several checkouts run their tests on one machine.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 18081)

// The GraphQL endpoint on the app's own origin: page.route answers it (tests/fixtures/graphql.ts),
// and a request to the own origin needs no CORS preflight. The wallet stays on another origin
// (0.0.0.0, the default host), so the token is handed over in the address, as in development.
const environment = {
  ADMIN_MODULE_PORT: String(PORT),
  GRAPHQL_URL: `http://localhost:${PORT}/graphql`,
  // Crea's chat is shown only with Claude switched on; the backend is answered by the tests
  ANTHROPIC_ACTIVE: 'true',
}

// The admin is tested as it ships: built, and served as files. Twice as fast as the dev
// server, which hands every page its modules one by one -- and the tests see the real bundle,
// with its chunks. Built anew for every run, so that no run tests an older state.
const BUILT = 'test-build'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // In CI a failed test runs once more, recording a trace -- recording one for every test would
  // cost each three times its time. Passing on that second run still fails the run
  // (--fail-on-flaky-tests in test_admin_interface.yml): the retry is there for the trace.
  retries: process.env.CI ? 1 : 0,
  // every core of the runner: with half of them, as Playwright takes by default, the browsers wait
  workers: process.env.CI ? '100%' : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    // the attribute the admin marks its elements with for tests
    testIdAttribute: 'data-test',
    // The expectations are written for a German browser in Berlin. Set here, not taken from the
    // machine: a CI runner is English and on UTC, and showed every time an hour or two early.
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    // Locally a failing test is run again with `--trace on`.
    trace: process.env.CI ? 'on-first-retry' : 'off',
    baseURL: `http://localhost:${PORT}/admin/`,
  },
  webServer: {
    command: `bunx vite build --outDir ${BUILT} --emptyOutDir && bunx vite preview --outDir ${BUILT} --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/admin/`,
    reuseExistingServer: false,
    env: {
      ...environment,
      // a build reckons with nginx in front, where the wallet has no port of its own; the
      // address the dev server would give it
      WALLET_URL: `http://0.0.0.0:${PORT}`,
    },
  },
})
