package net.gradido.e2e.tests;

import net.gradido.e2e.base.BaseTest;
import net.gradido.e2e.pages.LoginPage;
import net.gradido.e2e.components.Toasts;

import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ValidLoginTest extends BaseTest {
  private LoginPage loginPage;

  @BeforeEach
  void initPageObjects() {
      loginPage = new LoginPage(page);
  }

  @Test
  void validUserCanLogin() {
      loginPage.navigate();
      loginPage.login("peter@lustig.de", "Aa12345_");
      page.waitForURL("http://localhost:3000/overview");
      assertTrue(page.url().contains("/overview"));
  }
}

