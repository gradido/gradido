# Key Derivation
The DLT connector uses key derivation to derive keys for each user in the community account with a master key.
![Bip32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)

## user accounts
The Path for key derivation contain the gradido id, and derivation index of account
Gradido ID: 03857ac1-9cc2-483e-8a91-e5b10f5b8d16
Derivation Index: 1 
Key derivation Path:
m/03857ac1'/9cc2'/483e'/8a91'/e5b10f5b8d16'/1

## gmw and auf accounts
For gmw and auf accounts two special Paths used:
gmw account => account nr 1  
```
m/1'
```
auf account => account nr 2  
```
m/2'
```



