/// <reference types='cypress' />

export class ProfilePage {
  // selectors
  openChangePassword = '[data-test=open-password-change-form]'
  oldPasswordInput = '#password-input-field'
  newPasswordInput = '#new-password-input-field'
  newPasswordRepeatInput = '#repeat-new-password-input-field'
  submitNewPasswordBtn = '[data-test=submit-new-password-btn]'

  goto() {
    cy.visit('/profile')
    return this
  }

  enterOldPassword(password: string) {
    cy.get(this.oldPasswordInput).clear().type(password)
    return this
  }

  enterNewPassword(password: string) {
    cy.get(this.newPasswordInput).find('input').clear().type(password)
    return this
  }

  enterRepeatPassword(password: string) {
    cy.get(this.newPasswordRepeatInput).find('input').clear().type(password)
    return this
  }

  submitPasswordForm() {
    cy.get(this.submitNewPasswordBtn).click()
    return this
  }
}
