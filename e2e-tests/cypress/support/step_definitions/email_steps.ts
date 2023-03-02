import { Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { ResetPasswordPage } from '../../e2e/models/ResetPasswordPage'
import { UserEMailSite } from '../../e2e/models/UserEMailSite'

const userEMailSite = new UserEMailSite()
const resetPasswordPage = new ResetPasswordPage()

Then('the user receives an e-mail containing the password reset link', () => {
  cy.origin(
    Cypress.env('mailserverURL'),
    { args: userEMailSite },
    (userEMailSite) => {
      const linkPattern = /\/reset-password\/[0-9]+\d/

      cy.visit('/') // navigate to user's e-mail site (on fake mail server)
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
        .find('.plain-text', { timeout: 2000 })
        .contains(linkPattern)
        .invoke('text')
        .then((text) => {
          const resetPasswordLink = text.match(linkPattern)[0]
          cy.task('setResetPasswordLink', resetPasswordLink)
        })
    }
  )
})

Then('the user receives an e-mail containing the activation link', () => {
  cy.origin(
    Cypress.env('mailserverURL'),
    { args: userEMailSite },
    (userEMailSite) => {
      const linkPattern = /\/checkEmail\/[0-9]+\d/

      cy.visit('/') // navigate to user's e-mail site (on fake mail server)
      cy.get(userEMailSite.emailInbox).should('be.visible')

      cy.get(userEMailSite.emailList)
        .find('.email-item')
        .filter(':contains(E-Mail Überprüfung)')
        .first()
        .click()

      cy.get(userEMailSite.emailMeta)
        .find(userEMailSite.emailSubject)
        .contains('E-Mail Überprüfung')

      cy.get('.email-content')
        .wait(2000)
        .find('.plain-text')
        .contains(linkPattern)
        .invoke('text')
        .then((text) => {
          const activationLink = text.match(linkPattern)[0]
          cy.task('setActivationLink', activationLink)
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

When('the user opens the activation link in the browser', () => {
  cy.task('getActivationLink').then((activationLink) => {
    cy.visit(activationLink)
  })
  cy.get(resetPasswordPage.newPasswordRepeatBlock).should('be.visible')
})
