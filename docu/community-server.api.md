# Community Server API

This document describes the community server API. The community server is written in PHP and mixes front with backend. Furthermore cakePHP and its auto-generated controller structure is used to access the API. This whole part of the Software will be subject to refactoring.

// TODO  In this examples I assume that you use gradido with or docker-compose build on your local maschine

## Error handling

// TODO

## Account overview
Returns the current account balance

### Request
`GET http://localhost/api/getBalance/`

### Response
Assuming: session is valid
Session will be searched in php session and GRADIDO_LOGIN cookie.
Additional session can be provided as GET-Parameter 
`GET http://localhost/api/getBalance/-127182`

```json
{
	"state":"success",
        "balance":1590.60,
        "decay":1587.38,
        "decay_date":"2021-04-16T11:47:21+00:00"
}
```

- `balance`   : balance describes gradido as float with max two decimal places
- `decay`     : balance with decay on it at the time in decay_date, so it is the precise balance of user at time of calling this function
- `decay_date`: date and time for decay amount, should be the time and date of function call 

## List transactions
List all transactions for logged in user

### Request
`GET http://localhost/api/listTransactions/[1]/[25]/[DESC]/[session_id]`
Parts symbolized by [] are optional
  - first parameter (1) is page for paging
  - second parameter (25) is count for paging
  - third parameter is ordering of resulting array, default is ASC
  - fourth parameter is session_id (session will be searched in php session and GRADIDO_LOGIN cookie and if not found use this )

#### Paging
With count you say how many entrys you like to have in the result.
With page you say on which page you are. 
For example 50 transactions are in db. 
With 1/25 you get the first 25 transactions (1-25)
With 2/20 you get the second 20 transactions (21-40)


### Response
Assuming: session is valid

```json
{
	"state":"success",
	"transactions": [
		{ 
			"type": "decay",
			"balance": "14.74",
			"decay_duration": "4 days, 2 hours ago",
                        "decay_start": 1618390948,
			"decay_end": 1618392526,
			"memo": ""
		},
		{
			"name": "Max Mustermann",
			"email": "Maxim Mustermann", 
			"type": "send",
			"transaction_id": 2,
			"date": "2021-02-19T13:25:36+00:00",
			"balance": 192.0,
			"memo": "a piece of cake :)",
			"pubkey": "038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7",
                        "decay": {
                                "balance": 309,
                                "decay_duration": "0 days, 00 hours, 26 minutes, 18 seconds",
                                "decay_start": 1618390948,
                                "decay_end": 1618392526
			},
		 },
		{ 
			"name": "Gradido Akademie",
			"type": "creation",
			"transaction_id": 10,
			"date": "2021-04-15T11:19:45+00:00",
			"target_date": "2021-02-01T00:00:00+00:00",
			"creation_amount": "1000.0",
			"balance": "1000.0",    
			"memo": "AGE Februar 2021" 
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
- `balance`: Gradido as float, max 2 Nachkommastellen, by creation balance after subtract decay amount
- `memo`: Details about transaction
- `decay_duration`: only for decay, time duration for decay calculation in english text 
- `creation_amount`: only for creation transaction, created account before decay
- `target_date`: only by creation transaction, target date for creation, start time for decay calculation (if < as global decay start time)

## List GDT Transactions
`GET http://localhost/api/listGDTTransactions/[1]/[25]/[DESC]/[session_id]`
Parts symbolized by [] are optional
  - first parameter (1) is page for paging
  - second parameter (25) is count for paging
  - third parameter is ordering of resulting array, default is ASC
  - fourth parameter is session_id (session will be searched in php session and GRADIDO_LOGIN cookie and if not found use this )

#### Paging
With count you say how many entrys you like to have in the result.
With page you say on which page you are. 
For example 50 transactions are in db. 
With 1/25 you get the first 25 transactions (1-25)
With 2/20 you get the second 20 transactions (21-40)

