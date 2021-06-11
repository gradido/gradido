# Login Server API

This document describes the login server API. The login server is written in C++ and mixes front with backend.
The primary task of the login server is to store and handle the private keys of the users securely.

## Configuration
You can configure the login server to handle login and register requests via http call, by setting the following config option:

```ini
unsecure.allow_passwort_via_json_request = 1 
```

To disable CORs restrictions you can set:

```ini
unsercure.allow_cors_all = 1
```

This will result in all JSON-Request headers to contain:

```
	Access-Control-Allow-Origin: * 
	Access-Control-Allow-Headers: "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
```

## Error handling

// TODO

## Login
To login you can use the `unsecureLogin` request

### Request
`POST http://localhost/login_api/unsecureLogin`

with:

```json
{
	"email": "max.musterman@gmail.de",
	"username": "Maxilein", 
	"password": "123abcDE&"
}
```
`username` or `email` must be present!
If booth present, `email` will be used. 

### Response
In case of success returns:

```json
{
	"state":"success",
	"user": {
		"created": 1614782270,
		"description": "",
		"disabled": false,
		"email": "max.musterman@gmail.de",
		"email_checked": true,
		"first_name": "Max",
		"group_alias": "gdd1",
		"ident_hash": 323769895,
		"language":"de",
		"last_name": "Mustermann",
		"public_hex": "131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
		"role": "none",
		"username": ""
	},
	"session_id": -127182,
	"clientIP":"123.123.123.123"
}
```

- `user`: contain user object
  - `created`: timestamp on which account was created
  - `description`: description of user for other user 
  - `disabled`: true if account was disabled, if disabled no login or coin transfer is possible
  - `email`: email of user
  - `email_checked`: true if user has successfully clicked on activation link in email
  - `first_name`: first name of user
  - `group_alias`: alias of group/community to which user belong
  - `ident_hash`: currently hash of email, will be later a identification hash to prevent multiple accounts and therefore multiple creations per user
  - `language`: language of user, currently only "de" or "en" 
  - `last_name`: last name of user
  - `public_hex`: public key of user in hex format
  - `role`: role of user currently only "none" or "admin"
  - `username`: not used yet
- `clientIP`: should be the same as where the js-client is running, else maybe a man-in-the-middle attacks is happening or 
nginx was wrong configured.
- `session_id`: can be also negative

## Check username
### Request 
`GET http://localhost/login_api/checkUsername?username=<username>&group_id=<group_id>`

`POST http://localhost/login_api/checkUsername`
with
```json
{
	"username": "Maxilein",
	"group_id": 1,
	"group_alias": "gdd1"
}
```

group_id or group_alias, one of both is enough. 
group_id is better, because one db request less

### Response

If username is not already taken
```json
{
	"state":"success"
}
```

If username is already taken
```json
{
	"state":"warning",
	"msg":"username already in use"
}
```

If only group_alias was given and group with that alias was found in db
```json
{
	"state":"success",
	"group_id": 1
}
```

If group_id or group_alias unknown
```json
{
	"state":"error",
	"msg": "unknown group"
}
```

## Create user
Register a new User

### Request
`POST http://localhost/login_api/createUser`

with:

```json
{
	"email":"max.musterman@gmail.de",
	"first_name":"Max",
	"last_name":"Musterman",
	"username": "Maxilein",
	"description": "Tischler",
    "emailType": 2,
	"group_id": 1,
	"password":"123abcDE&",
	"login_after_register":true
}
```

- `username`: (optional), mindestens 4 Zeichen, return error if already used
- `description`: (optional), mindestens 4 Zeichen
- `emailType`: control email-text sended with email verification code
  - 2: default, if user has registered directly
  - 5: if user was registered by an admin 
- `group_id`: group id of group to which user will join (id from login_server)
- `login_after_register`: if set to true auto-login after create user was successfull, means session cookie is set and session_id returned

### Response
In case of success returns:

```json
{
	"state":"success"
}
```

Now a new user is registered, its keys were generated and it can be logged in. A confirmation EMail has been sent to the user as well.

// TODO return type if `login_after_register=true` is used

## Logout
To logout an logged in session:

### Request
`POST http://localhost/login_api/logout`

with:

```json
{
	"session_id": -127182
}
```

### Response
In case of success returns:

```json
{
	"state":"success"
}
```

## Update user data
This request allows you to update first name, last name, user language and enable/disable user.

Additionally the user's password can be changed if the following option is set:

```ini 
unsecure.allow_passwort_via_json_request = 1
```

### Request
`POST http://localhost/login_api/updateUserInfos`

with:

```json 
{
	"session_id": -127182,
	"email": "max.musterman@gmail.de",
	"update": {
		"User.first_name": "Max",
		"User.last_name" : "Musterman",
		"User.username" : "Maxilein",
		"User.description" : "Tischler",
		"User.disabled": 0,
		"User.language": "de",
		"User.password": "1234",
		"User.password_old": "4321"
  	}
}
```

