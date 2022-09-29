import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { LoginPage } from "../../e2e/models/LoginPage";
import { OverviewPage } from "../../e2e/models/OverviewPage";
import { SideNavMenu } from "../../e2e/models/SideNavMenu";
import { Toasts } from "../../e2e/models/Toasts";

Given("the browser navigates to page {string}", (page: string) => {
  cy.visit(page);
});

// login-related

Given(
  "the user is logged in as {string} {string}",
  (email: string, password: string) => {
    cy.login(email, password);
  }
);

Then("the user is logged in with username {string}", (username: string) => {
  const overviewPage = new OverviewPage();
  cy.url().should("include", "/overview");
  cy.get(overviewPage.navbarName).should("contain", username);
});

Then("the user cannot login", () => {
  const toast = new Toasts();
  cy.get(toast.toastSlot).within(() => {
    cy.get(toast.toastTypeError);
    cy.get(toast.toastTitle).should("be.visible");
    cy.get(toast.toastMessage).should("be.visible");
  });
});

//

When(
  "the user submits the credentials {string} {string}",
  (email: string, password: string) => {
    const loginPage = new LoginPage();
    loginPage.enterEmail(email);
    loginPage.enterPassword(password);
    loginPage.submitLogin();
  }
);

// logout

Then("the user logs out", () => {
  const sideNavMenu = new SideNavMenu();
  sideNavMenu.logout();
});
