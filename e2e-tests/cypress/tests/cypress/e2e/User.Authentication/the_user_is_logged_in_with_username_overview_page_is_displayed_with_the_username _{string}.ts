import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { OverviewPage } from "../models/OverviewPage";

Then("the user is logged in with username {string}", (username: string) => {
    const overviewPage = new OverviewPage();
    cy.url().should('include', '/overview')
    cy.get(overviewPage.navbarNameSelector).should('contain', username);
});