Notes:
- `user.language`: currently supports `de` and `en` only 
- User will be disabled if he wants his account deleted, but has transactions. Until transactions are saved in real blockchain, we need this data because the public key is in db only saved in state_users so if we delete this entry, validating all transactions is no longer possible.
- Disabled Users can neither login nor receive transactions. 
- It is not required to provide all fields of `update`, it can be a subset depending on what you intend to change.
- `User.password`: to change user password, needed current passwort in `User.password_old` 

### Response
In case of success:

```json 
{
	"state":"success",
	"valid_values": 4,
	"errors": [...]
}
```

- `valid_values`: should contain count of entries in update if no error occurred (User.password will not be counted)
- `errors`: contain on error string for every entry in update, which type isn't like expected 
  - `password`: 
    - "new password is the same as old password": no change taking place
	- "password changed, coludn"t load private key for re-encryption": password was successfully changed, is at the moment only a warning as long as user_backups are unencrypted, safe to ignore
	- "stored pubkey and private key didn't match": error by re-encryption keys, no changes saved 
	- "User.password isn't valid": if password validation failed, followed by reasons why (additional array in array)
		Example: 
	  	```json 
	  	{
		  	"errors": [
				"User.password isn't valid",
				[
					"Passwort: Dein Passwort ist zu kurz!\n",
					"Passwort: Bitte gebe ein g&uuml;ltiges Password ein mit mindestens 8 Zeichen, Gro&szlig;- und Kleinbuchstaben, mindestens einer Zahl und einem Sonderzeichen (@$!%*?&+-_) ein!\n" 
	    		]
	   		],
	   		"state":"success",
	   		"valid_values":0
	  	}
      	```

## Retrieve user data
Retrieve different user data.

You can query a subset of data or all of it at once.

Normal Users can only retrieve data for themselves, admins (login-server admin) can retrieve data for every user.

Email is also the email address of user from which data are asked 

### Request
`POST http://localhost/login_api/getUserInfos`

with:

```json 
{
	"session_id": -127182,
	"email": "max.musterman@gmail.de",
	"ask": [
		"EmailVerificationCode.Register",
		"loginServer.path",
		"user.pubkeyhex",
		"user.first_name",
		"user.last_name",
		"user.username",
		"user.description",
		"user.disabled",
		"user.email_checked",
		"user.language"
  	]
}
```

### Response
In case of success:

```json 
{
	"state": "success",
	"userData": { 
		"EmailVerificationCode.Register": "2718271129122",
		"pubkeyhex": "131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
		"first_name": "Max",
		"last_name": "Musterman",
		"disabled": 0,
		"email_checked": 1
  	},
	"server": {
    	"loginServer.path": "http://localhost/account"
  	},
  	"errors": []
}
```

Return only the fields which are defined in request 
- `EmailVerificationCode.Register`: return the email verification code for check email (create one if none exist), work only if logged in user is admin and the email isn't from him 
- `loginServer.path`: the redirect path to login-server, for example for login with login-server html frontend 
- `user.pubkeyhex`: public key of user in hex-format
- `user.first_name`: first name of user 
- `user.last_name`: last name of user 
- `user.username`: username of user (min 4 Character, unique per group)
- `user.description`: profil text for user
- `user.disabled`: User will be disabled if he wants a account delete but has transactions. Until transactions are saved in real blockchain, we need this data because the public key
is in db only saved in state_users so if we delete this entry, validating all transactions is no longer possible. Disabled User cannot login and cannot receive transactions. 
- `email_checked`: If user has clicked on link in verification email (register), can only transfer gradidos if email_checked is 1
- `language`: Language Key for User, currently 'de' or 'en'
- `errors`: array of strings if error occure 

## Login by Email Verification Code
Login while confirming your EMail. This API call is used to replace http://localhost/account/checkEmail (HTML).

If successful `check_email` will be set to 1 in the database.

// TODO why would I want to do this?
// TODO ??? (will be done automaticly if called with valid email verification code of type register or registerDirect)
// TODO ??? Can be used for password reset (additional step required: call update user info with new password)

### Request
`GET http://localhost/login_api/loginViaEmailVerificationCode?emailVerificationCode=382738273892983`

### Response
In case of success returns:

```json 
{
	"state":"success", "email_verification_code_type":"resetPassword",
	"info":[],
	"user": {
		"created": 1614782270,
		"description": "Tischler"
		"disabled": false,
		"email": "max.musterman@gmail.de",
		"email_checked": true,
		"first_name": "Max",
		"group_alias": "gdd1",
		"ident_hash": 323769895,
		"language": "de",
		"last_name": "Mustermann",
		"public_hex": "131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
		"role": "none",
		"username": ""
	},
	"session_id":1853761475
}
```

- `email_verification_code_type`
  - `resetPassword`: for password resets, will be deleted immediately, is a only one use code 
  - `registerDirect`: code generated by register for check email
  - `register`: code generated by auto-register via elopage for check email
- `info`: can contain additional info strings 
  - "user has no password": if user hasn't set a password yet (for example if he was registered via elopage)
  - "email already activated": if email was already checked 
