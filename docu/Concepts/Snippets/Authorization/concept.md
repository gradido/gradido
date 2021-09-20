# Authorization and Private Keys
## Keys
For creating transactions ed25519 keys are used for signing. 
As long the user is the only controlling the private key he is the only one
how can sign transactions on his behalf. 
It is a core concept of all crypto currencies and important for the concept,
that the user has full control over his data. 

Usually crypto currencies like bitcoin or iota save the keys on local system,
maybe additional protected with a password which is used to encrypt the keys.

## Gradido
Gradido should be easy to use, so we must offer a solution for everyone not that fit
with computer, as easy to use like paypal.
For that role we have the Login-Server.
It stores the private keys of the user encrypted with there email and password. 
Additional it stores the passphrase which can be used to generate the private key,
encryted with server admin public key. So only the server admin can access the keys
with his private key. [not done yet]
It is needed for passwort reset if a user has forgetten his password. 

But for the entire concept Login-Server isn't the only way to store the private keys.
For users which has more experience with computer and especially with crypto currencies
it should be a way to keep there private keys by themselfs. 

For example a Desktop- or Handy-App which store the keys locally maybe additional encrypted. 
Maybe it is possible to use Stronghold from iota for that. 
With that the user don't need to use the Login-Server. 