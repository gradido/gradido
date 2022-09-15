/// <reference types="cypress" />

export class LoginPage {
  // selectors
  emailInput = '#Email-input-field';
  passwordInput = '#Passwort-input-field';
  submitBtn = '[type=submit]';
  emailHint = '#vee_Email';
  passwordHint = '#vee_Passwort';

  goto() {
    cy.visit('/');
    return this;
  }

  enterEmail(email: string) {
    cy.get(this.emailInput).clear().type(email);
    return this;
  }

  enterPassword(password: string) {
    cy.get(this.passwordInput).clear().type(password);
    return this;
  }

  submitLogin() {
    cy.get(this.submitBtn).click();
    return this;
  }
}
