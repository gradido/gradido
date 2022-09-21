import { When } from "@badeball/cypress-cucumber-preprocessor";
import { Toasts } from "../models/Toasts";

When("the user is presented a {string} message", (type: string) => {
  const toast = new Toasts();
  cy.get(toast.toastTitle).should("contain.text", "Success");
  cy.get(toast.toastMessage).should(
    "contain.text",
    "Your password has been changed."
  );
});