- `user`: contain user object
  - `created`: timestamp on which account was created
  - `disabled`: true if account was disabled, if disabled no login or coin transfer is possible
  - `email`: email of user
  - `email_checked`: true if user has successfully clicked on activation link in email
  - `first_name`: first name of user
  - `group_alias`: alias of group/community to which user belong
  - `ident_hash`: currently hash of email, will be later a identification hash to prevent multiple accounts and therefore multiple creations per user
  - `language`: language of user, currently only "de" or "en"
  - `last_name`: last name of user
  - `public_hex`: public key of user in hex format
  - `role`: role of user currently only "none" or "admin"
  - `username`: not used yet
- `session_id`: session_id for new session

## Send E-Mails
Lets you send Login-Server Password reset E-Mail to an user.
Can be also used for the admin interface to resend email verification codes

### Request
`POST http://localhost/login_api/sendEmail`

with:

```json
{
	"email": "max.musterman@gmail.de", 
	"email_text":7,
	"email_verification_code_type":"resetPassword"
}
```

also valid: 

```json
{
	"email": "max.musterman@gmail.de",
	"email_text":"user reset Password",
	"email_verification_code_type":"resetPassword" }
```
// TODO this makes no sense, why two fields email_text & code_type?

or:

```json
{
	"session_id": -127182,
	"email": "max.musterman@gmail.de",
	"email_text":5,
	"email_verification_code_type":"register"
}
```

- `session_id`: not needed for resetPassword emails
- `email_type`: choose which email text should be used (number or string can be used)
  - "email user verification code" (2): default text used when new user has registered 
  - "email user verification code resend" (3): text used when user hasn't activated his account 7 days after register
  - "email user verification code resend after long time" (4): text used when user hasn't activated his account more than 7 days after register
  - "email admin user verification code" (5): used if admin trigger sending the email with email verification code
  - "email admin user verification code resend" (6): used if admin trigger sending the email with email verification code again
  - "user reset Password" (7): used for reset password email text 
  - "email custom tex" (8): used if custom email text should be used (than email_custom_text and email_custom_subject must also be filled)
- `email_verification_code_type`
  - resetPassword: for password resets, will be deleted immediately, is a only one use code, can be used without session_id
  - registerDirect: code generated by register for check email, can only be used by admins for another user
  - register: code generated by auto-register via elopage for check email, can only be used by admins for another user
- `email_custom_text`: (optional) can be used to send email with custom text 
  placeholder for email text, will be replaced 
  - [first_name] first name 
  - [last_name] last name 
  - [duration] time span since user has created account (ex.: 10 Days) with largest unit, day is last unit
  - [link] login-server checkEmail link with email verification code (ex.: http://localhost/account/checkEmail/382738273892983)
  - [code] email verification code if you like to use your one link 
- `email_custom_subject`: (optional) for custom email the subject

### Response
In case of success returns:

```json 
{
	"state":"success"
}
```

or:

```json 
{
	"state":"warning",
	"msg":"email already sended"
}
```
(if emails was successfully sent but was already sent before)

Furthermore following error cases can take place:
A result with `"state":"error"` and an additional `"msg"` if an error occurred (no email sended): 
- "email already send less than a hour before": User has already get a password reset email and haven't used the link yet
- "not supported email type": with "email_verification_code_type":"resetPassword" only email type 7 or 8 allowed 
- "admin needed": only admins can send email verification emails because this emails normally sended out automaticly
- "invalid email": if email wasn't found in db
- "invalid session": if session wasn't found (only checked if session_id is set and != 0)
- "invalid email type": could not parse email type 
- "invalid verification code type": could not parse email verification code type 
- "json exception": error parsing input json, more infos can be found in details

### Side effects

#### For `resetPassword`:

User gets an email with a link to `http://localhost/account/checkEmail/<emailVerificationCode>`.
The link can be modified in the Login-Server config:

`frontend.checkEmailPath = http://localhost/account/checkEmail`

For the docker build, you can find the config here: `configs/login_server/grd_login.properties`

## Check Running Transactions / password encryption
Check if transactions on login-server for user are processed 


### Request
`GET http://localhost/login_api/getRunningUserTasks?email=max.musterman%40gmail.de`

or:

`POST http://localhost/login_api/getRunningUserTasks`

with:

```json 
{
	"email":"max.musterman@gmail.de"
}
```

### Response
In case of success returns:

```json 
{
	"state":"success",
	"runningTasks": {
		"password creation": 0,
		"sign transaction": 1,
		"prepare transaction": 1,
		"ready for sign transaction":0
	}
}
```

return only entries which > 0
- password creation: after register or password change, login possible after tasks is finish
- sign transaction: after check transaction in backend, before transaction is in db
- prepare transaction: after sending transaction to login-server, before they can be checked
- ready for sign transaction: transactions ready for signing from user

## Check Session State
Check if a given session is still valid

### Request
`GET http://localhost/login_api/checkSessionState?session_id=-127182`

### Response
In case of success returns:

```json
{
	"state":"success"
}
```

or:

```json
{
	"state":"not found",
	"msg": "session not found"
}
```
