import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given("the browser navigates to page {string}", (page: string) => {
  cy.visit(page);
});
