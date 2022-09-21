import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given(
  "the user is logged in as {string} {string}",
  (email: string, password: string) => {
    cy.login(email, password);
  }
);
