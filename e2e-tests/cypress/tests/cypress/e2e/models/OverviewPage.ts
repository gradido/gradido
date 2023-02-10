/// <reference types='cypress' />

export class OverviewPage {
  navbarName = '[data-test="navbar-item-username"]'

  goto() {
    cy.visit('/overview')
    return this
  }
}
