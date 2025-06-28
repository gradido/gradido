package net.gradido.e2e.tests;

import net.gradido.e2e.base.BaseTest;
import net.gradido.e2e.pages.LoginPage;
import net.gradido.e2e.components.Toasts;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class InvalidLoginTest extends BaseTest {
  private LoginPage loginPage;

  @BeforeEach
  void initPageObjects() {
      loginPage = new LoginPage(page);
  }

  @Test
  void invalidUserSeesError() {
      page.navigate("http://localhost:3000/login");
      loginPage.login("peter@lustig.de", "wrongpass");
      Toasts toast = new Toasts(page);
      toast.assertErrorToastVisible();
  }
}