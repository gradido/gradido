import { When } from "@badeball/cypress-cucumber-preprocessor";
import { LoginPage } from "../../e2e/models/LoginPage";

When("the user submits no credentials", () => {
  const loginPage = new LoginPage();
  loginPage.submitLogin();
});
