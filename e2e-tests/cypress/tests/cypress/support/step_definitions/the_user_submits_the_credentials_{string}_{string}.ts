import { When } from "@badeball/cypress-cucumber-preprocessor";
import { LoginPage } from "../../e2e/models/LoginPage";

When("the user submits the credentials {string} {string}", (email: string, password: string) => {
    const loginPage = new LoginPage;
    loginPage.enterEmail(email);
    loginPage.enterPassword(password);
    loginPage.submitLogin();
});