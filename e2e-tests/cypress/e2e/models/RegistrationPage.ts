/// <reference types='cypress' />

export class RegistrationPage {
  // selectors
  firstnameInput = '#registerFirstname'
  lastnameInput = '#registerLastname'
  emailInput = 'input[type=email]'
  checkbox = '#registerCheckbox'
  submitBtn = '[type=submit]'

  RegistrationThanxHeadline = '.test-message-headline'
  RegistrationThanxText = '.test-message-subtitle'

  goto() {
    cy.visit('/register')
    return this
  }

  enterFirstname(firstname: string) {
    cy.get(this.firstnameInput).clear().type(firstname)
    return this
  }

  enterLastname(lastname: string) {
    cy.get(this.lastnameInput).clear().type(lastname)
    return this
  }

  enterEmail(email: string) {
    cy.get(this.emailInput).clear().type(email)
    return this
  }

  checkPrivacyCheckbox() {
    cy.get(this.checkbox).click({ force: true })
  }

  submitRegistrationForm() {
    cy.get(this.submitBtn).should('be.enabled')
    cy.get(this.submitBtn).click()
  }
}
