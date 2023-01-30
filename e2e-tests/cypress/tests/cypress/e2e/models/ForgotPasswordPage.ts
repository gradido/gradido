/// <reference types="cypress" />

export class ForgotPasswordPage {
  // selectors
  emailInput = "input[type=email]";
  submitBtn = "button[type=submit]";
  successComponent = "[data-test='forgot-password-success']";

  enterEmail(email: string) {
    cy.get(this.emailInput).clear().type(email);
    return this;
  }

  submitEmail() {
    cy.get(this.submitBtn).click();
    return this;
  }
}
