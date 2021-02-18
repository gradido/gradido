# login server api

Gradido js-Frontend vereinfachte Zusammenarbeit mit Login-Server und Community-Server

Es ist mit einer Zusatz-Option möglich das Login und Registrieren via ajax-Request passiern kann.
Dafür muss in der Login-Server Config 

unsecure.allow_passwort_via_json_request   = 1 

gesetzt sein. 

In diesen Beispielen gehe ich jetzt davon aus, das du das gesamte Gradido Projekt mit Docker gebaut hast und auf dem lokalen Rechner laufen lässt.

Login
Einloggen über: 


# unsecureLogin

POST http://localhost/login_api/unsecureLogin 
```
data: {"username": "<username>", "password": "<password>"}
```

Wenn alles okay ist erhältst du:
```
{"state":"success", "session_id": <session_id as int>, "clientIP":"<client ip of user>",
  "user": {
	"created": <timestamp in seconds>,
	"disabled": <true|false>, // login will fail if user is disabled 
	"email": "<email>",
	"email_checked": <true|false>, // true if user has already clicked on email verification code               link in his emails
	"first_name": "<first nme>",
	"group_alias": "<group alias, z.B. gdd1>",
	"ident_hash": <int, currently not used>,
	"last_name": "<last name>",
	"public_hex": "<64 character hex (contain only a-f and 0-9)>",
	"role": "<admin|none>", // should be only valid for login-server 
	"username": "<currently not used>",
	"balance": <Gradido Cent, 4 Nachkommastellen (2 Reserve)>, // 174500 = 17,45 GDD
	"id": <id in login-server db>,
	"errorCount": <errors occured in this session, should be normally 0>
}}
```

Anmelden
Registrieren kannst du einen neuen Benutzer mit: 


## createUser

POST http://localhost/login_api/createUser
```
data: {"email":"<email>", "first_name":"<first name>", "last_name":"<last name>" ,
          "emailType": 2, "password":"<password>"}
```

Wenn alles okay ist erhältst du:
```
{"state":"success"}
```

Dann wurde für den Benutzer ein neues Konto angelegt, seine Schlüssel generiert und ihm eine Bestätigungs-Email geschickt. 


## Logout

Abmelden
POST http://localhost/login_api/logout
```
data: {"session_id": <session_id as int>}
```

Wenn alles okay ist erhältst du:
```
{"state":"success"}
```