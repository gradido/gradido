## Software structure transition
I would be happy if you label GraphQL more detailed for example "new community server with GraphQL-Interface"
Everytime I read only GraphQL its trigger me, because GraphQL is only a standard not a server. 
I don't think it is wise to remove the login-server complete, because than user left only with two options sending gradidos securly:
- with a native mobile app (saving keys in secure storage) 
- Managing there keys/passphrase themself and copy them into client everytime they want so send gradidos like with webwallets (https://www.myetherwallet.com/access-my-wallet)

My suggestion is to see the login-server as third option for inexperienced users to handle Gradidos as easy as paypal. 
So the Login-Server can be optional in your graphic.
When the new community-server gets already signed transactions he can send it directly to the blockchain/blockchain-gate, if not signed he can send it to login-server for signing. We can change it so that the new community-server gets signed transactions back so login-server only sign transactions, not sending them anymore into the blockchain-network, 

## Frontend authentication idea
Why the extra step with JWT?
The Login-Server save the session-id in Cookie GRADIDO_LOGIN and if vue is running from same domain it could access the cookie directly. But more important the browser is sending the cookie automaticly so I need only to change Login-Server Json API to not using session_id instead reading in the session_id from cookie. 

## Repo structure
Yes, scripts are for deploying on bare metal, so they not used in docker setup.

## Community Server API
### Send transaction
"// TODO balance and at least last transaction must be returned with the call itself"
Do you mean last transaction before freshly sended transaction or this freshly sended transaction? 
I can give you the new balance after the transaction was successfully written into blockchain.
The send transaction call is actually a asychronous call, it's return very fast but transaction will be processed after it some time. With Hedera up to 2 minutes.

"// TODO how is this more secure?"
For me posting the transaction data again in pure html with disabled js directly from login-server is more secure, because if
a corrupted js-client manipulate transaction without user knowing,
user has the chance to notice it and cancel the transaction. Or if js-client has an error, but that shouldn't happen with enough tests. 

So the only way to manipulating transaction server-side is hacking the login-server, getting sudo password, change and recompile c++ code and restart login-server with new version. And even for that scenario I have a idea to prevent that. 
If login-server ask for a password after starting which he will use additional for encrypt user privat keys a hacker which restart login-server without the right passwort cannot doing anything with that. Even if User login-in no transactions can be signed because private keys of users cannot decrypted. For protecting password in-memory I have also some ideas, which I haven't implemented yet, but it exist some possibilities.

Yes it is also possible to change the pure html page received from login-server with a proxy or with a manipulated browser but I think that is harder to archieve. And you must do it for every user, while hacking serverside can has a greater impact to more user. The cost-benefit ratio is much better.

"// TODO Is this in line with our usability goals? // TODO Should this not be handled client side?"
I don't see where it intercept with usability. Confirm transaction is normal in online-banking-software. 
And with the same style user don't notice that they on a different server. Like on the production server or stage1 with old interface. 
This concept I have from the start, but with my idea from yesterday serve client-js from login-server we can reduce the risk of corrupted js-client and js-client can handle it by themself. 
Maybe we can make it optional so that user can choose between security and simpler use without confirming transaction. 

## Login Server API
### Login by Email Verification Code
"// TODO why would I want to do this? "
Maybe the title is misleading. 
In Old frontend:
If user clicked on link in verification email, he land on http://localhost/account/checkEmail/[code].
Than if code was found in db, check_email will be set to 1 and user will be logged in and redirected to his Dashboard.
On most pages I have used I have experienced it this way. But it isn't a full login. If user now wants to send gradidos in http://localhost/account/checkTransaction password will be requested.
But if a session from the user was still in memory this session will be used and is therefore a full login. 
So this api call act mainly as replacement for this function for using with new client. 

// TODO ??? (will be done automaticly if called with valid email verification code of type register or registerDirect) 
Sorry, was a bit unclear (._.)
Also check_email will be set to 1 if called with valid email verification code of type register or registerDirect, not with email verification code of type resetPassword.

// TODO ??? Can be used for password reset (additional step required: call update user info with new password)
Yes maybe not clear, I reuse the email verification code function for password reset because it's mostly the same. 
Login by code but with redirect to page for choosing new password. 
So if someone likes to reset his passwords and use this in old frontend: http://localhost/account/resetPassword
a new email verification code of type resetPassword is created and a email with this code in the link  http://localhost/account/checkEmail/[code] is sended to user. If he clicks on it he get logged in and redirect to  http://localhost/account/updateUserPassword page to choose a new password. Then his private keys will reincrypted with the new password and he will redirected to Dashboard. 

### Send E-Mails
// TODO this makes no sense, why two fields email_text & code_type?
I don't know which you prefer so I use both.
In C++ I use enums for that so I have a name and a number. 
I have seen in vue-client code that you have created a enum like object:
```js
// control email-text sended with email verification code
const EMAIL_TYPE = {
  DEFAULT: 2, // if user has registered directly
  ADMIN: 5, // if user was registered by an admin
}
```
and wasn't sure if it is okay if I only offer the number variant. 
So which way you prefer, number or string?