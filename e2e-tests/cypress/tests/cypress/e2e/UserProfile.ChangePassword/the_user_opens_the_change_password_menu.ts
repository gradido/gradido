import { And } from "@badeball/cypress-cucumber-preprocessor";
import { ProfilePage } from "../models/ProfilePage";

And("the user opens the change password menu", () => {
    const profilePage = new ProfilePage();
    cy.get(profilePage.openChangePassword).click();
    cy.get(profilePage.newPasswordRepeatInput).should('be.visible');
    cy.get(profilePage.submitNewPasswordBtn).should('be.disabled');
});