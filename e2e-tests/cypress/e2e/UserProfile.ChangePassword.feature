Feature: User profile - change password
  As a user
  I want the option to change my password on my profile page.

  Background:
    # TODO for these pre-conditions utilize seeding or API check, if user exists in test system
    # Given the following "users" are in the database:
    #   | email            | password | name               |
    #   | bob@baumeister.de | Aa12345_ | Bob der Baumeister |
    
    # TODO instead of credentials use the name of an user object (see seeds in backend)
    Given the user is logged in as "bob@baumeister.de" "Aa12345_"

  Scenario: Change password successfully
    Given the user navigates to page "/settings"
    And the user opens the change password menu
    When the user fills the password form with:
      | Old password        | Aa12345_ |
      | New password        | 12345Aa_ |
      | Repeat new password | 12345Aa_ |
    And the user submits the password form
    And the user is presented a "success" message
    And the user logs out
    Then the user submits the credentials "bob@baumeister.de" "Aa12345_"
    And the user cannot login
    But the user submits the credentials "bob@baumeister.de" "12345Aa_"
    And the user is logged in with username "Bob der Baumeister"
