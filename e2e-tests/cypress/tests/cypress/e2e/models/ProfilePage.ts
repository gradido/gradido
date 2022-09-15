/// <reference types="cypress" />

export class ProfilePage {
  // selectors
  openChangePassword = '[data-test=open-password-change-form]';
  oldPasswordInput = '#password-input-field';
  newPasswordInput = '#Neues-Passwort-input-field';
  newPasswordRepeatInput = '#Neues-Passwort-wiederholen-input-field';
  submitNewPasswordBtn = '[data-test=submit-new-password-btn]';

  goto() {
    cy.visit('/profile');
    return this;
  }
  
  enterOldPassword(password: string) {
    cy.get(this.oldPasswordInput).clear().type(password);
    return this;
  }

  enterNewPassword(password: string) {
    cy.get(this.newPasswordInput).clear().type(password);
    return this;
  }

  enterRepeatPassword(password: string) {
    cy.get(this.newPasswordRepeatInput).clear().type(password);
    return this;
  }

  submitPasswordForm() {
    cy.get(this.submitNewPasswordBtn).click();
    return this;
  }
}
