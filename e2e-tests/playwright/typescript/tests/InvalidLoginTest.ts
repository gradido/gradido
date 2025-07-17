import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { Toasts } from '../components/Toasts'

test('invalid login', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('peter@lustig.de', 'wrongpass')
  
  const toast = new Toasts(page)
  await toast.assertErrorToastVisible()
  await page.waitForTimeout(50)
})