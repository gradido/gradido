INSERT INTO `groups` (`id`, `alias`, `name`, `url`, `host`, `home`, `description`) VALUES
(2, 'dockerStage2', 'docker stage2 gradido group', 'localhost', 'nginx', '/', 'gradido test group for docker and stage2');

INSERT INTO `hedera_ids` (`id`, `shardNum`, `realmNum`, `num`) VALUES
(1, 0, 0, 3),
(2, 0, 0, 3327),
(3, 0, 0, 413151);

INSERT INTO `node_servers` (`id`, `url`, `port`, `group_id`, `server_type`, `node_hedera_id`, `last_live_sign`) VALUES
(1, 'http://0.testnet.hedera.com', 50211, 0, 4, 2, '2000-01-01 00:00:00');

INSERT INTO `hedera_accounts` (`id`, `user_id`, `account_hedera_id`, `account_key_id`, `balance`, `network_type`, `updated`) VALUES
(1, 1, 2, 1, 1000000000000, 1, '2021-01-07 10:22:52');

INSERT INTO `hedera_topics` (`id`, `topic_hedera_id`, `name`, `auto_renew_account_hedera_id`, `auto_renew_period`, `group_id`, `admin_key_id`, `submit_key_id`, `current_timeout`, `sequence_number`, `running_hash`, `running_hash_version`, `updated`) VALUES
(1, 3, 'dockerStage2', 1, 7890000, 1, 0, 0, '2021-06-08 23:17:19', 0, NULL, 0, '2021-03-09 16:42:34');



