import { When } from "@badeball/cypress-cucumber-preprocessor";
import { And } from "../../../node_modules/@badeball/cypress-cucumber-preprocessor/lib/methods";
import { ForgotPasswordPage } from "../../e2e/models/ForgotPasswordPage";
import { LoginPage } from "../../e2e/models/LoginPage";

const loginPage = new LoginPage();
const forgotPasswordPage = new ForgotPasswordPage();

// login related

When("the user submits no credentials", () => {
  loginPage.submitLogin();
});

When(
  "the user submits the credentials {string} {string}",
  (email: string, password: string) => {
    loginPage.enterEmail(email);
    loginPage.enterPassword(password);
    loginPage.submitLogin();
  }
);

// password reset related

And("the user navigates to the forgot password page", () => {
  loginPage.openForgotPasswordPage();
  cy.url().should("include", "/forgot-password");
});

When("the user enters the e-mail address {string}", (email: string) => {
  forgotPasswordPage.enterEmail(email);
});

And("the user submits the e-mail form", () => {
  forgotPasswordPage.submitEmail();
  cy.get(forgotPasswordPage.successComponent).should("be.visible");
});
