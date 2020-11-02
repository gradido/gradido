INSERT INTO `transaction_types` (`id`, `name`, `text`) VALUES
(1, 'group create', 'create a new group, trigger creation of new hedera topic and new blockchain on node server'),
(2, 'group add member', 'add user to a group or move if he was already in a group'),
(3, 'creation', 'create new gradidos for member and also for group (in development)'),
(4, 'transfer', 'send gradidos from one member to another, also cross group transfer'),
(5, 'hedera topic create', 'create new topic on hedera'),
(6, 'hedera topic send message', 'send consensus message over hedera topic'),
(7, 'hedera account create', 'create new account on hedera for holding some founds with unencrypted keys');

