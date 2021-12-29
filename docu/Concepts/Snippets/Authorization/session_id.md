# Session Id Authorization
## Login-Server
With every login, the Login-Server creates a session with a random id,
storing it in memory. For Login email and password are needed. 
From email and an additional app-secret (**crypto.app_secret** in Login-Server config) a sha512 hash will be genereted, named **hash512_salt**.
With sodium function *crypto_pwhash* with **hash512_salt** and user password a secret encryption key will be calculated.
*crypto_pwhash* uses argon2 algorithmus to have a CPU hard calculation. Currently it is configured for < 0.5s.
So it is harder to use brute-force attacks to guess the password. Even if someone gets hands on the data saved in db.

With sodium function *crypto_shorthash* a hash will be calculated from the secret encryption key and server crypto key (**crypto.server_key** in Login-Server config, hex encoded, 16 Bytes, 32 Character hex encoded)
and compared against saved hash in db. If they identical user has successfull logged in. 
The secret encryption key will be stored in memory together with the user session and client ip from which login call came.
The session_id will be returned. 
The session will be hold in memory for 15 minutes default, can be changed in Login-Server config field **session.timeout**


