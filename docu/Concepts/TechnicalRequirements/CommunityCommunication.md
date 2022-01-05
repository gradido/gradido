# Community Communication

This document contains the detailed descriptions of the public API of a community.

## Authentication and Autorization

Each public API of a community has to be authenticated and autorized before. This has to be done by following the *OpenID Connect* protocoll. To fullfil these security requirements a separate security service has to be part of the Gradido-application. 

Following the link [OpenID Connect](https://www.npmjs.com/package/openid-client) there can be found a server-side OpenID relying party implementation for node.js runtime.

The authentication of communities base on the community-attributes *key* and *URL*, which where exchanged during the federation process before. In concequence a community that hasn't execute his federation well will be unknown for other communities and can't be authenticated and autorized for further API calls.


## Familiarize communities

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

In case the transferred community-key from the service-consumer will not match the previous authenticated community on service-provider the exception *UnknownCommunityException* will be thrown.

In case the transferred data can't be stored on service-provider the exception *WriteAccessException* will be thrown.
