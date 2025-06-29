import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { FRONTEND_URL } from '../config'

test('valid login', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('peter@lustig.de', 'Aa12345_')
  await page.waitForURL(`${FRONTEND_URL}/overview`)
  expect(page.url()).toContain('/overview')
})