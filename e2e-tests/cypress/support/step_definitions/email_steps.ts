import { And, Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { OverviewPage } from '../../e2e/models/OverviewPage'
import { ResetPasswordPage } from '../../e2e/models/ResetPasswordPage'
import { UserEMailSite } from '../../e2e/models/UserEMailSite'

const userEMailSite = new UserEMailSite()

Then('the user receives an e-mail containing the {string} link', (linkName: string) => {
  let emailSubject: string
  let linkPattern: RegExp

  switch (linkName) {
    case 'activation':
      emailSubject = 'Email Verification'
      linkPattern = /\/checkEmail\/[0-9]+\d/
      break
    case 'password reset':
      emailSubject = 'asswor'
      linkPattern = /\/reset-password\/[0-9]+\d/
      break
    case 'transaction':
      emailSubject = 'Gradido gesendet'
      linkPattern = /\/overview/
      break
    default:
      throw new Error(`Error in "Then the user receives an e-mail containing the {string} link" step: incorrect linkname string "${linkName}"`)
  }
  
  cy.origin(
    Cypress.env('mailserverURL'),
    { args: { emailSubject, linkPattern, userEMailSite } },
    ({ emailSubject, linkPattern, userEMailSite }) => {      
      cy.visit('/') // navigate to user's e-mail site (on fake mail server)
      cy.get(userEMailSite.emailInbox).should('be.visible')

      cy.get(userEMailSite.emailList)
        .find('.email-item')
        .filter(`:contains(${emailSubject})`)
        .first()
        .click()

      cy.get(userEMailSite.emailMeta)
        .find(userEMailSite.emailSubject)
        .contains(emailSubject)

      cy.get('.email-content', { timeout: 2000})
        .find('.plain-text')
        .contains(linkPattern)
        .invoke('text')
        .then((text) => {
          const emailLink = text.match(linkPattern)[0]
          cy.task('setEmailLink', emailLink)
        })
    }
  )
})

And('the user receives the transaction e-mail about {string} GDD from {string}', (amount: string, senderName:string) => {
  cy.origin(
    Cypress.env('mailserverURL'),
    { args: { amount, senderName, userEMailSite } },
    ({ amount, senderName, userEMailSite }) => {
      const subject = `Gradido: ${senderName} hat dir ${amount} Gradido gesendet`
      const linkPattern = /\/overview/
      cy.visit('/')
      cy.get(userEMailSite.emailInbox).should('be.visible')

      cy.get(userEMailSite.emailList)
        .find('.email-item')
        .filter(`:contains(${subject})`)
        .first()
        .click()
      
      cy.get(userEMailSite.emailMeta)
        .find(userEMailSite.emailSubject)
        .contains(subject)
      
      cy.get('.email-content', { timeout: 2000})
        .find('.plain-text')
        .contains(linkPattern)
        .invoke('text')
        .then((text) => {
          const emailLink = text.match(linkPattern)[0]
          cy.task('setEmailLink', emailLink)
        })
    }
  )
})

When('the user opens the {string} link in the browser', (linkName: string) => {
  const resetPasswordPage = new ResetPasswordPage()
  cy.task('getEmailLink').then((emailLink) => {
    cy.visit(emailLink)
  })

  switch (linkName) {
    case 'activation':
      cy.get(resetPasswordPage.newPasswordInput).should('be.visible')
      break
    case 'password reset':
      cy.get(resetPasswordPage.newPasswordInput).should('be.visible')
      break
    case 'transaction':
      const overviewPage = new OverviewPage()
      cy.get(overviewPage.rightLastTransactionsList).should('be.visible')
      break
    default:
      throw new Error(`Error in "Then the user receives an e-mail containing the {string} link" step: incorrect link name string "${linkName}"`)
  }
})
