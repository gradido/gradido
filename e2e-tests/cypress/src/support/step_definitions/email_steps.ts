import { Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { ResetPasswordPage } from '@models/ResetPasswordPage'
import { UserEMailSite } from '@models/UserEMailSite'

const userEMailSite = new UserEMailSite()
const resetPasswordPage = new ResetPasswordPage()

Then('the user receives an e-mail containing the password reset link', () => {
  cy.origin(
    Cypress.env('mailserverURL'),
    { args: userEMailSite },
    (userEMailSite) => {
      const linkPattern = /\/reset-password\/[0-9]+\d/

      cy.visit('/') // navigate to user's e-maile site (on fake mail server)
      cy.get(userEMailSite.emailInbox).should('be.visible')

      cy.get(userEMailSite.emailList)
        .find('.email-item')
        .filter(':contains(asswor)')
        .first()
        .click()

      cy.get(userEMailSite.emailMeta)
        .find(userEMailSite.emailSubject)
        .contains('asswor')

      cy.get('.email-content')
        .find('.plain-text')
        .contains(linkPattern)
        .invoke('text')
        .then((text) => {
          const resetPasswordLink = text.match(linkPattern)[0]
          cy.task('setResetPasswordLink', resetPasswordLink)
        })
    }
  )
})

When('the user opens the password reset link in the browser', () => {
  cy.task('getResetPasswordLink').then((passwordResetLink) => {
    cy.visit(passwordResetLink)
  })
  cy.get(resetPasswordPage.newPasswordRepeatBlock).should('be.visible')
})
