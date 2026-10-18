// AI-GENERATED — not an architecture reference
import { test } from '@playwright/test'
import { createActivatedUser } from '../api/users.js'
import { AliasFirstChoice } from '../components/AliasFirstChoice.js'
import { SideNavMenu } from '../components/SideNavMenu.js'
import { Toasts } from '../components/Toasts.js'
import { FRONTEND_URL } from '../config/index.js'
import { LoginPage } from '../pages/LoginPage.js'
import { OverviewPage } from '../pages/OverviewPage.js'
import { SettingsPage } from '../pages/SettingsPage.js'

test('change password successfully', async ({ page, request }) => {
  const user = await createActivatedUser(request, {
    firstName: 'Bob',
    lastName: 'der Baumeister',
    password: 'Aa12345_',
  })
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(user.email, 'Aa12345_')
  await new OverviewPage(page).assertLoggedInAs('Bob der Baumeister')

  await page.goto(`${FRONTEND_URL}/settings`)
  await new AliasFirstChoice(page).keepSuggestion()
  const settingsPage = new SettingsPage(page)
  await settingsPage.openChangePasswordForm()
  await settingsPage.changePassword('Aa12345_', '12345Aa_')
  await new Toasts(page).assertSuccessToastVisible()
  await new SideNavMenu(page).logout()

  await loginPage.login(user.email, 'Aa12345_')
  await new Toasts(page).assertErrorToastVisible()
  await loginPage.login(user.email, '12345Aa_')
  await new OverviewPage(page).assertLoggedInAs('Bob der Baumeister')
})
