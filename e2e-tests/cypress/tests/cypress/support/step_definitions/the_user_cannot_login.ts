import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { Toasts } from "../../e2e/models/Toasts";

Then("the user cannot login", () => {
  const toast = new Toasts();
  cy.get(toast.toastTitle).should("contain.text", "Fehler!"); // 'Error!'
  cy.get(toast.toastMessage).should(
    "contain.text",
    "Kein Benutzer mit diesen Anmeldedaten."
  ); // 'No user with this credentials.'
});
