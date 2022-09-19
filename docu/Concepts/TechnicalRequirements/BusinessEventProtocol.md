# Business Event Protocol

With the business event protocol the gradido application will capture and persist business information for future reports and statistics. The idea is to design and implement general functionality to capture and store business events. Each business event will be defined as a separate event type with its own business attributes. Each event type extends a basic event type to ensure a type safetiness with its mandatory and optional attributes.

## EventType - Enum

The different event types will be defined as Enum. The following list is a first draft and will grow with further event types in the future.

| EventType                           | Description                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| BasicEvent                          | the basic event is the root of all further extending event types                                       |
| VisitGradidoEvent                   | if a user visits a gradido page without login or register                                              |
| RegisterEvent                       | the user presses the register button                                                                   |
| RedeemRegisterEvent                 | the user presses the register button initiated by the redeem link                                      |
| InActiveAccountEvent                | the systems create an inactive account during the register process                                     |
| SendConfirmEmailEvent               | the system send a confirmation email to the user during the register process                           |
| ConfirmEmailEvent                   | the user confirms his email during the register process                                                |
| RegisterEmailKlickTippEvent         | the system registers the confirmed email at klicktipp                                                  |
| LoginEvent                          | the user presses the login button                                                                      |
| RedeemLoginEvent                    | the user presses the login button initiated by the redeem link                                         |
| ActivateAccountEvent                | the system activates the users account during the first login process                                  |
| PasswordChangeEvent                 | the user changes his password                                                                          |
| TransactionSendEvent                | the user creates a transaction and sends it online                                                     |
| TransactionSendRedeemEvent          | the user creates a transaction and sends it per redeem link                                            |
| TransactionRepeateRedeemEvent       | the user recreates a redeem link of a still open transaction                                           |
| TransactionCreationEvent            | the user receives a creation transaction for his confirmed contribution                                |
| TransactionReceiveEvent             | the user receives a transaction from an other user and posts the amount on his account                 |
| TransactionReceiveRedeemEvent       | the user activates the redeem link and receives the transaction and posts the amount on his account    |
| ContributionCreateEvent             | the user enters his contribution and asks for confirmation                                             |
| ContributionConfirmEvent            | the user confirms a contribution of an other user (for future multi confirmation from several users)   |
| ContributionLinkDefineEvent         | the admin user defines a contributionLink, which could be send per Link/QR-Code on an other medium     |
| ContributionLinkActivateRedeemEvent | the user activates a received contributionLink to create a contribution entry for the contributionLink |

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

The following table lists for each event type the mandatory attributes, which have to be initialized at event occurence and to be written in the database event protocol table:

| EventType                           | id | type | createdAt | userID | XuserID | XCommunityID | transactionID | contribID | amount |
| :---------------------------------- | :-: | :--: | :-------: | :----: | :-----: | :----------: | :-----------: | :-------: | :----: |
| BasicEvent                          | x |  x  |     x     |        |        |              |              |          |        |
| VisitGradidoEvent                   | x |  x  |     x     |        |        |              |              |          |        |
| RegisterEvent                       | x |  x  |     x     |   x   |        |              |              |          |        |
| RedeemRegisterEvent                 | x |  x  |     x     |   x   |        |              |      (x)      |    (x)    |        |
| InActiveAccountEvent                | x |  x  |     x     |   x   |        |              |              |          |        |
| SendConfirmEmailEvent               | x |  x  |     x     |   x   |        |              |              |          |        |
| ConfirmEmailEvent                   | x |  x  |     x     |   x   |        |              |              |          |        |
| RegisterEmailKlickTippEvent         | x |  x  |     x     |   x   |        |              |              |          |        |
| LoginEvent                          | x |  x  |     x     |   x   |        |              |              |          |        |
| RedeemLoginEvent                    | x |  x  |     x     |   x   |        |              |      (x)      |    (x)    |        |
| ActivateAccountEvent                | x |  x  |     x     |   x   |        |              |              |          |        |
| PasswordChangeEvent                 | x |  x  |     x     |   x   |        |              |              |          |        |
| TransactionSendEvent                | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| TransactionSendRedeemEvent          | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| TransactionRepeateRedeemEvent       | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| TransactionCreationEvent            | x |  x  |     x     |   x   |        |              |       x       |          |   x   |
| TransactionReceiveEvent             | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| TransactionReceiveRedeemEvent       | x |  x  |     x     |   x   |    x    |      x      |       x       |          |   x   |
| ContributionCreateEvent             | x |  x  |     x     |   x   |        |              |              |     x     |   x   |
| ContributionConfirmEvent            | x |  x  |     x     |   x   |    x    |      x      |              |     x     |   x   |
| ContributionLinkDefineEvent         | x |  x  |     x     |   x   |        |              |              |          |   x   |
| ContributionLinkActivateRedeemEvent | x |  x  |     x     |   x   |        |              |              |     x     |   x   |

## Event creation

The business logic needs a *general event creation* service/methode, which accepts as input one of the predefined event type objects. An event object have to be initialized with its mandatory attributes before it can be given as input parameters for event creation. The service maps the event object attributes to the database entity and writes a new entry in the `EventProtocol `table.

At each specific location of the gradido business logic an event creation invocation has to be introduced manually, which matches the corresponding event type - see [EventType-Enum](#EventType-Enum) above.
