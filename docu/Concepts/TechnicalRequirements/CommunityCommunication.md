# Community Communication

This document contains the detailed descriptions of the public API of a community.


## Introduction between existing and new community

This request is used to exchange data between an existing and a new community. It will be invoked by the existing community, which received a valid newCommunity-Message from a new community during the federation process.

POST http://<New_Community_URL>/introduce

```
{
	"key" : "community-key",
	"name" : "name of community",
	"description" : "description of community",
	"icon" : "picture of community",
	"birthday" : "day of community creation",
	"members" : "amount of members",
	"known_communities" : "amount of known communities",
	"trading_communities" : "amount of communities the members trade with"
}
```

The new community will save the data and returns the following

```
{
	"key" : "community-key",
	"name" : "name of community",
	"description" : "description of community",
	"icon" : "picture of community",
	"birthday" : "day of community creation",
}
```
