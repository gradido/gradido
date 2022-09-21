import { When } from "@badeball/cypress-cucumber-preprocessor";
import { ProfilePage } from "../models/ProfilePage";

When("the user fills the password form with:", (table) => {
  table = table.rowsHash();
  const profilePage = new ProfilePage();
  profilePage.enterOldPassword(table["Old password"]);
  profilePage.enterNewPassword(table["New password"]);
  profilePage.enterRepeatPassword(table["Repeat new password"]);
  cy.get(profilePage.submitNewPasswordBtn).should("be.enabled");
});
