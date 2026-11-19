// AI-GENERATED — not an architecture reference
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

const walletPublic = fileURLToPath(new URL('../../../frontend/public', import.meta.url))

/**
 * Serves the pictures the admin takes from the wallet at the root of the site (/img/..., the coin
 * in the QR code, the cheque's logo and leaves): nginx puts the wallet there, a dev server has
 * none of them.
 */
export const serveWalletAssets = (page: Page) =>
  page.route(/^http:\/\/localhost:\d+\/img\//, (route) =>
    route.fulfill({ path: walletPublic + new URL(route.request().url()).pathname }),
  )
