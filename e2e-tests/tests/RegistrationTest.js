// AI-GENERATED — not an architecture reference
import { test } from '@playwright/test'
import { uniqueEmail } from '../api/users.js'
import { MailServer } from '../mail/MailServer.js'
import { LoginPage } from '../pages/LoginPage.js'
import { OverviewPage } from '../pages/OverviewPage.js'
import { RegistrationPage } from '../pages/RegistrationPage.js'
import { SetPasswordPage } from '../pages/SetPasswordPage.js'

test('register successfully', async ({ page, request }) => {
  const mailServer = new MailServer(request)
  const email = uniqueEmail('regina')
  const registrationPage = new RegistrationPage(page)
  await registrationPage.goto()
  await registrationPage.register('Regina', 'Register', email)

  const link = await mailServer.receiveLink(email, 'Email Verification', /\/checkEmail\/[0-9]+\d/)
  const setPasswordPage = new SetPasswordPage(page)
  await setPasswordPage.goto(link)
  await setPasswordPage.setPassword('12345Aa_')
  await setPasswordPage.openSigninPage()

  await new LoginPage(page).login(email, '12345Aa_')
  await new OverviewPage(page).assertLoggedInAs('Regina Register')
})
