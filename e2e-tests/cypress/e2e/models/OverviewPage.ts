/// <reference types='cypress' />

export class OverviewPage {
  navbarName = '[data-test="navbar-item-username"]'
  rightLastTransactionsList = '.rightside-last-transactions'
  

  goto() {
    cy.visit('/overview')
    return this
  }
}
