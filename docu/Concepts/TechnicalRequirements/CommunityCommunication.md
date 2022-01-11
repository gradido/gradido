# Community Communication

This document contains the detailed descriptions of the public API of a community.

## Authentication and Autorization

Each public API of a community has to be authenticated and autorized before. This has to be done by following the *OpenID Connect* protocoll. To fullfil these security requirements a separate security service has to be part of the Gradido-application.

Following the link [OpenID Connect](https://www.npmjs.com/package/openid-client) there can be found a server-side OpenID relying party implementation for node.js runtime.

The authentication of communities base on the community-attributes *key* and *URL*, which where exchanged during the *federation process* before. In concequence a community that hasn't execute his federation well will be unknown for other communities and can't be authenticated and autorized for further API calls.

## Service: "Familiarize communities"

This request is used to exchange data between an existing and a new community. It will be invoked by the existing community, which received a valid *newCommunity*-Message from a new community during the federation process.

The invocation from the federation process gives the *Community-Key* and  *New_Community_URL* as input parameters, which are used to get the *Security-Token* from the SecurityService.

The exchanged data will be transferred as a *CommunityTO* transferobject in both directions as input and output parameter.

### Route:

POST https://<New_Community_URL>/familiarizeCommunity/`<security-accesstoken>`

### Input-Data:

The existing community will collect it own data an transferre it as

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

The new community will save the received data and returns its own collected data as

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
