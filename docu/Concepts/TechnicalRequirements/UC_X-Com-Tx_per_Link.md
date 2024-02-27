# UseCase: Cross Community Transactions per Link

With the feature X-Com-Transactions to send an amount of gradidos to an user of a foreign community the requirement to support this X-Com gradido transfer per link will become more significance.

The focus of this document is to describe the technical aspects from the recipient point of view. To get information about this topic from the sender point of view please take a look in the document [UseCase Send Users Gradido](https://github.com/gradido/gradido/blob/master/docu/Concepts/BusinessRequirements/UC_Send_Users_Gradido.md).

## Disbursement process

The following picture gives a first impression how the disbursement process will be started by activation of a redeem-link:

![UC_Send_Users_Gradido_StartValutierung.png](./image/UC_Send_Users_Gradido_StartValutierung.png)

### Redeem-Link Validation

After a user has created a `redeem-Link` to send an other user an amount of gradidos the recipient of this link can activate it during the next 14 days after creation day. The redeem-link is build with several technical details following the pattern: `community-url of sender-community`/redeem/`code`

example: `https://gdd.gradido.net`/redeem/`3a5839be29f1`

In consequence how the transaction-link is created the recipient will be routed on activation to the community of the sender.

With receiving a redeem-link request the payload of this link will be validated. If the code of this link exists in database, the associated transaction is still open and the expiration time is not exceeded, the community will start the _disbursement process_.

### Identification of the recipient

At this point of time the recipient of the redeem-link is totaly unkown, which means it is not clear if he will be a user of the same community as the sender or be a user of a foreign community, if the recipient still has a gradido account or if he still have to register as a new gradido user.

In consequence the first page the user will see must offer a community-selection. This UI-component will present a list of all known, verified and authenticated communities the sender's home-community is connected over the federation.

With the selection of a community from this list the user must confirm his selection and will be routed on a following page for login or registration. But before this next-page-routing the system will check the community-selection if the recipient-community will be the same as the sender-community or a foreign-community.

In case of the same community there are no additional system actions for processing the transaction as a local send-coin-transaction necessary.

In case the user has selected a foreign community the system will create a new token, which contains all necessary information to start a _disbursement process_ from the foreign community after the user has done a successful login or registration there. The payload of this token must contain

* the url of the sender-community
* the community-uuid of the sender-community
* the gradidoID of the sender
* the code of the redeem-link

The whole token have to be decrypted by the publicKey of the recipient-community and signed by the privateKey of the sender-community.
