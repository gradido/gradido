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
Wird bei allen JSON-Requests zum Header hinzugefügt:
- Access-Control-Allow-Origin:* 
- Access-Control-Allow-Headers: "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"


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

Update password can only be used if in Login-Server config:
```ini 
unsecure.allow_passwort_via_json_request = 1
```
is set 

POST http://localhost/login_api/updateUserInfos
```json 
{"session_id": -127182, "email": "max.musterman@gmail.de", "update": {
	"User.first_name": "Max",
	"User.last_name" : "Musterman",
	"User.disabled": 0,
	"User.language": "de"
	"User.password": "1234"
  }
}
```
also valid 
```json 
{"session_id": -127182, "email": "max.musterman@gmail.de", "update": {
	"User.last_name" : "Musterman"
  }
}
```

It returns if everything is okay
```json 
{"state":"success", "valid_values": 4, "errors":[]}
```
- valid_values: should contain count of entrys in update if no error occured (User.password will not be counted)
- errors: contain on error string for every entry in update, which type isn't like expected 
  - password: 
    - "new password is the same as old password": no change taking place
	- "password changed, coludn"t load private key for re-encryption": password was successfully changed, is at the moment only a warning as long as user_backups are unencrypted, safe to ignore
	- "stored pubkey and private key didn't match": error by re-encryption keys, no changes saved 
	- "User.password isn't valid": if password validation failed, followed by reasons why (additional array in array)
	  example: 
	  ```json 
	  {"errors":[
		"User.password isn't valid",[
			"Passwort: Dein Passwort ist zu kurz!\n",
			"Passwort: Bitte gebe ein g&uuml;ltiges Password ein mit mindestens 8 Zeichen, Gro&szlig;- und Kleinbuchstaben, mindestens einer Zahl und einem Sonderzeichen (@$!%*?&+-_) ein!\n" 
	    ]
	   ],
	   "state":"success",
	   "valid_values":0
	  }
      ```
## Retrieve User Data
Retrieve different user data, in ask only one field is needed, or every possible combination 
from the available fields

Normal User can only retrieve data for himself, admins (login-server admin) can retrieve data from every user 
Email is also the email address of user from which data are asked 

POST http://localhost/login_api/getUserInfos 
```json 
{"session_id": -127182, "email": "max.musterman@gmail.de", "ask": [
	"EmailVerificationCode.Register",
	"loginServer.path",
	"user.pubkeyhex",
	"user.first_name",
	"user.last_name",
	"user.disabled",
	"user.email_checked",
  ]
}
```	
returns if no error occured:
```json 
{"state": "success", "userData": { 
	"EmailVerificationCode.Register": "2718271129122",
	"pubkeyhex": "131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
	"first_name": "Max",
	"last_name": "Musterman",
	"disabled": 0,
	"email_checked": 1
  }, "server": {
    "loginServer.path": "http://localhost/account"
  },
  "errors": []
}
```

Return only the fields which are defined in ask 
- EmailVerificationCode.Register: return the email verification code for check email (create one if none exist), work only if logged in user is admin and the email isn't from him 
- loginServer.path: the redirect path to login-server, for example for login with login-server html frontend 
- user.pubkeyhex: public key of user in hex-format
- user.first_name: first name of user 
- user.last_name: last name of user 
- user.disabled: User will be disabled if he wants a account delete but has transactions. 
Until transactions are saved in real blockchain, we need this data because the public key
is in db only saved in state_users so we wenn delete this entry, validating all transactions not longer possible.
Disabled User cannot login and cannot receive transactions. 
- email_checked: If user has clicked on link in verification email (register), can only transfer gradidos if email_checked is 1

- errors: array of strings if error occure 

## Login by Email Verification Code
Used for replace http://localhost/account/checkEmail 
Can be used to set check_email to 1 (will be done automaticly if called with valid email verification code of type register or registerDirect)
Can be used for password reset (additional step required: call update user info with new password)

GET http://localhost/login_api/loginViaEmailVerificationCode?emailVerificationCode=382738273892983

return 
```json 
{"state":"success", "email_verification_code_type":"resetPassword","info":[],"session_id":1853761475}
```
- email_verification_code_type
  - resetPassword: for password resets, will be deleted immediately, is a only one use code 
  - registerDirect: code generated by register for check email
  - register: code generated by auto-register via elopage for check email
- info can contain additional info strings 
  - "user hasn't password": if user hasn't set a password yet (for example if he was registered via elopage)
  - "email already activated": if email was already checked 
- session_id: session_id for new session

## Send Emails
Let send Login-Server Password reset E-Mail to User 
Can be also used for admin interface to resend email verification code
POST http://localhost/login_api/sendEmail
```json
{"email": "max.musterman@gmail.de", "email_text":7, "email_verification_code_type":"resetPassword" }
```
also valid: 
```json
{"email": "max.musterman@gmail.de", "email_text":"user reset Password", "email_verification_code_type":"resetPassword" }
```
or: 
```json
{"session_id": -127182, "email": "max.musterman@gmail.de", "email_text":5, "email_verification_code_type":"register" }
```

- session_id: not needed for resetPassword emails
- email_type: choose which email text should be used (number or string can be used)
  - "email user verification code" (2): default text used when new user has registered 
  - "email user verification code resend" (3): text used when user hasn't activated his account 7 days after register
  - "email user verification code resend after long time" (4): text used when user hasn't activated his account more than 7 days after register
  - "email admin user verification code" (5): used if admin trigger sending the email with email verification code
  - "email admin user verification code resend" (6): used if admin trigger sending the email with email verification code again
  - "user reset Password" (7): used for reset password email text 
  - "email custom tex" (8): used if custom email text should be used (than email_custom_text must also be filled)
- email_verification_code_type
  - resetPassword: for password resets, will be deleted immediately, is a only one use code, can be used without session_id
  - registerDirect: code generated by register for check email, can only be used by admins for another user
  - register: code generated by auto-register via elopage for check email, can only be used by admins for another user
- email_custom_text (optional): can be used to send email with custom text 
  placeholder for email text, will be replaced 
  - [first_name] first name 
  - [last_name] last name 
  - [duration] time span since user has created account (ex.: 10 Days) with largest unit, day is last unit
  - [link] login-server checkEmail link with email verification code (ex.: http://localhost/account/checkEmail/382738273892983)
  - [code] email verification code if you like to use your one link 
- emailCustomSubject: for custom email the subject

return 
```json 
{"state":"success"}
```
if everything is okay 
return 
```json 
{"state":"warning", "msg":"email already sended"}
```
if emails was successfully sended but was already sended in past also.

return with "state":"error" and additional "msg" if error occured (no email sended): 
- "email already send less than a hour before": User has already get a password reset email and haven't used the link yet
- "not supported email type": with "email_verification_code_type":"resetPassword" only email type 7 or 8 allowed 
- "admin needed": only admins can send email verification emails because this emails normally sended out automaticly
- "invalid email": if email wasn't found in db
- "invalid session": if session wasn't found (only checked if session_id is set and != 0)
- "invalid email type": could not parse email type 
- "invalid verification code type": could not parse email verification code type 
- "json exception": error parsing input json, more infos can be found in details