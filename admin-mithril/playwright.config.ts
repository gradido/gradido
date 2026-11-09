// AI-GENERATED — not an architecture reference
import { defineConfig, devices } from '@playwright/test'

// Every test runs against the old admin first: there it describes how the admin behaves today.
// It runs against the Mithril admin once its page is ported, and then has to pass there too.
const PORTED_TO_MITHRIL: string[] = [
  'contributionLinks.spec.ts',
  'navBar.spec.ts',
  'federation.spec.ts',
  'dashboard.spec.ts',
  'statistic.spec.ts',
  'projectBranding.spec.ts',
  'userSearch.spec.ts',
  'memberDetails.spec.ts',
  'memberTabs.spec.ts',
  'creationFormular.spec.ts',
  'creationConfirm.spec.ts',
  'contributionThread.spec.ts',
  'creaEvaluation.spec.ts',
  'aiChat.spec.ts',
  'appOutdated.spec.ts',
  'notFound.spec.ts',
  'memberAvatarZoom.spec.ts',
  'creationGroups.spec.ts',
  'creaSettings.spec.ts',
  'chatSettings.spec.ts',
]

// Ports of their own, so that a dev server on 8080 is neither reused nor in the way.
const OLD_PORT = 18080
const NEW_PORT = 18081

// The GraphQL endpoint on the app's own origin: page.route answers it (tests/fixtures/graphql.ts),
// and a request to the own origin needs no CORS preflight. The wallet stays on another origin
// (0.0.0.0, the default host), so the token is handed over in the address, as in development.
const server = (cwd: string, port: number) => ({
  command: 'bun run dev',
  cwd,
  url: `http://localhost:${port}/admin/`,
  reuseExistingServer: !process.env.CI,
  env: {
    ADMIN_MODULE_PORT: String(port),
    GRAPHQL_URL: `http://localhost:${port}/graphql`,
    // Crea's chat is shown only with Claude switched on; the backend is answered by the tests
    ANTHROPIC_ACTIVE: 'true',
  },
})

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    // the attribute the admin marks its elements with for tests
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'old', use: { baseURL: `http://localhost:${OLD_PORT}/admin/` } },
    {
      name: 'new',
      use: { baseURL: `http://localhost:${NEW_PORT}/admin/` },
      testMatch: PORTED_TO_MITHRIL.length > 0 ? PORTED_TO_MITHRIL : /^$/,
    },
  ],
  webServer: [server('../admin', OLD_PORT), server('.', NEW_PORT)],
})
