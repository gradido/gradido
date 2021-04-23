# Login Server – Community Server - Communication

Register account take place on Login-Server HTTP Form or via webhook called from elopage every time someone make a donation to Gradido. 
By webhook call check if account for email exist, if not create account and send email verification code to user. 
Emails are sended via SMTP.
By visiting checkEmail Page with valid email verification code, check if user has already a password, if not (if he was auto-registered via webhook) ask for password.
After that or by first login and user hasn't key pair: generate ed25519 key pair and save the private key encoded with user password and email in db, save public key in db, save passphrase in db. 
In Future, passphrase must be encrypted with server admin public key, so only server admin can decyrpt saved passphrase, if user has forgetten it. Maybe different server admins, one for technical, other for decyrpt passphrases.
Save Login-Cookie after login was successfully. 
After login, redirect to community-server dashboard. 
Community Server use Login Cookie from Login-Server to get data for logged in user. 
He call via Json  HTTP Request in Community Server src/Controller/AppController::requestLogin with this line: $response = $http->get($url . '/login', ['session_id' => $session_id]);

If user will transfer Gradidos Community Server create transaction, send it to Login-Server and then redirect user to login-server checkTransaction Page for signing transaction. In Future it will check if current ip is the same as by login and ask for password, if some time passed by since the last time. 
After user has checked Transaction and click on sign, currently Login-Server sends signed transaction back to Community-Server. But in Future he will send it to Hedera and Community Server get the infos about success async from his registered nodes servers.
For that Community Server should get a ping request every minute from login-server and with that ask at least one node server for new transactions, sending him the last transaction nr he knows. 
If admin will create GDDs he can not only create one transaction at a time, he can also create some in a row and than go to checkTransaction Page on Login-Server an sign them one after another.

If user change his first name, last name or language on community server it will be send to Login-Server. 
If user like to change his passwort he will redirected to passwort change page on Login-Server. 
In Future he should be also checked the ip and how long user has tipped in his password and ask maybe again, if it was to long.

On Konto -Overview the Community Server ask also the GDT Server for current GDT balance of user (identified by email).
Much later we need a way to get GDT balance in Blockchain, because user can exchange there GDT for GDD, but only to some extends, rules will be clarified later. For example depending on GDD Sum in Group, not more than 1% of GDD Sum per user per month or whatever.
Login Server use a http-Server on Port 1200 and a additional http-Server for json request on default port 1201. Currently Configured that nginx forward every request starting with /account to port 1200. 
Community Server call Login-Server via Port 1201.

The Interface from Login-Server which can be called from Community-Server lives in Login-Server: src\cpp\JSONInterface\*
Starting with JsonRequestHandlerFactory.cpp you see which functions can be called.
login: return currently logged in user with public key and other data 
checkTransaction: send transaction for signing from community server to Login Server, only TransactionBody
getRunningUserTasks: return count of pending transactions for user to sign, or in processing
getUsers: (only for admin) search for user first_name or last_name or email
createUser: (only for admin) create user from admin, user gets email verification email with differnet text as by registered via webhook
adminEmailVerificationResend: (only for admin) trigger resend of email verification email for target user
getUserInfos: get specific infos about user choosen by ask parameter 
updateUserInfos:update first_name and/or last_name, and/or language, and/or disabled


The Interface from Community-Server which can be called from Login-Server lives in 
Community-Server src/Controller/JsonRequestHandlerController.php
Functions are:
putTransaction: Login-Server send signed transaction to Login-Server, will later be removed, after transaction go over hedera
moveTransaction: Create Transfer Transaction, only used from RepairDefectPassphrase in Login-Server HTTP-Interface
checkUser: check if Community Servers knows user (email and last_name are same)
getUsers: return uses paginated for GDT-Server
getUserBalance: get user balance for user 
errorInTransaction: called from login server if transaction he has get couldn't decoded 