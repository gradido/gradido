CREATE TABLE `hedera_topics` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `topic_hedera_id` int unsigned NOT NULL,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `auto_renew_account_hedera_id` int unsigned DEFAULT NULL,
  `auto_renew_period` int unsigned NOT NULL DEFAULT '0',
  `group_id` int unsigned NOT NULL,
  `admin_key_id` int unsigned DEFAULT NULL,
  `submit_key_id` int unsigned DEFAULT NULL,
  `current_timeout` DATETIME NOT NULL DEFAULT '2000-01-01 00:00:00',
  `sequence_number` bigint unsigned DEFAULT '0',
  `running_hash` VARBINARY(64) DEFAULT NULL,
  `running_hash_version` int unsigned DEFAULT 0,
  `updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `topic_hedera_id` (`topic_hedera_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 
