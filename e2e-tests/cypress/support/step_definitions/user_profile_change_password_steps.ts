import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor'
import { ProfilePage } from '../../e2e/models/ProfilePage'
import { Toasts } from '../../e2e/models/Toasts'

const profilePage = new ProfilePage()

When('the user opens the change password menu', () => {
  cy.get(profilePage.openChangePassword).should('be.visible').click()
  cy.get(profilePage.newPasswordRepeatInput).should('be.visible')
})

When('the user fills the password form with:', (table: DataTable) => {
  const hashedTableRows = table.rowsHash()
  profilePage.enterOldPassword(hashedTableRows['Old password'])
  profilePage.enterNewPassword(hashedTableRows['New password'])
  profilePage.enterRepeatPassword(hashedTableRows['Repeat new password'])
  cy.get(profilePage.submitNewPasswordBtn).should('be.enabled')
})

When('the user submits the password form', () => {
  profilePage.submitPasswordForm()
})

When('the user is presented a {string} message', () => {
  const toast = new Toasts()
  cy.get(toast.toastSlot).within(() => {
    cy.get(toast.toastTypeSuccess)
    cy.get(toast.toastTitle).should('be.visible')
    cy.get(toast.toastMessage).should('be.visible')
  })
})
