Feature: User registration
  As a user
  I want to register to create an account

  Scenario: Register successfully
    Given the user navigates to page "/register"
    When the user fills name and email "Regina" "Register" "regina@register.com"
    And the user agrees to the privacy policy
    And the user submits the registration form
    Then the user receives an e-mail containing the "activation" link
    When the user opens the "activation" link in the browser
    And the user enters the password "12345Aa_"
    And the user repeats the password "12345Aa_"
    And the user submits the password form
    And the user clicks the sign in button
    Then the user submits the credentials "regina@register.com" "12345Aa_"
    And the user is logged in with username "Regina Register"
