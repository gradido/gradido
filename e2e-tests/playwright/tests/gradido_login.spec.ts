import { test, expect } from '@playwright/test';
import { LoginPage } from './models/login_page';
import { WelcomePage } from './models/welcome_page';


test('Gradido login test (happy path)', async ({ page }) => {
  const { EMAIL, PASSWORD } = process.env;
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.enterEmail(EMAIL);
  await loginPage.enterPassword(PASSWORD);
  await loginPage.submitLogin();
  // assertions
  await expect(page).toHaveURL('./overview');
});
