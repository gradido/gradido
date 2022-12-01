import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { ForgotPasswordPage } from "../../e2e/models/ForgotPasswordPage";
import { UserEMailSite } from "../../e2e/models/UserEMailSite";

const userEMailSite = new UserEMailSite();
// const forgotPasswordPage = ForgotPasswordPage();

Then("the user receives an e-mail containing the password reset link", () => {
  cy.origin(
    Cypress.env("mailserverURL"),
    { args: userEMailSite },
    (userEMailSite) => {
      // const linkPattern = /http:\/\/localhost\/reset-password\/[0-9]{19}/;
      const linkPattern = /\/reset-password\/[0-9]{19}/;

      cy.visit("/"); // navigate to user's e-maile site (on fake mail server)
      cy.get(userEMailSite.emailInbox).should("be.visible");

      cy.get(userEMailSite.emailList)
        .find(".email-item")
        .filter(":contains(asswor)")
        .first()
        .click();

      cy.get(userEMailSite.emailMeta)
        .find(userEMailSite.emailSubject)
        .contains("asswor");

      cy.get(".email-content")
        .find(".plain-text")
        .contains(linkPattern)
        .invoke("text")
        .then((text) => {
          const resetPasswordLink = text.match(linkPattern)[0];
          cy.task("setResetPasswordLink", resetPasswordLink);
        });
    }
  );
});

When("the user opens the password reset link in the browser", () => {
  // cy.visit("/");
  cy.task("getResetPasswordLink").then((passwordResetLink) => {
    cy.visit(passwordResetLink);
  });
  // TODO: expect
});
