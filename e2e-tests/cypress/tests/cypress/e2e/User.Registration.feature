Feature: User registration
  As a user
  I want to register to create an account

  @skip
  Scenario: Register successfully
    Given the user navigates to page "/register"
    When the user fills name and email "Regina" "Register" "regina@register.com"
    And the user agrees to the privacy policy
    And the user submits the registration form
    Then the user can use a provided activation link
    And the user can set a password "Aa12345_"
    And the user can login with the credentials "regina@register.com" "Aa12345_"
