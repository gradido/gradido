Feature: User authentication
  As a user
  I want to be able to sign in - only with valid credentials
  In order to be able to posts and do other contributions as myself
  Furthermore I want to be able to stay logged in and logout again

  # TODO for these pre-conditions utilize seeding or API check, if user exists in test system
  # Background:
  #   Given the following "users" are in the database:
  #     | email            | password | name          |
  #     | bibi@bloxberg.de | Aa12345_ | Bibi Bloxberg |

  Scenario: Log in successfully
    Given the browser navigates to page "/login"
    When the user submits the credentials "bibi@bloxberg.de" "Aa12345_"
    Then the user is logged in with username "Bibi Bloxberg"

