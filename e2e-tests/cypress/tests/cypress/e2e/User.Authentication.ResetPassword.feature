Feature: User Authentication - reset password
  As a user
  I want the option to reset my password from the sign in page

  # TODO for these pre-conditions utilize seeding or API check, if user exists in test system
  # Background:
  #   Given the following "users" are in the database:
  #     | email | password | name |
  #     | bibi@bloxberg.de | Aa12345_ | Bibi Bloxberg |

  Scenario: Reset password from signin page successfully
    Given the browser navigates to page "/login"
    And the user navigates to the forgot password page
    When the user enters the e-mail address "bibi@bloxberg.de"
    And the user submits the e-mail form
    Then the user receives an e-mail containing the password reset link
    When the user opens the password reset link in the browser
#    And the user enters the password "12345Aa_"
#    And the user repeats the password "12345Aa_"
#    And the user submits the password form
#    And the user clicks the sign in button
#    Then the user submits the credentials "bibi@bloxberg.de" "Aa12345_"
#    And the user cannot login
#    But the user submits the credentials "bibi@bloxberg.de" "12345Aa_"
#    And the user is logged in with username "Bibi Bloxberg"
