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
{"state":"success", "session_id": -127182, "clientIP":"52.68.96.58"}
```
- clientIP: should be the same as where the js-client is running, else maybe a man-in-the-middle attacks is happening or 
nginx was wrong configured.
- session_id: can be also negative

Anmelden
Registrieren kannst du einen neuen Benutzer mit: 


## createUser

POST http://localhost/login_api/createUser
```json
data: {
	"email":"max.musterman@gmail.de",
	"first_name":"Max",
	"last_name":"Musterman" ,
    "emailType": 2,
	"password":"123abcDE&"
	"login_after_register":true
	}
```

- emailType: control email-text sended with email verification code
  - 2: default, if user has registered directly
  - 5: if user was registered by an admin 
- login_after_register: if set to true auto-login after create user was successfull, means session cookie is set and session_id returned

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

## Update User Data
Update first name, last name, user language and enable/disable user 
Language currently supported de and en 
User will be disabled if he wants a account delete but has transactions. 
Until transactions are saved in real blockchain, we need this data because the public key
is in db only saved in state_users so we wenn delete this entry, validating all transactions not longer possible.
Disabled User cannot login and cannot receive transactions. 
In update Object only one of the sets needs to be there.

POST http://localhost/login_api/updateUserInfos
```json 
{"session_id": -127182, "email": "max.musterman@gmail.de", "update": {
	"User.first_name": "Dario",
	"User.last_name" : "Rekowski",
	"User.disabled": 0,
	"User.language": "de"
}}
```
also valid 
```json 
{"session_id": -127182, "email": "max.musterman@gmail.de", "update": {
	"User.last_name" : "Rekowski"
}}
```
	