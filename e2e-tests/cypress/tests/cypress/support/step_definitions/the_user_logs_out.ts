import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { SideNavMenu } from "../../e2e/models/SideNavMenu";

Then("the user logs out", () => {
  const sideNavMenu = new SideNavMenu();
  sideNavMenu.logout();
});
