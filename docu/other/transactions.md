# Transactions

The different transaction types and how they are defined in protobuf. 
These form the lowest layer for Gradido.

## So far available

### Transaction

A container for all transactions.
Inspired by Hedera Hashgraph transactions.
Contains mainly the data for sorting in the block chain. 

```
message Transaction {
    uint64 	id = 1;
    TimestampSeconds received = 2;
    SignatureMap sigMap = 3;
    bytes txHash = 4;
    bytes bodyBytes = 5;
}
```

**id**: This is where Hedera's topicSequenceNumber comes in or, in mode without Hedera, an id that starts at 1 and increases by 1 with each transaction. 
**received**: Here comes the Hedera consensus timestamp or without Hedera the date + time when the transaction has reached the server that performs the sorting (single node).
**sigMap**: Contains all signatures and associated public keys. The signature is created from the public key's private key and bodyBytes.
**txHash**: Contains the topicRunningHash of Hedera or without Hedera the running hash of the sort server (Single Node). This is created from the hash of the last transaction, the id, the date and the serialized sigMap.
**bodyBytes**: Contains the serialized TransactionsBody

### TransactionBody

Contains data that applies to all transactions and the actual, specific transaction. 

```
message TransactionBody {
	string memo = 1; // max 150 chars
	TimestampSeconds created = 2;
	oneof data {
		StateCreateGroup createGroup = 6;
		StateGroupChangeParent groupChangeParent = 7;
		Transfer transfer = 8;
		TransactionCreation creation = 9;
	}
}
```

**memo**: comment or purpose, optional, maybe should be encrypted
**created**: Date + time of creation of the transaction
**data**: The specific transaction

### TransactionCreation

Creation transaction, here the Gradido creation takes place. 
Is most expensive in verification.
Among other things, it must be ensured that only a maximum of 1,000 GDD per month can be created, or a total of 3,000 per month distributed over all three recipients. 
The three recipients are the private account of the human being, the group account (i.e. public budget including health care) and the compensation and environmental fund belonging to the group. 
In addition, the target month for which a transaction was created may not be more than 3 months in the past. 

```
message TransactionCreation {
	ReceiverAmount receiverAmount = 1; // 40 Byte
	sint32 ident_hash = 2; // 4 Byte
	TimestampSeconds target_date = 3; // 8 Byte
	ReceiverAmount groupOfficialAmount = 4;
	ReceiverAmount groupEcoFondsAmount = 5;	
}
```

**receiverAmount**: Public-Key and GDD amount for the private account of the person
**ident_hash**: A short hash of the identification of the human being for a faster assignment
**target_date**: The target date for which month the money was created. 
**GroupOfficialAmount**: Public key and GDD amount for the public budget (usually 1,000 GDD)
**groupEcoFondsAmount**: Public-Key and GDD amount for the equalization and environment fund (usually 1,000 GDD)

### Transfer

Simple bank transfer to transfer GDD from one account to another. 
Can contain many senders and receivers, but the total balance of the senders must equal the total balance of the receivers. 
During the check only the senders have to be checked if they have enough GDD on their account at the time of the transaction with the transient. There are no negative GDD amounts.

```
message Transfer {
	repeated SenderAmount senderAmounts = 1;
	repeated ReceiverAmount receiverAmounts = 2; 
}
```

**SenderAmounts**: Contains one sender public key, the GDD amount that is sent and the account balance of the sender after sending. This way you don't have to search the whole block chain every time to calculate the balance, but only look up to the last transfer. 
**ReceiverAmounts**: Contains one receiver public key and the GDD amount received.

## To be defined

### Create Group
- Hedera Topic ID
- name
- root public-key of the new group and parent public-key

### Add to group
- previous group can be zero
- previous group is important to check at creation time whether the beneficiary 
has already received GDD for the corresponding month
- signed by account holder
- signed also by group admin or council according to the group configuration
- public-key of the group
- Root public-key of the human being
- Proof of identity
- public-key of the previous group

### Add subaccount

- name is only stored on Sign-up-Server
- name hash is used for key derivation
- name is unique per person
- root public-key of the account holder
- public-key of the new account
- hash of the name

### Add Email

- signed by account holder
- email hash
- public key of the account to which the e-mail should belong
- Sign-up-Server host + port

### Remove Email

- signed by account holder
- email hash

### Remove from group

- signed by account holder
- public-key of the group
- root public-key of the account holder
- public-key of the new group

### Add a council member

- signed by the new council member
- signed also by the group admin or the council member according to the configuration of the group
- public-key of the council member
- public-key of the group

### Remove a council member

- signed by the council member to be deleted 
- may only allowed if there is a minimum number of council members left to approve different tasks according to group configuration
- public-key of the council member
- public-key of the group

### Connect groups

- must be signed by both groups, according to the respective configurations
- only if two groups are connected, the individual members can send GDD to each other across the group boundaries. 
- by connecting, all subgroups (childs) are also considered to be connected to each other
- public-key of both groups

## Further

### configuration

Transactions to configure the council, i.e. how many people have to agree, or veto to perform a certain action, or only by the group admin. 
In addition the question which possibilities should there be?

Should it affect all actions equally, or should it be configurable differently from action to action? Maybe work with bit-operators to enable both?

### GDT

Transaction to credit the GDT, Central Instance, hard coded public key as signature?

Transaction that redeem GDT, 1:1 for Gradido but limited by certain rules to prevent inflation. But the rules are not yet fixed. Dynamic rules per group as configuration transactions?