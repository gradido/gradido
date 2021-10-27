### User creation
A user needs to be created on the login_server we do this when we create a User in the client https://$community_domain/vue/register.

### Admin user
To set a User admin we need the following SQL query on the gradido_login database:
```
INSERT INTO user_roles (id, user_id, role_id) VALUES (NULL, '1', '1');
```
user_id has to be found in users
Now when we login in on https://$community_domain/account/ we can create coins but we will be restricted cause we can't sign the creations.

### Signation account
To add a signation account we need to go on the following url: http://$community_domain/server-users/add

### Coin creation process
The coin creation for work is done in the following url: http://$community_domain/transaction-creations/create-multi
Where we can create coins for a number of as many users as we want excepted for our self.

Pending_tasks table is used to store the transactions that can't be fulfilled.