# DLT-Connector Overview

What the DLT Connector does roughly.

- create transaction
- receive transactions from iota
- warmup, load missing transactions from iota on startup

## create transaction 
- called from backend with transaction details
  - sender user | signing user (in case of contribution)
    - uuid
    - account nr | default = 1  
    - community uuid
  - recipient user 
    - uuid
    - account nr | default = 1  
    - community uuid
  - amount
  - memo 
  - type
  - createdAt
- load or create accounts
- compose protobuf transaction
- derive correct private key for signing account and sign transaction
- validate transaction
- write transaction into transaction_recipes table
- send transaction to iota
- update iota message id in transaction_recipes table
- return to backend with iota message id


## receive transactions from iota
- listen on all registered community topics on iota
- make sure we have everything from milestone
- sort per community by iota milestone, createdAt ASC
- per message:
  - deserialize to protobuf object
  - validate
  - if valid:
    - calculate running_hash and account_balance
    - write into confirmed_transactions
  - if invalid: 
    - write into invalid_transactions
  - send request to backend with final transaction data for comparison
    - sender user | signing user (in case of contribution)
      - uuid
      - account nr 
      - community uuid
    - recipient user 
      - uuid
      - account nr
      - community uuid
    - amount 
    - memo
    - createdAt
    - confirmedAt
    - type
    - iota message id
    - balance for createdAt
    - decay for createdAt

## warmup, load missing transactions from iota or Chronicle on startup
- read all iota message ids from all registered topics
- check if already exist
- load details for not existing message ids
- do for every message [receive](#receive-transactions-from-iota)