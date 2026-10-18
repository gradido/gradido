// AI-GENERATED — not an architecture reference
import { test } from '@playwright/test'
import { createActivatedUser, createRegisteredUser, uniqueEmail } from '../api/users.js'
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
  const email = uniqueEmail('not-registered')
  await requestPasswordReset(page, email)
  await mailServer.assertNoEmail(email, PASSWORD_RESET_SUBJECT)
})

// Seeded and deleted; the request changes nothing about the user, so all tests can share it.
test('reset password as deleted user', async ({ page, request }) => {
  const mailServer = new MailServer(request)
  await requestPasswordReset(page, 'stephen@hawking.uk')
  await mailServer.assertNoEmail('stephen@hawking.uk', PASSWORD_RESET_SUBJECT)
})

/**
 * The flow both successful resets share: request the mail, follow its link, set the new
 * password, and log in -- with the old password failing and the new one working.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} email
 * @param {string} username
 */
async function resetPasswordAndLogin(page, request, email, username) {
  // Right after the activation mail: needs EMAIL_CODE_REQUEST_TIME=0 (backend/.env.test_e2e).
  const mailServer = new MailServer(request)
  await requestPasswordReset(page, email)
  const link = await mailServer.receiveLink(
    email,
    PASSWORD_RESET_SUBJECT,
    /\/reset-password\/[0-9]+\d/,
  )

  const setPasswordPage = new SetPasswordPage(page)
  await setPasswordPage.goto(link)
  await setPasswordPage.setPassword('12345Aa_')
  await setPasswordPage.openSigninPage()

  const loginPage = new LoginPage(page)
  await loginPage.login(email, 'Aa12345_')
  await new Toasts(page).assertErrorToastVisible()
  await loginPage.login(email, '12345Aa_')
  await new OverviewPage(page).assertLoggedInAs(username)
}

// Like the seeded Garrick Ollivander: registered, but never activated -- no confirmed e-mail
// address, no password.
test('reset password as not activated user successfully', async ({ page, request }) => {
  const user = await createRegisteredUser(request, { firstName: 'Garrick', lastName: 'Ollivander' })
  await resetPasswordAndLogin(page, request, user.email, 'Garrick Ollivander')
})

test('reset password as activated user successfully', async ({ page, request }) => {
  const user = await createActivatedUser(request, {
    firstName: 'Garrick',
    lastName: 'Ollivander',
    password: 'Aa12345_',
  })
  await resetPasswordAndLogin(page, request, user.email, 'Garrick Ollivander')
})
