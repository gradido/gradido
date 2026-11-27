// AI-GENERATED — not an architecture reference
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config()

// Every spec runs against the old wallet first: there it describes how the wallet behaves today.
// It runs against the Mithril wallet once its page is ported, and then has to pass there too.
const PORTED_TO_MITHRIL: string[] = [
  'auth.spec.ts',
  'authenticate.spec.ts',
  'login.spec.ts',
  'mailLinks.spec.ts',
  'password.spec.ts',
  'publicPages.spec.ts',
  'register.spec.ts',
]

// Ports of their own, so that a dev server on 3000 is neither reused nor in the way, and apart
// from the admin's specs (18080, 18081). From the environment or .env where several checkouts run
// their tests on one machine.
const OLD_PORT = Number(process.env.PLAYWRIGHT_OLD_PORT ?? 13000)
const NEW_PORT = Number(process.env.PLAYWRIGHT_NEW_PORT ?? 13001)

// The GraphQL endpoint on the app's own origin: page.route answers it (tests/fixtures/graphql.ts),
// and a request to the own origin needs no CORS preflight. Everything else a server could set is
// set here, so that neither wallet reads it from a developer's .env: both show the same.
const environment = (port: number) => ({
  FRONTEND_MODULE_HOST: 'localhost',
  FRONTEND_MODULE_PORT: String(port),
  COMMUNITY_URL: `http://localhost:${port}`,
  GRAPHQL_URI: `http://localhost:${port}/graphql`,
  ADMIN_AUTH_URL: `http://localhost:${port}/admin/authenticate?token=`,
  COMMUNITY_NAME: 'Gradido Entwicklung',
  META_URL: `http://localhost:${port}`,
  // every part of the wallet a server can switch off is on: the backend is answered by the specs
  GMS_ACTIVE: 'true',
  MATCHING_ACTIVE: 'true',
  HUMHUB_ACTIVE: 'true',
  // no request on a clock: a spec that wants one asks for it
  AUTO_POLL_INTERVAL_SECONDS: '0',
})

// The Mithril wallet is tested as it ships: built, and served as files. Built anew for every run,
// so that no run tests an older state.
const BUILT = 'test-build'

// Specs of a building block on its own, on a page built beside the wallet (tests/blocks): they
// have nothing to say about the old wallet, and run against the Mithril wallet from the start.
const BLOCKS = 'blocks/*.spec.ts'

// What a browser may do in its own way, where the wallet must not fail (tests/browsers): typing
// an amount with a comma. On each engine members use, against the Mithril wallet. Few specs:
// each runs on every engine and in every language the wallet has.
const BROWSERS = 'browsers/*.spec.ts'
const ENGINES = { chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' }

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // In CI a failed test runs once more, recording a trace. For the Mithril wallet, passing on that
  // second run still fails the run (--fail-on-flaky-tests in test_frontend_mithril.yml).
  retries: process.env.CI ? 1 : 0,
  // every core of the runner: with half of them, as Playwright takes by default, the browsers wait
  workers: process.env.CI ? '100%' : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    // the attribute the wallet marks its elements with for tests
    testIdAttribute: 'data-test',
    // The expectations are written for a German browser in Berlin. Set here, not taken from the
    // machine: a CI runner is English and on UTC.
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: process.env.CI ? 'on-first-retry' : 'off',
  },
  // one picture for both wallets: the old one takes it, the new one is held to it (fixtures/picture.ts)
  snapshotPathTemplate: '{testDir}/pictures/{testFileName}/{arg}{ext}',
  // The wallet is used on a phone first, and lays itself out anew for a desk: each spec on both,
  // against each wallet. `new` and `new-phone` take only what is ported.
  projects: [
    ...Object.entries(ENGINES).map(([engine, device]) => ({
      name: `browsers-${engine}`,
      use: { ...devices[device], baseURL: `http://localhost:${NEW_PORT}/` },
      testMatch: BROWSERS,
    })),
    ...[
    { name: 'old', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${OLD_PORT}/` } },
    { name: 'old-phone', use: { ...devices['Pixel 7'], baseURL: `http://localhost:${OLD_PORT}/` } },
    { name: 'new', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${NEW_PORT}/` } },
    { name: 'new-phone', use: { ...devices['Pixel 7'], baseURL: `http://localhost:${NEW_PORT}/` } },
  ].map((project) =>
    project.name.startsWith('new')
      ? {
          ...project,
          testMatch: [...PORTED_TO_MITHRIL, BLOCKS],
          // the old wallet first: it takes the pictures the new one is compared with
          dependencies: [project.name.replace('new', 'old')],
        }
      : { ...project, testIgnore: [BLOCKS, BROWSERS] },
  ),
  ],
  webServer: [
    {
      // not `bun run dev`: that watches the styles as well; `test:compare` has compiled them
      command: `bunx vite --port ${OLD_PORT} --strictPort`,
      cwd: '../frontend',
      url: `http://localhost:${OLD_PORT}/`,
      reuseExistingServer: !process.env.CI,
      env: environment(OLD_PORT),
    },
    {
      command: [
        `bunx vite build --outDir ${BUILT} --emptyOutDir`,
        `bunx vite build tests/blocks --config vite.config.ts --base /blocks/ --outDir ../../${BUILT}/blocks`,
        `bunx vite preview --outDir ${BUILT} --port ${NEW_PORT} --strictPort`,
      ].join(' && '),
      url: `http://localhost:${NEW_PORT}/`,
      reuseExistingServer: false,
      env: environment(NEW_PORT),
    },
  ],
})
