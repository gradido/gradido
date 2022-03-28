# Federation

This document contains the concept and technical details for the *federation* of gradido communities. It base on the [ActivityPub specification](https://www.w3.org/TR/activitypub/ " ") and is extended for the gradido requirements.

## ActivityPub

The activity pub defines a server-to-server federation protocol to share information between decentralized instances and will be the main komponent for the gradido community federation.

At first we asume a *gradido community* as an *ActivityPub user*. A user is represented by "*actors*" via the users's accounts on servers. User's accounts on different servers corrsponds to different actors, which means community accounts on different servers corrsponds to different communities.

Every community (actor) has an:

* inbox: to get messages from the world
* outbox: to send messages to others

and are simple endpoints or just URLs, which are described in the *ActivityStream* of each *ActivityPub community*.

### Open Decision:

It has to be decided, if the Federation will work with an internal or with external ActivityPub-Server, as shown in the picture below:

![FederationActivityPub](./image/FederationActivityPub.png " ")

The Variant A with an internal server contains the benefit to be as independent as possible from third party service providers and will not cause additional hosting costs. But this solution will cause the additional efforts of impementing an ActivityPub-Server in the gradido application and the responsibility for this component.

The Varaint B with an external server contains the benefit to reduce the implementation efforts and the responsibility for an own ActivitPub-Server. But it will cause an additional dependency to a third party service provider and the growing hosting costs.



## ActivityStream

An ActivityStream includes all definitions and terms needed for community activities and content flow around the gradido community network.
