# Business Event Protocol

With the business event protocol the gradido application will capture and persist business information for future reports and statistics. The idea is to design and implement general functionality to capture and store business events. Each business event will be defined as a separate event type with its own business attributes. Each event type extends a basic event type to ensure a type safetiness with its mandatory and optional attributes.

## EventType - Enum

The different event types will be defined as Enum. The following list is a first draft and will grow with further event types in the future.

| EventType                              | Description                                                                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| BasicEvent                             | the basic event is the root of all further extending event types                                                                          |
| VisitGradidoEvent                      | if a user visits a gradido page without login or register; possible as soon as a request-response-loop for the first page will be invoked |
| RegisterEvent                          | the user presses the register button                                                                                                      |
| LoginEvent                             | the user presses the login button                                                                                                         |
| VerifyRedeemEvent                      | the user presses a redeem link independent from transaction or contribution redeem                                                        |
| RedeemRegisterEvent                    | the user presses the register-button initiated by the redeem link                                                                         |
| RedeemLoginEvent                       | the user presses the login-button initiated by the redeem link                                                                            |
| ActivateAccountEvent                   | the system activates the users account after a successful confirmEmail-Event or during a reactivation of a deactivated account            |
| InActiveAccountEvent                   | the systems creates an inactive account during the register process or an active account will be reset to inactive                        |
| SetPasswordEvent                       | the system sets a new password after ConfirmEmailEvent or SendForgotPasswordEvent                                                         |
| RegisterEmailKlickTippEvent            | the system registers the confirmed email at klicktipp                                                                                     |
| PasswordChangeEvent                    | the user changes his password in his Profile                                                                                              |
| TransactionSendEvent                   | the user creates a transaction and sends it online; paired with TransactionReceiveEvent                                                   |
| TransactionLinkCreateEvent             | the user creates a transaction link                                                                                                       |
| TransactionReceiveEvent                | the user receives a transaction from an other user and posts the amount on his account; paired with TransactionSendEvent                  |
| TransactionLinkRedeemEvent             | the user activates the redeem link and receives the transaction and posts the amount on his account                                       |
| ContributionCreateEvent                | the user enters his contribution and asks for confirmation                                                                                |
| ContributionConfirmEvent               | the admin user confirms a contribution of an other user (for future multi confirmation from several users)                                |
| ContributionDenyEvent                  | the admin user denies a contribution of an other user                                                                                     |
| ContributionLinkDefineEvent            | the admin user defines a contributionLink, which could be send per Link/QR-Code on an other medium                                        |
| ContributionLinkRedeemEvent            | the user activates a received contributionLink to create a contribution entry for the contributionLink                                    |
| UserCreateContributionMessageEvent     | the user captures a new message for a contribution                                                                                        |
| AdminCreateContributionMessageEvent    | the admin user captures a new message for a contribution                                                                                  |
| LogoutEvent                            | the user invokes a logout                                                                                                                 |
| SendConfirmEmailEvent                  | the system sends a confirmation email to the user during the registration process                                                         |
| SendAccountMultiRegistrationEmailEvent | the system sends a info email to the user, that an other user tries to register with his existing email address                           |
| SendForgotPasswordEmailEvent           | the system sends the forgot password email including a special link to start the forgot password process                                  |
| SendTransactionSendEmailEvent          | the system sends an email to inform the user about his transaction was sent to an other user                                              |
| SendTransactionReceiveEmailEvent       | the system sends an email to inform the user about a received transaction from an other user                                              |
| SendAddedContributionEmailEvent        | the system sends an email to inform the user about the creation of his captured contribution                                              |
| SendContributionConfirmEmailEvent      | the system sends an email to inform the user about the confirmation of his contribution                                                   |
| SendTransactionLinkRedeemEmailEvent    | the system sends an email to the user, who created the transactionlink, that the link was redeemed                                        |
|                                        |                                                                                                                                           |

## EventProtocol - Entity

The business events will be stored in database in the new table `EventProtocol`. The tabel will have the following attributes:

| Attribute     | Type      | Description                                                                                      |
| ------------- | --------- | ------------------------------------------------------------------------------------------------ |
| id            | int       | technical unique key (from db sequence)                                                          |
| type          | enum      | type of event                                                                                    |
| createdAt     | timestamp | timestamp the event occurs (not the time of writing)                                             |
| userID        | string    | the user ID, who invokes the event                                                               |
| XuserID       | string    | the cross user ID, who is involved in the process like a tx-sender, contrib-receiver, ...        |
| XcommunityID  | string    | the cross community ID, which is involved in the process like a tx-sender, contrib-receiver, ... |
| transactionID | int       | the technical key of the transaction, which triggers the event                                   |
| contribID     | int       | the technical key of the contribution, which triggers the event                                  |
| amount        | digital   | the amount of gradido transferred by transaction, creation or redeem                             |

