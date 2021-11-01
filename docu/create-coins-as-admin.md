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
At first we need to enable the server user account creation with uncommenting line: 19 in 
community_server/src/Controller/ServerUsersController.php
```php
$this->Auth->allow(['add', 'edit']);
```
This enable us to use this action without being logged in. 
To add a signation account we need to go on the following url: http://$community_domain/server-users/add

### Coin creation process
The coin creation for work is done in the following url: http://$community_domain/transaction-creations/create-multi
Where we can create coins for a number of as many users as we want excepted for our self.
Furthermore we must sign the transactions we created. Normally after clicking on the left button (Transaktion abschließen) we should be automatically forwarded to http://$community_domain/account/checkTransactions where we can do this.
If not this page can also be reached by clicking on the shield-icon with the hook in it on the Dashboard, which is only shown if at least one transaction is waiting for signing. 

For debug purposes you can check the `pending_tasks` table, which is used to store the transactions which are not signed yet or had errors.