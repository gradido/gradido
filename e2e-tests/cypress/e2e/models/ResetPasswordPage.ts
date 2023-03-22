/// <reference types='cypress' />

export class ResetPasswordPage {
  // selectors
  newPasswordInput = '#new-password-input-field'
  newPasswordRepeatInput = '#repeat-new-password-input-field'
  resetPasswordBtn = 'button[type=submit]'
  resetPasswordMessageBlock = '[data-test="reset-password-message"]'
  signinBtn = '.btn.test-message-button'

  enterNewPassword(password: string) {
    cy.get(this.newPasswordInput).find('input[type=password]').type(password)
    return this
  }

  repeatNewPassword(password: string) {
    cy.get(this.newPasswordRepeatInput)
      .find('input[type=password]')
      .type(password)
    return this
  }

  submitNewPassword() {
    cy.get(this.resetPasswordBtn).click()
    return this
  }

  openSigninPage() {
    cy.get(this.signinBtn).click()
    return this
  }
}
