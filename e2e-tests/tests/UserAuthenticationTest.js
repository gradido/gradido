// AI-GENERATED — not an architecture reference
import { test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { OverviewPage } from '../pages/OverviewPage.js'

test('log in successfully', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('bibi@bloxberg.de', 'Aa12345_')
  await new OverviewPage(page).assertLoggedInAs('Bibi Bloxberg')
})
