### User creation
A user needs to be created on the login_server we do this when we create a User in the client https://$community_domain/register.

### Admin user
To set a User admin we need the following SQL query on the gradido_login database:
```
INSERT INTO user_roles (id, user_id, role_id) VALUES (NULL, '1', '1');
```
user_id has to be found in users
Now when we login in on https://$community_domain/account/ we can create coins but we will be restricted cause we can't sign the creations.

### Coin creation process
Admin (User needs a certain role) can go through the wallet into the Admin Interface. 
Their he has multiple pages, the user search page allows to find user and to create coins for them if their email was verified. He can in the multiple creation page select multiple users for which he want to create a same amount of coins.
After an Admin has proposed a creation every admin has the possibility to validate this creation except for a own creation! Every Admin can also update the proposed creation.