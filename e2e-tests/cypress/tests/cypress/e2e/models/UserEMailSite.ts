/// <reference types="cypress" />

export class UserEMailSite {
  // selectors
  emailInbox = ".sidebar-emails-container";
  emailList = ".email-list";
  emailMeta = ".email-meta";
  emailSubject = ".subject";

  openRecentPasswordResetEMail() {
    cy.get(this.emailList)
      .find("email-item")
      .filter(":contains(asswor)")
      .click();
    expect(cy.get(this.emailSubject)).to("contain", "asswor");
  }
}