### Response
Assuming session was valid and gdt server was setup correct
{
	"state": "success",
	"count": 4,
	"gdtEntries": [
		{
			"id": 1,
			"amount": 99,
			"date": "2020-01-01T13:47:12+00:00",
			"email": "dariofrodo@gmx.de",
			"comment": "",
			"coupon_code": null,
			"gdt_entry_type_id": 1,
			"factor": 18,
			"amount2": 0,
			"factor2": 1,
			"gdt": 1782
		},
		{
			"id": 10,
			"amount": 100.12,
			"date": "2021-07-28T13:58:00+00:00",
			"email": "tester2@gmail.com",
			"comment": null,
			"coupon_code": "",
			"gdt_entry_type_id": 4,
			"factor": 15,
			"amount2": 0,
			"factor2": 0.05,
			"gdt": 75.09000000000002
		},
		{
			"id": 6,
			"amount": 1782,
			"date": "2021-07-30T13:21:46+00:00",
			"email": "dariofrodo@gmx.de",
			"comment": "Event 20-20",
			"coupon_code": null,
			"gdt_entry_type_id": 7,
			"factor": 0.2,
			"amount2": 0,
			"factor2": 1,
			"gdt": 356.40000000000006
		},
		{
			"id": 8,
			"amount": 10,
			"date": "2021-07-31T13:58:00+00:00",
			"email": "tester1@gmail.com",
			"comment": null,
			"coupon_code": "",
			"gdt_entry_type_id": 4,
			"factor": 15,
			"amount2": 0,
			"factor2": 0.05,
			"gdt": 7.5
		}
	],
	"gdtSum": 2220.99,
	"timeUsed": 0.012517929077148438
}

- `count`: Count of total gdt transactions for user
- `gdtEntries`: array with gdt entries, sort by date
  - `amount`: amount of payed money in euro, expect by gdt_entry_type_id = 7, then it is GDT Sum for Global Modificator time span
  - `date`: date of transaction with let create gdt transaction, date for picking factor and Global Modificator
  - `email`: email of user which has payed money, for gdt_entry_type_id = 4 it is the email of user who was recruited
  - `comment`: custom comment or Global Modificator name if gdt_entry_type_id = 7
  - `gdt_entry_type_id`: type of gdt entry
        (1) Form: Single GDT Entry directly created by admin via formular
        (2) CVS:  Created by importing a CVS-List with multiple GDT Entries
        (3) Elopage: Automatic created by Elopage Transaction (with revenue > 0 and payment state success)
        (4) Elopage Publisher: Automatic created by Elopage Transaction (with revenue > 0 and payment state success) for publisher
        (5) Digistore: Automatic created by Digistore Transaction 
        (6) CVS2: Created by importing a CVS-List with multiple GDT Entries, other format (used by Bernds old Accounting Tool)
        (7) Global Modificator: Global Modificator which grand percental bonus on GDT in possession in event time span
  - `factor`: Mulitplication factor for calculating gdt, change(d) over time
  - `amount2`: Bonus add amount for gdt, sparly used
  - `factor2`: Bonus mulitplication factor used by elopage publisher entry
  - `gdt`: GDT Value, calculatedt from other value: gdt = amount * factor * factor2 + amount2
- `gdtSum`: Total GDT Sum of user
- `timeUsed`: GDT Server isn't optimized, this is for easy checking if it is still fast enough


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
	"amount": 1000.0,
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
	"amount": 1000.0,
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
	"amount": 1000.0,
	"target_date":"2021-02-19T13:25:36+00:00", 
	"memo":"AGE",
	"auto_sign": true
}
```


- `session_id`: optional, only used if cookie GRADIDO_LOGIN not exist and no sesion_id in php session
- `email` or `username` or `pubkey`: used to identify how gets the gradidos (email and username are only aliases for pubkey)
- `amount`: gdd amount to transfer in gradido as float
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
	"amount": 100.0,
	"memo":"a gift",
	"auto_sign": true
}
```
#### OR
```json
{
	"session_id" : -127182,
	"username": "Maxi_786",
	"amount": 100.0,
	"memo":"a gift",
	"auto_sign": true
}
```
#### OR
```json
{
	"session_id" : -127182,
	"pubkey": "038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7",
	"amount": 100.0,
	"memo":"a gift",
	"auto_sign": true
}
```
- `session_id`: optional, only used if cookie GRADIDO_LOGIN not exist and no sesion_id in php session
- `amount`: amount to transfer as float
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


# Klicktipp

## Subscribe
Subscribe current logged in user to gradido newsletter

### Request
`GET http://localhost/api/klicktipp_subscribe/[session_id]`
Parts symbolized by [] are optional
  - session_id: session will be searched in php session and GRADIDO_LOGIN cookie and if not found use this

### Response
Assuming: session is valid

```json
{
    "state": "success",
    "redirect_url": "<redirect url from klicktipp>"
}
````

## Unsubscribe
Unsubscribe current logged in user from gradido newsletter

### Request
`GET http://localhost/api/klicktipp_unsubscribe/[session_id]`
Parts symbolized by [] are optional
  - session_id: session will be searched in php session and GRADIDO_LOGIN cookie and if not found use this

### Response
Assuming: session is valid

```json
{
    "state": "success"
}
````

