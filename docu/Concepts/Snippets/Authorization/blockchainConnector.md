# Authorization and BlockchainConnector
Suggestions for removing most of cryptographic code from Apollo-Server

## Node-Module in Apollo
The Blockchain-Connector will be rewritten as node-module
Every Crypto-Function will be executed as C-Module with js-Interface

#### advantages:
- no need for changing server setup, simply install via npm or yarn
- no crypto code visible in Apollo source
- transfer password only inside of server after received from frontend

#### disadvantage:
- apollo still need to save all user data needed for it


## Login-Server
The Blockchain Connector inherit the mechanic of Login-Server
- Login via Blockchain-Connector
- it return's a JWT Token which the Apollo-Server can verify 
- the Blockchain-Connector store the decrypted private Key only in memory as before the Login-Server
- Transaction are sended to Blockchain-Connector for signing with User private Key, the JWT Token replace the session id
- new Users and password changes must be transmitted to Blockchain-Connector

### Variants DB

The Blockchain Connector has his own db table to store the necessary datas
- questions: will it use the apollo migrations or the old skeema setup?
- disadvantage: more work on c++ side 
- setup is a bit more complex

The Blockchain Connector don't use any db, the Apollo deliver all needed data in the requests
- disadvantage: bloated requests


### Variants requests

The Frontend could make the requests to Blockchain-Connector themselves instead via Apollo 
#### advantages: 
- less sending around password, less channels to attack
- the Blockchain Connector can also use the Client-IP for checking that the requests came from the same location (prevent session hijacking)
#### disadvantage: 
- frontend has again two targets for his requests

#### additional:
BlockchainConnector could host the frontend and verify that the files weren't changed
thats prevent changing frontend code from server side (hacker or admin) for example to send out passwords 
easily without recompiling the Blockchain Connector
I think the security gain is marginal 


## Node-Module in Frontend
The Blockchain-Connector will be rewritten as node-module
Every Crypto-Function will be executed in webassembly (see for example https://www.npmjs.com/package/libsodium)
Frontend gets encrypted password from Apollo and decrypt it with Blockchain-Connector Node-Module
Transaction will be signed in Frontend with Blockchain-Connector and can be even send directly from there to iota

#### advantages: 
- the password never leaves the user-computer, except if the computer was already hacked and hacks transfer screen or keyboard inputs
- the proof-of-work algorithm for iota can be run on user-pc which makes scalability much better rather than on server hosting Blockchain Connector or iota node (which not all iota nodes allow)
- not far away from Mobile-App which can stores the private key in secure storage of device

#### disadvantage: 
- logic in frontend
- apollo still need to save all user data needed for it 