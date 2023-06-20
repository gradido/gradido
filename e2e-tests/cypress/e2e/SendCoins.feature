Feature: Send coins
  As a user
  I want to send and receive GDD
  I want to see transaction details on overview and transactions pages

  # Background:
  #   Given the following "users" are in the database:
  #     | email                  | password | name               |
  #     | bob@baumeister.de      | Aa12345_ | Bob Baumeister     |
  #     | raeuber@hotzenplotz.de | Aa12345_ | Räuber Hotzenplotz |
  
  Scenario: Send GDD to other user
    Given the user is logged in as "bob@baumeister.de" "Aa12345_"
    And the user navigates to page "/send"
    When the user fills the send form with "raeuber@hotzenplotz.de" "<amount>" "Some memo text"
    And the user submits the send form
    Then the transaction details are presented for confirmation
    When the user submits the transaction by confirming
    And the user navigates to page "/transactions"
    Then the "<receiverName>" and "<amount>" are displayed on the "transactions" page
  
  Examples:
    | receiverName       | amount |
    # | Räuber Hotzenplotz | 120.50 |
    | Räuber Hotzenplotz | 120,50 |

  Scenario: Receive GDD from other user
    Given the user is logged in as "raeuber@hotzenplotz.de" "Aa12345_"
    And the user receives the transaction e-mail about "<amount>" GDD from "<senderName>"
    When the user opens the "transaction" link in the browser
    Then the "<senderName>" and "<amount>" are displayed on the "overview" page
    When the user navigates to page "/transactions"
    Then the "<senderName>" and "<amount>" are displayed on the "transactions" page
  
  Examples:
    | senderName         | amount |
    # | Bob der Baumeister | 120.50 |
    | Bob der Baumeister | 120,50 |
  
  
