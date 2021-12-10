# Interface 
## Pack Transaction
Pack Transaction as protobuf Array, ready for signing
The returned bodyBytes are in base64 format. 
They must be at first unpacked in a binary array.
Than they can be signed with sodium.crypto_sign_detached (https://sodium-friends.github.io/docs/docs/signing#crypto_sign_detached)
m ist the binary body bytes buffer
sk is the private key of the user

currently every transaction need only one signature but this maybe change in future,
or new transaction types added which need more than one signature

After signing sendTransactionIota can be called for every transaction which consists of bodyBytes and a signature public key pair list
and with the corresponding group alias

For transactions which belong to two blockchains actually two transactions are generated and need to be signed

### Request
`POST http://localhost/login_api/packTransaction`

#### Transfer
Needed to be signed from sender user 

```json
{	
	"transactionType": "transfer",
	"created":"2021-01-10 10:00:00",
    "memo": "Danke für deine Hilfe!",
	"senderPubkey":"131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
	"recipientPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
	"amount": 1000000,
}
```

#### Cross-Group Transfer
Needed to be signed from sender user 

```json
{	
	"transactionType": "transfer",
	"created":"2021-01-10 10:00:00",
    "memo": "Danke für deine Hilfe!",
	"senderPubkey":"131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
	"recipientPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
	"amount": 1000000,
	"senderGroupAlias": "gdd1",
	"recipientGroupAlias":"gdd2"
}
```

#### Creation
Needed to be signed from another user from this group which isn't the recipient 
After implementing roles on blockchain, the signing person need to have the correct role for this

```json
{	
	"transactionType": "creation",
	"created":"2021-01-10 10:00:00",
    "memo": "AGE September 2021",
	"recipientPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
	"amount": 10000000,
	"targetDate": "2021-09-01 01:00:00",
}
```

#### Group Member Add
Needed to be signed from the user to add

```json
{
	"transactionType": "groupMemberUpdate",
	"created":"2021-01-10 10:00:00",
	"userRootPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
}
```

#### Group Member Move
Needed to be signed from the user to move

```json
{
	"transactionType": "groupMemberUpdate",
	"created":"2021-01-10 10:00:00",
	"userRootPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
	"currentGroupAlias": "gdd1",
	"newGroupAlias":"gdd2"
}
```

- `transactionType`: type of transaction, currently available: transfer, creation and groupMemberUpdate
- `created`: creation date of transaction
- `memo`: memo for transfer and creation transaction, should be encrypted for example with the sender private key and the recipient public key with sodium.crypto_box_easy maybe with creation date as nonce
		https://sodium-friends.github.io/docs/docs/keyboxencryption#crypto_box_easy
- `senderPubkey`: sender account public key in hex format, need at least `amount` gradidos on this account
- `recipientPubkey`: recipient account public key in hex format, must be added first with a groupMemberUpdate transaction to his or her blockchain
- `amount`: amount of gradido as integer with 4 after comma
- `senderGroupAlias`: only needed for cross group transactions, group alias from sender group
- `recipientGroupAlias`: only needed for cross group transactions, group alias from recipient group
- `currentGroupAlias`: only needed for moving user, group alias from user from where

### Response
For Local Transactions which happen only on this group

```json
{
	"state":"success",
	"bodyBytesBase64": "CAEStwEKZgpkCiDs2zemYO1PxD1Odwh5YxyUmDp+lyxgVmiQgiFdPLUahRJAvyYRVASJNvyYiTAT2D8t6QtVgekqnsPIJRAx6jG8tEqxdzwKGg/Jm0gatdY1Ix7DGbHMBRw/9CtoXQXueqqDChJNChBBR0UgT2t0b2JlciAyMDIxEgYIuMWpjQY6MQonCiAdkWfcgRcDfCIg+GbikK6U9Fp4WMTGtAxF7RRdvhisSxCA2sQJGgYIgJ/ZigYaBgjGxamNBiABKiCijBRel5hudg5iZqfeQxjzIMhnOJA+tmHmloMVW+snjTIEyWETAA==",	
}
```

For Cross Group Transactions (and for moving user)
This return at least two transaction, one for every chain involved in this transaction,
inclusive groupAlias from the target blockchain for this transaction

```json
{
	"state":"success",
	"transactions" : 
	[
		{
			"groupAlias": "gdd1", 
			"bodyBytesBase64": "CAUS7QEKZgpkCiDRCqrSJQDyMPnshI+UbSnVU22w+98UJsQ5qwh10VbNCxJAPvxMj7GKxhUf6OfzKRwmZthxXroj/GSLWizDWURDNtL4E8Ez1zqOu9d/ytdZEtY/nQr+1jbLvtsJQ6dfAaDAARKCAQoRVGVzdCBjcm9zcyA0LjEyIDESBgjR366NBjJlEmMKSgomCiDRCqrSJQDyMPnshI+UbSnVU22w+98UJsQ5qwh10VbNCxCI7isSIOzbN6Zg7U/EPU53CHljHJSYOn6XLGBWaJCCIV08tRqFGgdzdGFnaW5nIgwI0d+ujQYQ+LzOwQMaBgjc366NBiABKiBlPZP6a69Kz4JZ87cDcXBARbMXpesRMdDrh5V1PSWRLzIEGIMTAA=="
		},
		{
			"groupAlias": "gdd2",
			"bodyBytesBase64": "CAoS8AEKZgpkCiDRCqrSJQDyMPnshI+UbSnVU22w+98UJsQ5qwh10VbNCxJAf6TTHmhDdP2VoN2eFmMhUHHjSg8ZHsfG2aEgRKVEPwCEVv2NFeSqbYSCbt8xVP16xu2hrEg87qCXq1AJBX7aCBKFAQoRVGVzdCBjcm9zcyA0LjEyIDESBgjS366NBjJoGmYKSgomCiDRCqrSJQDyMPnshI+UbSnVU22w+98UJsQ5qwh10VbNCxCI7isSIOzbN6Zg7U/EPU53CHljHJSYOn6XLGBWaJCCIV08tRqFGgpweXRoYWdvcmFzIgwI0d+ujQYQ+LzOwQMaBgjm366NBiABKiAnFsNGldvfB2QaenWbfdtiCBQ399e81il6VV0kL6CHijIEGYMTAA=="
		}
	]
}
```

## Send Transaction
### Request
`POST http://localhost/login_api/sendTransactionIota`

with 
```json 
{
	"bodyBytesBase64": "CAEStwEKZgpkCiDs2zemYO1PxD1Odwh5YxyUmDp+lyxgVmiQgiFdPLUahRJAvyYRVASJNvyYiTAT2D8t6QtVgekqnsPIJRAx6jG8tEqxdzwKGg/Jm0gatdY1Ix7DGbHMBRw/9CtoXQXueqqDChJNChBBR0UgT2t0b2JlciAyMDIxEgYIuMWpjQY6MQonCiAdkWfcgRcDfCIg+GbikK6U9Fp4WMTGtAxF7RRdvhisSxCA2sQJGgYIgJ/ZigYaBgjGxamNBiABKiCijBRel5hudg5iZqfeQxjzIMhnOJA+tmHmloMVW+snjTIEyWETAA==",
	"signaturePairs": [
		{
			"pubkey": "ecdb37a660ed4fc43d4e770879631c94983a7e972c6056689082215d3cb51a85",
			"signature": "c1b2e8077c206bf78aeaefbdcdfe8a5ae32ddf9adca95ba1f5a93e885b7b3a00f224fe1fb0ea491d20966f7336fd90479c792432dc94b8c8b83dd00510fca508"
		}
	],
	"groupAlias":"gdd1"
}
```

### Response
```json 
{
	"state": "success",
	"iotaMessageId": "acc2ad26e987a787145d20d61a140606b45bfc0857cff5391c784937a5430108"
}
```