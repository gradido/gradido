# Community Server API

This document describes the community server API. The community server is written in PHP and mixes front with backend. Furthermore cakePHP and its auto-generated controller structure is used to access the API. This whole part of the Software will be subject to refactoring.

// TODO  In this examples I assume that you use gradido with or docker-compose build on your local maschine

## Error handling

// TODO

## Account overview
Returns the current account balance

### Request
`GET http://localhost/state-balances/ajaxGetBalance/-127182`

### Response
Assuming: session is valid

```json
{
	"state":"success",
	"balance":174500 
}
```

- `balance`: balance describes gradido cents which are 4 digits behind the separator. A balance value of 174500 equals therefor 17,45 GDD

## List transactions
List all transactions for logged in user

### Request
`GET http://localhost/state-balances/ajaxListTransactions/-127182/[DESC]`
(The `DESC` part is optional symbolized by [])

### Response
Assuming: session is valid

```json
{
	"state":"success",
	"transactions": [
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

- `transactionExecutingCount`: how many transaction for this user currently pending and waiting for signing
- `count`: sum of finished transactions user is involved
- `gdtSum`: sum of gdt of user in cent with 2 places (Nachkommastellen)
- `timeUsed`: time used for getting data from db in seconds, only for analyse backend performance

Transaction:
- `name`: name of other involved party or empty if unknown (if other party don't belong to group)
  - if type is send, name is name of receiver 
  - if type is receive, name is name of sender 
  - if type is creation currently I use a static string ("Gradido Akademie)
- `email`: optional, only if type is send or receive and other user is known
- `pubkey`: optional, only if type is send or receive and other user isn't known, hexadecimal representation of 32 Byte public key of user [0-9a-f]
- `type`: type of transaction
  - `creation`: user has get gradidos created
  - `send`: user has send another user gradidos
  - `receiver`: user has received gradidos from another user
- `transaction_id`: id of transaction in db, in stage2 also the hedera sequence number of transaction 
- `date`: date of ordering transaction (booking date)
- `balance`: Gradido Cent, 4 Nachkommastellen (2 Reserve), 1920000 = 192,00 GDD
- `memo`: Details about transaction

## Creation transaction
Makes a creation transaction to create new Gradido

This assumes you have set 
```ini
unsecure.allow_auto_sign_transactions = 1
```
in the Login-Server, so transactions can be auto-signed directly with handing in the transaction.
Normally a forwarding to login-server check transactions side is necessary to minimize security risks. // TODO this is not documented

### Request
`POST http://localhost/api/createCoins`

with 

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
#### OR
```json
{
	"session_id" : -127182,
	"username": "Maxi_786",
	"amount": 10000000,
	"target_date":"2021-02-19T13:25:36+00:00", 
	"memo":"AGE",
	"auto_sign": true
}
```
#### OR
```json
{
	"session_id" : -127182,
	"pubkey": "038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7",
	"amount": 10000000,
	"target_date":"2021-02-19T13:25:36+00:00", 
	"memo":"AGE",
	"auto_sign": true
}
```


- `session_id`: optional, only used if cookie GRADIDO_LOGIN not exist and no sesion_id in php session
- `email` or `username` or `pubkey`: used to identify how gets the gradidos (email and username are only aliases for pubkey)
- `amount`: gdd amount to transfer in gradido cent (10000000 = 1000,00 GDD)
- `memo`: text for receiver, currently saved as clear text in blockchain
- `auto_sign`: if set to true, transaction will be directly signed on login-server and proceed if needed signs are there
             if set to false, transaction must be signed after on `http://localhost/account/checkTransactions`

### Response
In case of success returns:

```json
{
	"state":"success",
	"timeUsed": 0.0122
}
```

- `timeUsed`: time used for getting data from db in seconds, only for analyse backend performance

## Send transaction
Make a simple GDD Transaction, send Coins from logged in user to another.

This assumes you have set 
```ini
unsecure.allow_auto_sign_transactions = 1
```
in the Login-Server, so transactions can be auto-signed directly with handing in the transaction.
Normally a forwarding to login-server check transactions side is necessary to minimize security risks. // TODO this is not documented

### Request
`POST http://localhost/api/sendCoins`

with

```json
{
	"session_id" : -127182,
	"email": "max.musterman@gmail.de",
	"amount": 1000000,
	"memo":"a gift",
	"auto_sign": true
}
```
#### OR
```json
{
	"session_id" : -127182,
	"username": "Maxi_786",
	"amount": 1000000,
	"memo":"a gift",
	"auto_sign": true
}
```
#### OR
```json
{
	"session_id" : -127182,
	"pubkey": "038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7",
	"amount": 1000000,
	"memo":"a gift",
	"auto_sign": true
}
```
- `session_id`: optional, only used if cookie GRADIDO_LOGIN not exist and no sesion_id in php session
- `amount`: amount to transfer, 2000000 = 200,00 GDD
- `email` or `username` or `pubkey`: used to identify how gets the gradidos (email and username are only aliases for pubkey)
- `memo`: text for receiver, currently saved as clear text in blockchain
- `auto_sign`: if set to true, transaction will be directly signed on login-server and proceed if needed signs are there
               if set to false, transaction must be signed after on `http://localhost/account/checkTransactions`


### Response
In case of success returns:

```json
{
	"state":"success",
	"timeUsed": 0.0122
}
```

- `timeUsed`: time used for getting data from db in seconds, only for analyse backend performance

### Process

Once the transaction was created on community server, send to login-server, signed (if unsecure.allow_auto_sign_transactions = 1 and auto_sign = true) and then send back to community server to be finally put into the database.

After you get this answer you see the new transaction if you request the transaction list or call for the balance.

// TODO balance and at least last transaction must be returned with the call itself

Without auto-sign the transaction is pending on the login-server and waits for the user to review it at `http://localhost/account/checkTransactions`

// TODO how is this more secure?
// TODO Is this in line with our usability goals?
// TODO Should this not be handled client side?


