/// <reference types="cypress" />

export class LoginPage {
  // selectors
  emailInput = "input[type=email]";
  passwordInput = "input[type=password]";
  forgotPasswordLink = '[data-test="forgot-password-link"]';
  submitBtn = "[type=submit]";
  emailHint = "#vee_Email";
  passwordHint = "#vee_Password";

  goto() {
    cy.visit("/");
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

  openForgotPasswordPage() {
    cy.get(this.forgotPasswordLink).click();
  }
}
