import { And, Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { SendPage } from '../../e2e/models/SendPage'

const sendPage = new SendPage()

When(
  'the user fills the send form with {string} {string} {string}',
  (email: string, amount: string, memoText: string) => {
    sendPage.enterReceiverEmail(email)
    sendPage.enterAmount(amount)
    sendPage.enterMemoText(memoText)
  }
)

And('the user submits the send form', () => {
  sendPage.submit()
  cy.get('.transaction-confirm-send').should('be.visible')
})


Then('the transaction details are presented for confirmation', () => {
  cy.get('.transaction-confirm-send').contains('raeuber@hotzenplotz.de')
  cy.get('.transaction-confirm-send').contains('+ 120.50 GDD')
  cy.get('.transaction-confirm-send').contains('Some memo text')
  cy.get('.transaction-confirm-send').contains('+ 515.11 GDD')
  cy.get('.transaction-confirm-send').contains('− 120.50 GDD')
  cy.get('.transaction-confirm-send').contains('+ 394.61 GDD')
})

When('the user submits the transaction by confirming', () => {
  cy.intercept({
    method: 'POST',
    url: '/graphql',
    hostname: 'localhost',
  }).as('sendCoins')

  sendPage.submit()

  cy.wait('@sendCoins').then((interception) => {
    cy.wrap(interception.response?.statusCode).should('eq', 200)
    cy.wrap(interception.request.body)
      .should('have.property', 'query', `mutation ($identifier: String!, $amount: Decimal!, $memo: String!) {
  sendCoins(identifier: $identifier, amount: $amount, memo: $memo)
}
`   )
    cy.wrap(interception.response?.body)
      .should('have.nested.property', 'data.sendCoins')
      .and('equal', true)
  })
  cy.get('[data-test="send-transaction-success-text"]').should('be.visible')
  cy.get('.rightside-last-transactions').should('be.visible')
  cy.get('.align-items-center').contains('Räuber Hotzenplotz')
  cy.get('.align-items-center').contains('− 120.50 GDD')
})
