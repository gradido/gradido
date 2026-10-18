// AI-GENERATED — not an architecture reference
import { test } from '@playwright/test'
import { Toasts } from '../components/Toasts.js'
import { MailServer } from '../mail/MailServer.js'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.js'
import { LoginPage } from '../pages/LoginPage.js'
import { OverviewPage } from '../pages/OverviewPage.js'
import { SetPasswordPage } from '../pages/SetPasswordPage.js'

const PASSWORD_RESET_SUBJECT = 'asswor'

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 */
async function requestPasswordReset(page, email) {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.openForgotPasswordPage()
  await new ForgotPasswordPage(page).requestPasswordReset(email)
}

test('reset password as not registered user', async ({ page, request }) => {
  const mailServer = new MailServer(request)
  await requestPasswordReset(page, 'not@registered.com')
  await mailServer.assertNoEmail('not@registered.com', PASSWORD_RESET_SUBJECT)
})

test('reset password as deleted user', async ({ page, request }) => {
  const mailServer = new MailServer(request)
  await requestPasswordReset(page, 'stephen@hawking.uk')
  await mailServer.assertNoEmail('stephen@hawking.uk', PASSWORD_RESET_SUBJECT)
})

test('reset password from sign in page successfully', async ({ page, request }) => {
  const mailServer = new MailServer(request)
  await requestPasswordReset(page, 'garrick@ollivander.com')
  const link = await mailServer.receiveLink(
    'garrick@ollivander.com',
    PASSWORD_RESET_SUBJECT,
    /\/reset-password\/[0-9]+\d/,
  )

  const setPasswordPage = new SetPasswordPage(page)
  await setPasswordPage.goto(link)
  await setPasswordPage.setPassword('12345Aa_')
  await setPasswordPage.openSigninPage()

  const loginPage = new LoginPage(page)
  await loginPage.login('garrick@ollivander.com', 'Aa12345_')
  await new Toasts(page).assertErrorToastVisible()
  await loginPage.login('garrick@ollivander.com', '12345Aa_')
  await new OverviewPage(page).assertLoggedInAs('Garrick Ollivander')
})
