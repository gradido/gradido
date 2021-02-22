# community server api

In this examples I assume that you use gradido with or docker-compose build on your local maschine

## Konto Overview
return current account balance

GET http://localhost/state-balances/ajaxGetBalance/-127182

If session is valid, return:
```json
{"state":"success","balance":174500}
```
- balance: Gradido Cent, 4 Nachkommastellen (2 Reserve), 174500 = 17,45 GDD

## List Transactions
List all transactions from logged in user, currently without paging 
Ajax:
GET http://localhost/state-balances/ajaxListTransactions/-127182

Antwort: 
Wenn alles okay: 
```json
{"state":"success", "transactions": 
	[
		{
			"name": "Max Mustermann",
			"email": "Maxim Mustermann", 
			"type": "send",
			"transaction_id": 2,
			"date": "2021-02-19T13:25:36+00:00",
			"balance": 1920000,
			"memo": "a piece of cake :)",
			"pubkey": "038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7"
		 }
	],
	"transactionExecutingCount": 0,
	"count": 1,
	"gdtSum": 0,
	"timeUsed": 0.04562687873840332
}
```

- name: name of other involved party or empty if unknown (if other party don't belong to group)
  - if type is send, name is name of receiver 
  - if type is receive, name is name of sender 
  - if type is creation currently I use a static string ("Gradido Akademie)
- email: optional, only if type is send or receive and other user is known
- pubkey: optional, only if type is send or receive and other user isn't known 
- type: type of transaction
  - creation: user has get gradidos created
  - send: user has send another user gradidos
  - receiver: user has received gradidos from another user
- transaction_id: id of transaction in db, in stage2 also the hedera sequence number of transaction 
- date: date of ordering transaction (booking date)
- balance: Gradido Cent, 4 Nachkommastellen (2 Reserve), 1920000 = 192,00 GDD
- memo: Details about transaction
- pubkey: optional, if other party isn't known, hexadecimal representation of 32 Byte public key of user [0-9a-f]

- transactionExecutingCount: how many transaction for this user currently pending and waiting for signing
- count: sum of finished transactions user is involved
- gdtSum: sum of gdt of user in cent with 2 places (Nachkommastellen)
- timeUsed: time used for getting data from db in seconds, only for analyse backend performance