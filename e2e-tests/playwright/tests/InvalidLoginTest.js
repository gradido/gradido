// AI-GENERATED — not an architecture reference
import { test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { Toasts } from '../components/Toasts.js'

test('invalid login', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('peter@lustig.de', 'wrongpass')

  const toast = new Toasts(page)
  await toast.assertErrorToastVisible()
  await page.waitForTimeout(50)
})
