INSERT INTO `transaction_types` (`id`, `name`, `text`) VALUES
(1, 'creation', 'create new gradidos for member and also for group (in development)'),
(2, 'transfer', 'send gradidos from one member to another, also cross group transfer'),
(3, 'group create', 'create a new group, trigger creation of new hedera topic and new blockchain on node server'),
(4, 'group add member', 'add user to a group or move if he was already in a group'),
(5, 'group remove member', 'remove user from group, maybe he was moved elsewhere'),
(6, 'hedera topic create', 'create new topic on hedera'),
(7, 'hedera topic send message', 'send consensus message over hedera topic'),
(8, 'hedera account create', 'create new account on hedera for holding some founds with unencrypted keys'),
(9, 'decay start', 'signalize the starting point for decay calculation, allowed only once per chain');
