// AI-GENERATED — not an architecture reference
import { test } from '@playwright/test'
import { FRONTEND_URL } from '../config/index.js'
import { SideNavMenu } from '../components/SideNavMenu.js'
import { Toasts } from '../components/Toasts.js'
import { LoginPage } from '../pages/LoginPage.js'
import { OverviewPage } from '../pages/OverviewPage.js'
import { SettingsPage } from '../pages/SettingsPage.js'

// A retry would start with the password already changed and fail on login.
test.describe.configure({ retries: 0 })

test('change password successfully', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('bob@baumeister.de', 'Aa12345_')
  await new OverviewPage(page).assertLoggedInAs('Bob der Baumeister')

  await page.goto(`${FRONTEND_URL}/settings`)
  const settingsPage = new SettingsPage(page)
  await settingsPage.openChangePasswordForm()
  await settingsPage.changePassword('Aa12345_', '12345Aa_')
  await new Toasts(page).assertSuccessToastVisible()
  await new SideNavMenu(page).logout()

  await loginPage.login('bob@baumeister.de', 'Aa12345_')
  await new Toasts(page).assertErrorToastVisible()
  await loginPage.login('bob@baumeister.de', '12345Aa_')
  await new OverviewPage(page).assertLoggedInAs('Bob der Baumeister')
})
