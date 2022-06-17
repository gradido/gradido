# Community Communication

This document contains the detailed descriptions of the public API of a community.

## Authentication/Autorization of new Community

Each public API of a community has to be authenticated and autorized before.

### Variant A:

This could be done by following the *OpenID Connect* protocoll. To fullfil these security requirements a separate security service has to be part of the Gradido-application.

Following the link [OpenID Connect](https://www.npmjs.com/package/openid-client) there can be found a server-side OpenID relying party implementation for node.js runtime.

The authentication of communities base on the community-attributes *key* and *URL*, which where exchanged during the *federation process* before. In concequence a community that hasn't execute his federation well will be unknown for other communities and can't be authenticated and autorized for further cross community API calls.

### Variant B:

A similar solution of authentication to variant A but **without autorization** can be done by using private and public key encryption. The *community creation* process will create a private and public key and store them internally. As the third step of the federation the *community communication* background process of the new *community-A* will be startet and a sequence of service invocations will exchange the necessary security data:

![../BusinessRequirements/image/AuthenticateCommunityCommunication.png](../BusinessRequirements/image/AuthenticateCommunityCommunication.png)

**1.Sequence**

1. the new *community-A* encrypt the community key of the existing *community-B* with its own privat key. Then it invokes the service *authenticateCommunity* at *community-B* by sending the own community key, the encrypted community key of *community-B* and a redirect URI back to *community-A* as input data. The *community-B* will search the given community key of *community-A* in the internally stored list of communities, which are a result of the previous *federation process* collected over a different medium.
2. If in *community-B* the given community key of *community-A* is found, a generated one-time code is stored together with the given encrypted community key in the community-entry of community-A, till an invocation of the service *verifyOneTimeCode* with this one-time-code. The one-time-code is passed back to the given Redirect URI of the *community-A*.
3. *Community-A* will send with the next invocation to *community-B* the received one-time code and the own public key by requesting the service *verifyOneTimeCode* at *community-B*.
4. *Community-B* will verify the given one-time-code and if valid, decrypt the previous received and encrypted community key from step 1 of the invocation-chain by using the given public key from *community-A*. If the decrypted community-key is equals the own community key, the public key of *community-A* is stored in the entry of *community-A* of the internal community list. As response of the *verifyOneTimeCode* the *community-B* will send back his own public key to *community-A*.
5. *Community-A* will store the received public key of *community-B* in the corresponding entry of the internal community-list.

| PR-Kommentar                 | zu Punkt 1 in der List oben                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ulf<br />24.03.2022          | ComA.org ---   (pubKeyA, SaltA, privKeyA(SaltA,pubKeyB)              ---> ComB.org<br />
```
<--- (pubKeyB, SaltB, privKeyB(SaltA, SaltB, pubKeyA)    ----
```

<br /><br />Das wäre mien Vorschlag, aber ich bin kein Crypto-Experte.<br />Tritt ein Validierungsfehler auf, wird der Call als unauthorized markiert.<br /><br />Vorteil: statless<br />Nachteil: Rechenaufwendig, kann umgangen werden, wenn Salt ein Datum ist und ein solcher Salt eine Gültigkeitsdauer hat - e.g. 10 min. Dann wäre aber SaltB unpraktikabel - für die Validierung auf ComB Seite wäre, dann eine Prüfung des Salt-Datums notwendig um replay Attacken zu verhindern. |
|  Claus-Peter<br />24.03.2022 |  Da scheint in deinem Bild ein Henne-Ei-Problem zu sein:<br />Wie kommt ComA für seinen ersten Request an ComB zu dem pubKeyB?<br />Den hat ComA zu dem Zeitpunkt doch noch gar nicht, oder?<br />Daher benötigt man einen mehr-schrittigen Handshake zw. den Communities, um diese Keys auszutauschen.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **PR-Kommentar**            |  **zu Punkt 2 in der Liste oben**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|  Ulf<br />24.03.2022         |  explain? Out key exchange was done befor, we just need to proof that our current data is correct?!                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|  Claus-Peter<br />24.03.2022 |  Das ist genau was ich oben schon meinte mit dem Henne-Ei-Problem:<br /><br />Wir sollten dazu noch einmal genau den Ablauf zu den einzelnen Zeitpunkten und welche Daten in welcher Community zu den Zeitpunkten vorliegen bzw über welche Kanäle diese ausgetauscht werden.<br />Ich glaube ich skizziere dies noch einmal möglichst einfach auf...                                                                                                                                                                                                                                                                                                                                                                                  |





The result of this invocation chain is the public key exchange of the involved communities, which is the foundation to authenticate a future cross community communication - see Sequnce 2 and 3.

To reach in Variant B nearly the same security level as in Variant A each community has to integrate several components to process this invocation chain like Variant A does.

### Variant C:

The third Variant exchange the all necessary data directly without the step in between returning a one-time code per redirection URI:

1. the new *community-A* encrypt the community key of the existing *community-B* with its own privat key. Then it invokes the service *authenticateCommunity* at *community-B* by sending the own community key, the encrypted community key of *community-B* and its own public key as input data. The *community-B* will search the given community key of *community-A* in the internally stored list of communities, which are a result of the previous *federation process* collected over a different medium.
2. If in *community-B* the given community key of *community-A* is found and if the decryption of the given encrypted community key with the given public key is equals the own community key, the public key of *community-A* is stored in the entry of *community-A* of the internal community list. As response of the *authenticateCommunity* the *community-B* will send back his own public key to *community-A*.
3. *Community-A* will store the received public key of *community-B* in the corresponding entry of the internal community-list.

Variant C is quite similar to Variant B, but to exchange all security relevant data in a single request-response-roundtrip bears more security risks and should be avoided.

## Service: "Authenticate Community"

This service must be invoked at first - see Variant B above - to exchange the security relevant data before further cross community communication can be done.

The third step of the *federation process* starts the background process for community communication. As result of the previous federation steps the new community has received from at least one existing community the URL and the community key.

After receiving the input data the service answers directly with an empty response. Then it searches for the attribute "community-key-A" in the internal community list the entry of *community-A*. If the entry of *community-A* could be found with this key, a new one-time-code is generated and stored together with the attribute "community-key-B" till the invocation of service "verifyOneTimeCode". With the given redirection URI a callback at *community-A* is invoked by sending the generated One-Time-Code back to *community-A*.

### Route:

POST https://<New_Community_URL>/authenticateCommunity

### Input-Data:

```
{
	"community-key-A" : "the community-key of the new community-A"
	"community-key-B" : "the community-key of the community-B, replied during the federation, encrypted by the private key of community-A"
	"redirectionURI" : "the URI for the redirection callback"
}
```

### Output-Data:

* none
* redirection URI: "one-time-code" : "one-time usable code with short expiration time as input for the service *verifyOneTimeCode*"

### Exceptions:

*MissingParameterException* if any of the parameter attributes is not initialized.

*UnknownCommunityException* if the community search with the value of parameter "community-key-A" could not find a matching community entry with this key.

## Service: "Verify OneTimeCode"

This service must be invoked directly after getting the *one-time code*, because this code has a very short expiration time. Together with the public key of *community-A* the one-time code is send as input data to *community-B*. The service verifies the given *one-time code* and if valid it decrypt with the given *public key* the previous receive *community-key-B* from the request *authenticateCommunity*. If this decrypted community-key is equals the own community-key the *public key* is stored in the community-entry of *community-A* of the internal community-list.

### Route:

POST https://<New_Community_URL>/verifyOneTimeCode

### Input-Data:

```
{
	"one-time-code" : "one-time code with short expiration, received from community-B per redirect URI"
	"public-key" : "the public key of the new community (community-A)"
}
```

### Output-Data:

```
{
	"public-key" : "the public key of community-B"
}
```

### Exceptions:

*MissingParameterException* if one of the parameter attributes is not initialized.

*InvalidOneTimeCodeException* if the one-time-code is expired, invalid or unknown.

*SecurityException* if the decryption result with the given parameter *public-key* and previous receive *community-key-B* from the request *authenticateCommunity* doesn't match with the own community-key.

## Service: "open Communication"

This service must be used to start a new communication session between two communities to authenticate with the returned JWT-Token further requests.

*Community-A* will communicate with *community-B*, then *community-A* has to encrypt with its own private key the community key of *community-B*, put its own community-key and the encrypted community-key of *community-B* as input data and start with *openCommunication* to get a valid JWT-Token from *community-B*.

In *community-B* the given "community-key-A" will be used to search in the internal community-list for the community-entry with this key. If it exists the corresponding public key is used to decrypt the given parameter "community-key-B". If the decrypted result is equals the own community-key a JWT-Token is generated with a preconfigered expiration time for a community-communication-session. The token is stored internally and returned as result for *community-A.*

### Route:

POST https://<Community-B_URL>/openCommunication

### Input-Data:

The requesting *community-A* will initialize these input data:

```
{
	"community-key-A" : "the community-key of the community-A"
	"community-key-B" : "the community-key of the community-B, encrypted by the private key of community-A"
}
```

### Output-Data:

```
{
	"token" : "valid JWT-Token with a preconfigered expiration time"
}
```

### Exceptions:

*MissingParameterException* if one of the parameter attributes is not initialized.

*UnknownCommunityException* if the community search with the value of parameter "community-key-A" could not find a matching community entry with this key.

*SecurityException* if the decrypted community-key-B will not match the own community key.

## Service: "Familiarize communities"

This request is used to exchange data between an existing and a new community. It will be invoked by the existing community, which received a valid *newCommunity*-Message from a new community during the federation process.

The invocation from the federation process gives the *Community-Key* and  *New_Community_URL* as input parameters, which are used to get the *Security-Token* from the SecurityService.

The exchanged data will be transferred as a *CommunityTO* transferobject in both directions as input and output parameter.

### Route:

POST https://<New_Community_URL>/familiarizeCommunity/`<security-accesstoken>`

### Input-Data:

The *existing community* will collect its own data and transferre it as

```
{
	CommunityTO {
		"key" : "community-key",
		"name" : "name of community",
		"description" : "description of community",
		"icon" : "picture of community",
		"birthday" : "day of community creation",
		"members" : "amount of members",
		"known_communities" : "amount of known communities",
		"trading_communities" : "amount of communities the members trade with"
	}
}
```

### Output-Data:

The *new community* will save the received data and returns its own collected data as

```
{
	CommunityTO {
		"key" : "community-key",
		"name" : "name of community",
		"description" : "description of community",
		"icon" : "picture of community",
		"birthday" : "day of community creation",
		"members" : "amount of members",
		"known_communities" : "amount of known communities",
		"trading_communities" : "amount of communities the members trade with"
	}
}
```

### Exceptions:

A *SecurityException* will be thrown, if the security-accesstoken is not valid or the if internal autorization rules like black-listings will not allow access.

In case the transferred community-key from the service-consumer will not match the previous authenticated community on service-provider the exception *UnknownCommunityException* will be thrown.

In case the transferred data can't be stored on service-provider the exception *WriteAccessException* will be thrown.

## Service: "request TradingLevel"

With this service a community can ask for a trading level with another community. The *community-A* invokes this service at *community-B* to offer the own  vision of trading with *community-B* by sending a TradingLevelTO with all the initialized Flags for future data exchanges. *Community-B* will store these data in the entry of *community-A* of its internal community list and mark it as an *open admin request* for trading level.  Such an *open admin request* will inform the administrator of *community-B*, because administrative interactions and decisions are necessary.

After the administrator of *community-B* has cleared all community internal aspects for the requested trading level with *community-A,* he will update the stored trading level flags for *community-A* and send this data by calling the service "confirm trading Level" of *community-A*.

### Route:

POST https://<Community-B_URL>/requestTradingLevel/`<security-accesstoken>`

### Input-Data:

```
{
	TradingLevelTO
	{
		"sendMemberDetails" : "Flag if community-A will send member details to the community-B"
		"receiveMemberDetails" : "Flag if community-A will receive member details from the community-B"
		"sendCoins" : "Flag if members of community-A are allowed to send coins to members of the community-B"
		"receiveCoins" : "Flag if members of community-A are allowed to receive coins from members of the community-B"
		"sendActivities" : "Flag if community-A will send open activities for confirmation to the community-B"
		"receiveActivities" : "Flag if community-A will receive open activities for confirmation from the community-B"
		"sendBackup" : "Flag if community-A will send own data to community-B as backup provider"
		"receiveBackup" : "Flag if community-A will receive data from community-B as backup provider"
	}
}
```

### Output-Data:

```
{
	"result" : "Message if the trading level request is accepted and stored or reasons, why the request is rejected"
}
```

### Exceptions:

A *SecurityException* will be thrown, if the security-accesstoken is not valid or the if internal autorization rules like black-listings will not allow access.

In case the transferred data can't be stored on service-provider the exception *WriteAccessException* will be thrown.

## Service: "confirm TradingLevel"

With this service a community sends his trading level confirmation to a previous *requestTradingLevel* invocation of another community. The *community-B* invokes this service at *community-A* to confirm the previous received and optionally updated vision of trading level data with *community-A*. This service sends the TradingLevelTO with the confirmed flags for future data exchanges between *community-A* and *community-B*. *Community-A* will store this data in the entry of *community-B* of its internal community list and mark it as a *confirmed admin request* for trading level.  The update of a *admin request* to state *confirmed* will inform the administrator of *community-A* to trigger administrative interactions and decisions.

If the confirmed trading level from *community-B* will match exactly the requested once of *community-A* the confirm request will response with an OK.

If the confirmed trading level from *community-B* can't be verified in *community-A* the confirm request will response with an ERROR.

If the confirmed trading level from *community-B* will differ, but acceptable under reservations for *community-A* the confirm request will response with an RESERVE. If one of the involved communities will change this, it has to start the tradinglevel handshake again.

If the confirmated trading level from *community-B* will absolutely not acceptable for *community-A* the confirm request will response with an REJECT and an additional roundtrip to deal a new tradinglevel between both communities will be necessary.

### Route:

POST https://<Community-A_URL>/confirmTradingLevel/`<security-accesstoken>`

### Input-Data:

The meaning of the *TradingLevelTO*-attributes in the confirmTradingLevel request must be interpreted from the confirmator point of view. For example "receiveBackup = TRUE" means *community-A* is ready to receive backup data from *community-B*, but *community-B* is as confirmator also prepared to send its data to *community-A* for backup.

```
{
	TradingLevelTO
	{
		"sendMemberDetails" : "Flag if community-A will send member details to the community-B"
		"receiveMemberDetails" : "Flag if community-A will receive member details from the community-B"
		"sendCoins" : "Flag if members of community-A are allowed to send coins to members of the community-B"
		"receiveCoins" : "Flag if members of community-A are allowed to receive coins from members of the community-B"
		"sendActivities" : "Flag if community-A will send open activities for confirmation to the community-B"
		"receiveActivities" : "Flag if community-A will receive open activities for confirmation from the community-B"
		"sendBackup" : "Flag if community-A will send own data to community-B as backup provider"
		"receiveBackup" : "Flag if community-A will receive data from community-B as backup provider"
	}
}
```

### Output-Data:

```
{
	"state" : "OK, ERROR, RESERVE, REJECT"
	"result" : "optional Message to explain the state in detail"
}
```

### Exceptions:

A *SecurityException* will be thrown, if the security-accesstoken is not valid or the if internal autorization rules like black-listings will not allow access.

## Service: "Member of Community"

Before user A can start any cross-community interactions with user B, this service api can be used to check if user B is a valid member of the other community.

### Route:

GET https://<Other_Community_URL>/memberOfCommunity/`<security-accesstoken>`

### Input-Data:

```
{
	userid : "user-id following the pattern <communityname@username"
}
```

### Output-Data:

the other community will search in its member list for the given userid. If the user could be found the output data will be returned, otherwise null.

```
{
	UserTO
	{
		"userid" : "user-id",
		"surename" : "surename of user",
		"name" : "name of user",
		"alias" : "alias name of user",
		"email" : "email address of user",
		"member-since" : "date of entry in community",
		"interacting-members" : "amount of members the user interact with",
		"interacting-communities" : "amount of communities the user interact with"
	}
}
```

### Exceptions:

A *SecurityException* will be thrown, if the security-accesstoken is not valid or the if internal autorization rules like black-listings will not allow access.

## Service: "Receive Coins"

With this service a cross community transaction can be done. In detail if *user-A* member of *community-sender* wants to send *user-B* member of *community-receiver* an amount of GDDs, the gradido server of *community-sender* invokes this service at the server of *community-receiver*.

The service will use a datatype Money as attribute in the input-data with the following attributes and methods:

```
Money
{
   Attributes:
	- Integer "amount" : "in Gradido-Cent and so without decimal places"
	- String "currencykey" : "unique currency key (communitykey) as the source community the coins are created"
   Methods:
	- toString() : "returns the amount as String with 2 decimal places and the Gradido-currencysymbol"
	- plus(Money m) : "evaluates if the currencykey of m equals the internal currencyKey and if yes adds the amount of m to the internal ammount, otherwise throws an WrongCurrencyException"
	- minus(Money m) : "evaluates if the currencykey of m equals the internal currencyKey and if yes substracts the amount of m from the internal ammount, otherwise throws an WrongCurrencyException
	- isSameCommunity(Money m) : "returns TRUE if the currencykey of m is equals the internal currencyKey, otherwise FALSE"
	- decay(Long sec) : "calculates the decay of the internal amount with the given duration in sec by:  amount - (amount x  0.99999997802044727 ^ sec)
}
```

### Route:

GET https://<receiver_community_URL>/receiveCoins/`<security-accesstoken>`

### Input-Data:

```
{
	TransactionTO
	{
		"sender-community" : "the key of the sender community",
		"sender-user" : "the user-id of the user, who sends the coins",
		"receiver-user" : "the user-id of the user, who will receive the coins",
		"money" : "the amount of coins and community-currency (community-key) as type Money",
		"reason for transfer" : "the transaction description",
		"timestamp of transfer" : "date and time of transaction"
	}
}
```

### Output-Data:

```
{
	"result" : "result of a valid receive coins processing (perhaps gratitude of user or community), otherwise exception"
}
```

### Exceptions:

*WrongCommunityException* in case the receiver community didn't know the sender community.

*UnknownUserException* in case the receiver community has no user with the given receiver-user-id.

*MissingTxDetailException* in case of missing one or more attributes in the TransactionTO,

*InvalidCurrencyException* in case the currency (community-key) doesn't match with the sender-community.

*InvalidTxTimeException* in case the timestamp of transfer is in the past.

*DenyTxException* in case the receiver community or user will not interact with the sender community or user.

## Service: "get Activity List"

This service can be used to read the activity list of another community. A community supports a list of activities a member can select to create gradidos for his actions. Each activity has an attribute *topic* on which the list reading can be filtered.

### Route:

GET https://<Other_Community_URL>/getActivityList/`<security-accesstoken>`

### Input-Data:

```
{
	"topics" : "list of topics the reading of the activity list should be filtered by"
}
```

### Output-Data:

```
{
	"activities" : "list of found activity, which match the input-data"
}
```

### Exceptions:

## Service: "get Clearing Activities"

This service can be used to read open activities of other community members, which are open to be cleared by other users. This base on the concept to clear at least two or more activities of other users before the amount of gradidos of the own activity can be credit on the own AGE account.

### Route:

GET https://<Other_Community_URL>/getClearingActivities/`<security-accesstoken>`

### Input-Data:

### Output-Data:

### Exceptions:

## Service: "Clear Activity"

This service can be used to clear an open activity, which was read by the service getClearingActivies before. This base on the concept to clear at least two or more activities of other users before the amount of gradidos of the own activity can be credit on the own AGE account.

### Route:

### Input-Data:

### Output-Data:

### Exceptions:
