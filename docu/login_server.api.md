# login server api

Gradido js-Frontend vereinfachte Zusammenarbeit mit Login-Server und Community-Server

Es ist mit einer Zusatz-Option möglich das Login und Registrieren via ajax-Request passiern kann.
Dafür muss in der Login-Server Config 

```ini
unsecure.allow_passwort_via_json_request   = 1 
```

gesetzt sein. 

mit:
```ini
unsercure.allow_cors_all = 1
```
Wird bei allen JSON-Requests zum Header: Access-Control-Allow-Origin:* 
hinzugefügt. 

In diesen Beispielen gehe ich jetzt davon aus, das du das gesamte Gradido Projekt mit Docker gebaut hast und auf dem lokalen Rechner laufen lässt.

Login
Einloggen über: 


## unsecureLogin

POST http://localhost/login_api/unsecureLogin 
```json
data: {"email": "max.musterman@gmail.de", "password": "123abcDE&"}
```

Wenn alles okay ist erhältst du zum Beispiel:
```json
{"state":"success", "session_id": -127182, "clientIP":"52.68.96.58",
  "user": {
	"created": 1293872400,
	"disabled": false, 
	"email": "max.musterman@gmail.de",
	"email_checked": true,
	"first_name": "Max",
	"group_alias": "gdd1",
	"ident_hash": 1829912,
	"public_hex": "c6e7d6a697fa74d6c247580edf1546989d43487575e21e398abe3cc2094bd63e",
	"last_name": "Musterman",
	"role": "none",
	"username": "",
	"balance": 174500,
	"id": 1,
	"errorCount": 0
}}
```
- clientIP: should be the same as where the js-client is running, else maybe a man-in-the-middle attacks is happening or 
nginx was wrong configured.
- session_id: can be also negative
- created: unix timestamp in seconds
- disabled: if set to true, login and every transaction must fail. Currently used if use would like to have there account deleted. 
- email_checked: true if user has already clicked on email verification code link in his emails, needed for tranactions
- ident_hash: string hash from email, used for speed up creation validation
- public_hex: hexadecimal representation of 32 Byte public key of user [0-9a-f]
- role: not intended for future use, just ignore, login-server admin will be independently from community-server admin 
- username: for later use 
- balance: Gradido Cent, 4 Nachkommastellen (2 Reserve), 174500 = 17,45 GDD
- id: login-server user id, only needed for debugging
- errorCount: errors occured in this session, should be normally 0

Anmelden
Registrieren kannst du einen neuen Benutzer mit: 


## createUser

POST http://localhost/login_api/createUser
```json
data: {"email":"max.musterman@gmail.de", "first_name":"Max", "last_name":"Musterman" ,
          "emailType": 2, "password":"123abcDE&"}
```

- emailType: control email-text sended with email verification code
  - 2: default, if user has registered directly
  - 5: if user was registered by an admin 

Wenn alles okay ist erhältst du:
```json
{"state":"success"}
```

Dann wurde für den Benutzer ein neues Konto angelegt, seine Schlüssel generiert und ihm eine Bestätigungs-Email geschickt. 


## Logout

Abmelden
POST http://localhost/login_api/logout
```json
data: {"session_id": -127182}
```

Wenn alles okay ist erhältst du:
```json
{"state":"success"}
```