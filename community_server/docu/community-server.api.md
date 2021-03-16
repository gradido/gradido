
# community server api

In this examples I assume that you use gradido with docker-compose build on your local maschine

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
GET http://localhost/state-balances/ajaxListTransactions/-127182/
or 
GET http://localhost/state-balances/ajaxListTransactions/-127182/DESC 
to get transaction in descending order 

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

## Creation Transaction
Make a creation transaction
With new Option set in Login-Server: 
```ini
unsecure.allow_auto_sign_transactions = 1
```
transactions can be auto-signed directly with handing in transaction.
Normally a forwarding to login-server check transactions side is neccessary to minimize security risks.

POST http://localhost/transaction-creations/ajaxCreate
```json
{
	"session_id" : -127182,
	"email": "max.musterman@gmail.de",
	"amount": 10000000,
	"target_date":"2021-02-19T13:25:36+00:00", 
	"memo":"AGE",
	"auto_sign": true
}
```
return if everything is ok:
```json
{"state":"success", "timeUsed": 0.0122}
```
- timeUsed: time used for getting data from db in seconds, only for analyse backend performance

## Send Coins Transaction
Make a simple GDD Transaction, send Coins from one user to other. 
With new Option set in Login-Server: 
```ini
unsecure.allow_auto_sign_transactions = 1
```
transactions can be auto-signed directly with handing in transaction.
Normally a forwarding to login-server check transactions side is neccessary to minimize security risks.

POST http://localhost/transaction-send-coins/ajaxCreate
```json
{
	"session_id" : -127182,
	"amount": 2000000,
	"email": "max.musterman@gmail.de",
	"memo":"Thank you :)",
	"auto_sign": true
}
```
- amout: amount to transfer, 2000000 = 200,00 GDD
- email: receiver email address, must be differ from user email
- memo: Details about transaction 
- auto_sign: set to true to directly sign transaction if unsecure.allow_auto_sign_transactions = 1 is set

return if everything is ok:
```json
{"state":"success", "timeUsed": 0.0122}
```
- timeUsed: time used for getting data from db in seconds, only for analyse backend performance

Than the transaction was created on community server, send to login-server, signed (if unsecure.allow_auto_sign_transactions = 1 and auto_sign = true)
and send back to community server and put into db. 
After you get this answear you see the new transaction if you list transactions or call for the balance.

Without auto-sign the transaction is pending on login-server and waits for the user to review it at 
http://localhost/account/checkTransactions


