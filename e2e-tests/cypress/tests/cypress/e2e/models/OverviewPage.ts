/// <reference types="cypress" />

export class OverviewPage {
  navbarNameSelector = '[data-test="navbar-item-username"]';

    goto() {
      cy.visit('/overview');
      return this;
    }
}