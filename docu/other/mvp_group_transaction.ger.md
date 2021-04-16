# MVP transaction from one group to another

## All the things that are needed if I it should go according to my plan

### Login-Server: 

- [x] Create user
- [x] Check user email 
- [x] Generate key pair for users 
- [x] Private Key encrypted with user save password 
- [-] Store passphrase encrypted with Server Admin Key, if user forgets password (currently stored unencrypted) 
- [ ] Transaction to associate users with group
- [ ] Create transaction that links email to user-account/key pair
- [-] Create group and Hedera Topic and communicate to the node server 
- [ ] Send users to the right community server depending on the group
- [x] enter existing Hedera account optionally encrypted/unencrypted
- [-] create new Hedera account as payment account for transactions
- [ ] implement cross-group transaction missing

### Community-Server

- [x] Gradidos creation by privileged person
- [x] general transfer interface
- [x] Listing transactions
- [ ] Friend with other group (transaction on block chain) 
- [ ] View current configuration of other groups
- [ ] public key of a user of another group to find the e-mail
- [ ] regular querying of transactions from one or more node servers
- [ ] implement cross-group transaction

### Node-Server

- Create blockchains for each group/topic
- receive and store Hedera's transactions per group/topic
- verify transactions
- Query for users of another group via email hash
- Providing an interface for the Community Server to query the transactions
- Synchronization with other node servers
- Find other node servers via special Hedera transaction

Design the format of the cross-group transaction in detail, or check Paul's variant to see if it is suitable

## A variant for quick success

### Login-Server
- Install cross-group transaction
- Save your main Hedera account as a payment account unencrypted, I would only provide my Testnet account for this

### Communtiy-Server
- manual querying of transactions from the node server by button
- Implement cross-group transaction
- Save login server of other groups in config
- Request for publickey to e-mail simply to all known login servers with existing interface

### Node-Server
- Providing an interface for the community server to query the transactions
- Manual creation of the group (e.g. json-config)


- Creating a topic with Paul's python script
- Design the format of the cross-group transaction in detail, or check Paul's variant to see if it is suitable
- Set up a separate login server for each group
- Node servers must not fail, as Hedera saves each message for a maximum of 10 minutes