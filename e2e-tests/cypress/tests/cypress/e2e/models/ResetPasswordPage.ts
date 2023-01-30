/// <reference types="cypress" />

export class ResetPasswordPage {
  // selectors
  newPasswordBlock = "#new-password-input-field";
  newPasswordRepeatBlock = "#repeat-new-password-input-field";
  resetPasswordBtn = "button[type=submit]";
  resetPasswordMessageBlock = '[data-test="reset-password-message"]';
  signinBtn = ".btn.test-message-button";

  enterNewPassword(password: string) {
    cy.get(this.newPasswordBlock).find("input[type=password]").type(password);
    return this;
  }

  repeatNewPassword(password: string) {
    cy.get(this.newPasswordRepeatBlock)
      .find("input[type=password]")
      .type(password);
    return this;
  }

  submitNewPassword() {
    cy.get(this.resetPasswordBtn).click();
    return this;
  }

  openSigninPage() {
    cy.get(this.signinBtn).click();
    return this;
  }
}
