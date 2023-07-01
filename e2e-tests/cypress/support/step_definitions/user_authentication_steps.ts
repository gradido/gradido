import { When } from '@badeball/cypress-cucumber-preprocessor'
import { ForgotPasswordPage } from '../../e2e/models/ForgotPasswordPage'
import { LoginPage } from '../../e2e/models/LoginPage'
import { ResetPasswordPage } from '../../e2e/models/ResetPasswordPage'

const loginPage = new LoginPage()
const forgotPasswordPage = new ForgotPasswordPage()
const resetPasswordPage = new ResetPasswordPage()

// login related

When('the user submits no credentials', () => {
  loginPage.submitLogin()
})

When('the user submits the credentials {string} {string}', (email: string, password: string) => {
  cy.intercept('POST', '/graphql', (req) => {
    // eslint-disable-next-line no-prototype-builtins
    if (req.body.hasOwnProperty('query') && req.body.query.includes('mutation')) {
      req.alias = 'login'
    }
  })

  loginPage.enterEmail(email)
  loginPage.enterPassword(password)
  loginPage.submitLogin()
  cy.wait('@login').then((interception) => {
    expect(interception.response.statusCode).equals(200)
  })
})

// password reset related

When('the user navigates to the forgot password page', () => {
  loginPage.openForgotPasswordPage()
  cy.url().should('include', '/forgot-password')
})

When('the user enters the e-mail address {string}', (email: string) => {
  forgotPasswordPage.enterEmail(email)
})

When('the user submits the e-mail form', () => {
  forgotPasswordPage.submitEmail()
  cy.get(forgotPasswordPage.successComponent).should('be.visible')
})

When('the user enters the password {string}', (password: string) => {
  resetPasswordPage.enterNewPassword(password)
})

When('the user repeats the password {string}', (password: string) => {
  resetPasswordPage.repeatNewPassword(password)
})

When('the user submits the new password', () => {
  resetPasswordPage.submitNewPassword()
  cy.get(resetPasswordPage.resetPasswordMessageBlock).should('be.visible')
})

When('the user clicks the sign in button', () => {
  resetPasswordPage.openSigninPage()
  cy.url().should('contain', '/login')
})
