/// <reference types="cypress" />

export class LoginPage {
  // selectors
  emailInputSelector = '[id=Email-input-field]';
  passwordInputSelector = '[id=Passwort-input-field]';
  submitBtnSelector = '[type=submit]';
  emailHintSelector = '[id=vee_Email]';
  passwordHintSelector = '[id=vee_Passwort]';

  goto() {
    cy.visit('/');
    return this;
  }

  enterEmail(email: string) {
    cy.get(this.emailInputSelector).clear().type(email);
    return this;
  }

  enterPassword(password: string) {
    cy.get(this.passwordInputSelector).clear().type(password);
    return this;
  }

  submitLogin() {
    cy.get(this.submitBtnSelector).click();
    return this;
  }
}
