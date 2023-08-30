import { Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { SendPage } from '../../e2e/models/SendPage'

const sendPage = new SendPage()

When(
  'the user fills the send form with {string} {string} {string}',
  (email: string, amount: string, memoText: string) => {
    sendPage.enterReceiverEmail(email)
    sendPage.enterAmount(amount)
    sendPage.enterMemoText(memoText)
  },
)

When('the user submits the send form', () => {
  sendPage.submit()
  cy.get(sendPage.confirmationBox).should('be.visible')
})

Then(
  'the transaction details are presented for confirmation {string} {string} {string} {string} {string}',
  (
    receiverEmail: string,
    sendAmount: string,
    memoText: string,
    senderBalance: string,
    newSenderBalance: string,
  ) => {
    cy.get('.transaction-confirm-send').contains(receiverEmail)
    cy.get('.transaction-confirm-send').contains(`+ ${sendAmount} GDD`)
    cy.get('.transaction-confirm-send').contains(memoText)
    cy.get('.transaction-confirm-send').contains(`+ ${senderBalance} GDD`)
    cy.get('.transaction-confirm-send').contains(`− ${sendAmount} GDD`)
    cy.get('.transaction-confirm-send').contains(`+ ${newSenderBalance} GDD`)
  },
)

When('the user submits the transaction by confirming', () => {
  cy.intercept({
    method: 'POST',
    url: '/graphql',
    hostname: 'localhost',
  }).as('sendCoins')

  sendPage.submit()

  cy.wait('@sendCoins').then((interception) => {
    cy.wrap(interception.response?.statusCode).should('eq', 200)
    cy.wrap(interception.request.body).should(
      'have.property',
      'query',
      `mutation ($recipientCommunityIdentifier: String!, $recipientIdentifier: String!, $amount: Decimal!, $memo: String!) {
        sendCoins(
          recipientCommunityIdentifier: $recipientCommunityIdentifier
          recipientIdentifier: $recipientIdentifier
          amount: $amount
          memo: $memo
        )
      }
      `,
    )
    cy.wrap(interception.response?.body)
      .should('have.nested.property', 'data.sendCoins')
      .and('equal', true)
  })
  cy.get('[data-test="send-transaction-success-text"]').should('be.visible')
})

Then(
  'the {string} and {string} are displayed on the {string} page',
  (name: string, amount: string, page: string) => {
    switch (page) {
      case 'overview':
        cy.get('.align-items-center').contains(`${name}`)
        cy.get('.align-items-center').contains(`${amount} GDD`)
        break
      case 'send':
        cy.get('.align-items-center').contains(`${name}`)
        cy.get('.align-items-center').contains(`${amount} GDD`)
        break
      case 'transactions':
        cy.get('div.mt-3 > div > div.test-list-group-item')
          .eq(0)
          .contains('div.gdd-transaction-list-item-name', `${name}`)
        cy.get('div.mt-3 > div > div.test-list-group-item')
          .eq(0)
          .contains('[data-test="transaction-amount"]', `${amount} GDD`)
        break
      default:
        throw new Error(
          `Error in "Then the {string} and {string} are displayed on the {string}} page" step: incorrect page name string "${page}"`,
        )
    }
  },
)
