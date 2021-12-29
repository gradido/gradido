# How JWT could be used for authorization with and without Login-Server
## What we need
The only encrypted data in db are the private key.
Every other data could be accessed without login, depending on frontend and backend code.
So we need only a way to prove the backend that we have access to the private key. 

## JWT
JWT is perfect for that. 
We can use JWT to store the public key of the user as UUID for finding his data in db,
signing it with the private key. So even if the backend is running in multiple instances,
on every request is it possible to check the JWT token, that the signature is signed with
the private key, belonging to the public key. 
The only thing the backend cannot do with that is signing a transaction.
That can only be done by the Login-Server or a Desktop or Handy-App storing the private key locally.
With that we have universal way for authorization against the backend. 
We could additional store if we like to sign transactions local or with Login-Server and the Login-Server url.

## JWT and Login-Server
Login-Server uses Poco version 1.9.4 but unfortunately Poco only introduces jwt from version 1.10.
And Updating to 1.10 needs some work because some things have changed in Poco 1.10.

## JWT signature algorithms
In JWT standard ed25519 don't seemd to play a role.
We must find out if we can use the ed25519 keys together with one of the signature algorithms
in JWT standard or we must use **crypto_sign_verify_detached** from libsodium even it is nonstandard
to verify signature created with ed25519 keys and libsodiums **crypto_sign_detached** function.



