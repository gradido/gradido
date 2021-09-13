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




