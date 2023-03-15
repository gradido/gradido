import { And, When } from '@badeball/cypress-cucumber-preprocessor'
import { RegistrationPage } from '../../e2e/models/RegistrationPage'

const registrationPage = new RegistrationPage()

When(
  'the user fills name and email {string} {string} {string}',
  (firstname: string, lastname: string, email: string) => {
    const registrationPage = new RegistrationPage()
    registrationPage.enterFirstname(firstname)
    registrationPage.enterLastname(lastname)
    registrationPage.enterEmail(email)
  }
)

And('the user agrees to the privacy policy', () => {
  registrationPage.checkPrivacyCheckbox()
})

And('the user submits the registration form', () => {
  registrationPage.submitRegistrationForm()
  cy.get(registrationPage.RegistrationThanxHeadline).should('be.visible')
  cy.get(registrationPage.RegistrationThanxText).should('be.visible')
})
