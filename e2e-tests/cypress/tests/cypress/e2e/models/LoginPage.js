class LoginPage {
  goto() {
    cy.visit('/')
  }

  enterEmail(email) {
    cy.get('[id=Email-input-field]').clear().type(email)
    return this
  }

  enterPassword(password) {
    cy.get('[id=Password-input-field]').clear().type(password)
    return this
  }

  submitLogin() {
    cy.get('[type=submit]').click()
  }
}

export default LoginPage
