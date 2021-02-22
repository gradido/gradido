# community server api

In this examples I assume that you use gradido with or docker-compose build on your local maschine

## Konto Overview
return current account balance
Ajax: 
GET http://localhost/state-balances/ajaxGetBalance/-127182

If session is valid, return:
{"state":"success","balance":174500}

- balance: Gradido Cent, 4 Nachkommastellen (2 Reserve), 174500 = 17,45 GDD

