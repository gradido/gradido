import { And, When } from '@badeball/cypress-cucumber-preprocessor'
import { ProfilePage } from '../../e2e/models/ProfilePage'
import { Toasts } from '../../e2e/models/Toasts'

const profilePage = new ProfilePage()

And('the user opens the change password menu', () => {
  cy.get(profilePage.openChangePassword).click()
  cy.get(profilePage.newPasswordRepeatInput).should('be.visible')
  cy.get(profilePage.submitNewPasswordBtn).should('be.disabled')
})

When('the user fills the password form with:', (table) => {
  let hashedTableRows = table.rowsHash()
  profilePage.enterOldPassword(hashedTableRows['Old password'])
  profilePage.enterNewPassword(hashedTableRows['New password'])
  profilePage.enterRepeatPassword(hashedTableRows['Repeat new password'])
  cy.get(profilePage.submitNewPasswordBtn).should('be.enabled')
})

And('the user submits the password form', () => {
  profilePage.submitPasswordForm()
})

When('the user is presented a {string} message', (type: string) => {
  const toast = new Toasts()
  cy.get(toast.toastSlot).within(() => {
    cy.get(toast.toastTypeSuccess)
    cy.get(toast.toastTitle).should('be.visible')
    cy.get(toast.toastMessage).should('be.visible')
  })
})
