import { And } from "@badeball/cypress-cucumber-preprocessor";
import { ProfilePage } from "../models/ProfilePage";

And("the user submits the password form", () => {
  const profilePage = new ProfilePage();
  profilePage.submitPasswordForm();
});
