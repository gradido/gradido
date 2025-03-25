/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */

/// <reference types='cypress' />

import './e2e'

declare global {
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      login(email: string, password: string): Chainable<any>
    }
  }
}

Cypress.on('uncaught:exception', (err, runnable) => {
  cy.log('Uncaught Exception, maybe a void call of a async function:', err)
  return false
})
