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
    // Scoped by what is VISIBLE, not by which menu it belongs to. There are two menus in the
    // column now -- the main one and, while a settings route is open, the settings one -- and
    // a third copy sits in the phone drawer. `.main-sidebar` named one of them, so signing out
    // from the settings page found nothing.
    cy.get(`${this.logoutMenu}:visible`).click()
    return this
  }
}
