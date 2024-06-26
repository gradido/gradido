/// <reference types='cypress' />

export class SideNavMenu {
  // selectors
  profileMenu = '[data-test=profile-menu]'
  logoutMenu = '[data-test=logout-menu]'

  openUserProfile() {
    cy.get(this.profileMenu).click()
    return this
  }

  logout() {
    cy.get('.main-sidebar').find(this.logoutMenu).click()
    return this
  }
}
