package net.gradido.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Response;

public class LoginPage {
  private final Page page;
  
  private final Locator emailInput;
  private final Locator passwordInput;
  private final Locator submitButton;

  public LoginPage(Page page) {
      this.page = page;
      emailInput = page.locator("input[name='email']");
      passwordInput = page.locator("input[name='password']");
      submitButton = page.locator("button[type='submit']");      
  }

  public void login(String email, String password) {
      emailInput.fill(email);
      passwordInput.fill(password);
      Response response = page.waitForResponse("**/graphql", () -> {
        submitButton.click();
      });   
  }
}