## Event Types

The following table lists for each event type the mapping between old and new key, the mandatory attributes, which have to be initialized at event occurence and to be written in the database event protocol table:

| EventType - old key               | EventType - new key                    | id | type | createdAt | userID | XuserID | XCommunityID | transactionID | contribID | amount |
| :-------------------------------- | :------------------------------------- | :-: | :--: | :-------: | :----: | :-----: | :----------: | :-----------: | :-------: | :----: |
| BASIC                             | BasicEvent                             | x |  x  |     x     |        |        |              |              |          |        |
| VISIT_GRADIDO                     | VisitGradidoEvent                      | x |  x  |     x     |        |        |              |              |          |        |
| REGISTER                          | RegisterEvent                          | x |  x  |     x     |   x   |        |              |              |          |        |
| LOGIN                             | LoginEvent                             | x |  x  |     x     |   x   |        |              |              |          |        |
|                                   | VerifyRedeemEvent                      |    |      |          |        |        |              |              |          |        |
| REDEEM_REGISTER                   | RedeemRegisterEvent                    | x |  x  |     x     |   x   |        |              |      (x)      |    (x)    |        |
| REDEEM_LOGIN                      | RedeemLoginEvent                       | x |  x  |     x     |   x   |        |              |      (x)      |    (x)    |        |
| ACTIVATE_ACCOUNT                  | ActivateAccountEvent                   | x |  x  |     x     |   x   |        |              |              |          |        |
| INACTIVE_ACCOUNT                  | InActiveAccountEvent                   | x |  x  |     x     |   x   |        |              |              |          |        |
| CONFIRM_EMAIL                     | SetPasswordEvent                       | x |  x  |     x     |   x   |        |              |              |          |        |
| REGISTER_EMAIL_KLICKTIPP          | RegisterEmailKlickTippEvent            | x |  x  |     x     |   x   |        |              |              |          |        |
| PASSWORD_CHANGE                   | PasswordChangeEvent                    | x |  x  |     x     |   x   |        |              |              |          |        |
| TRANSACTION_SEND                  | TransactionSendEvent                   | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| TRANSACTION_CREATION              | TransactionLinkCreateEvent             | x |  x  |     x     |   x   |        |              |       x       |          |   x   |
| TRANSACTION_RECEIVE               | TransactionReceiveEvent                | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| TRANSACTION_SEND_REDEEM           | TransactionLinkRedeemEvent             | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| CONTRIBUTION_CREATE               | ContributionCreateEvent                | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
| CONTRIBUTION_CONFIRM              | ContributionConfirmEvent               | x |  x  |     x     |   x   |    x    |      x      |              |     x     |   x   |
|                                   | ContributionDenyEvent                  | x |  x  |     x     |   x   |    x    |      x      |              |     x     |   x   |
| CONTRIBUTION_LINK_DEFINE          | ContributionLinkDefineEvent            | x |  x  |     x     |   x   |        |              |              |          |   x   |
| CONTRIBUTION_LINK_ACTIVATE_REDEEM | ContributionLinkRedeemEvent            | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
|                                   | UserCreateContributionMessageEvent     | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
|                                   | AdminCreateContributionMessageEvent    | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
|                                   | LogoutEvent                            | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
| SEND_CONFIRMATION_EMAIL           | SendConfirmEmailEvent                  | x |  x  |     x     |   x   |        |              |              |          |        |
|                                   | SendAccountMultiRegistrationEmailEvent | x |  x  |     x     |   x   |        |              |              |          |        |
|                                   | SendForgotPasswordEmailEvent           | x |  x  |     x     |   x   |        |              |              |          |        |
|                                   | SendTransactionSendEmailEvent          | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
|                                   | SendTransactionReceiveEmailEvent       | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
|                                   | SendAddedContributionEmailEvent        | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
|                                   | SendContributionConfirmEmailEvent      | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
|                                   | SendTransactionLinkRedeemEmailEvent    | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| TRANSACTION_REPEATE_REDEEM        | -                                      |    |      |          |        |        |              |              |          |        |
| TRANSACTION_RECEIVE_REDEEM        | -                                      |    |      |          |        |        |              |              |          |        |

## Event creation

The business logic needs a *general event creation* service/methode, which accepts as input one of the predefined event type objects. An event object have to be initialized with its mandatory attributes before it can be given as input parameters for event creation. The service maps the event object attributes to the database entity and writes a new entry in the `EventProtocol `table.

At each specific location of the gradido business logic an event creation invocation has to be introduced manually, which matches the corresponding event type - see [EventType-Enum](#EventType-Enum) above.
