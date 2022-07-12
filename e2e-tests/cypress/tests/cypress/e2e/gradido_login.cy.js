import users from '../fixtures/users'
import LoginPage from './models/LoginPage'

describe('Gradido', () => {
  let userData;

  before(() => {
    cy.fixture('users').then((usersFixture) => {
        userData = usersFixture;
    });
  });

  it('login test (happy path)', () => {
    const loginPage = new LoginPage();
    loginPage.goto();
    loginPage.enterEmail(userData.user.email);
    loginPage.enterPassword(userData.user.password);
    loginPage.submitLogin();
    cy.url().should('be.equal', `${Cypress.config('baseUrl')}/overview`);
   });
});
