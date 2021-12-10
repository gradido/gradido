# Interface 
## Create Transaction


### Request
`POST http://localhost/login_api/createTransaction`

with:

```json
{
	"transaction_type": "transfer",
    
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
	"hasElopage": true,
	"clientIP":"123.123.123.123"
}
```
- `transaction_type`:
    - `transfer`:
    - `creation`:
    - `groupMemberUpdate`:

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
- `hasElopage`: only present if hasElopage was set to true in request, true if user has an elopage account
nginx was wrong configured.
- `session_id`: can be also negative