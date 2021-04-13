CREATE TABLE `hedera_accounts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `account_hedera_id` int unsigned NOT NULL,
  `account_key_id` int unsigned NOT NULL,
  `balance` bigint unsigned NOT NULL DEFAULT '0',
  `network_type` int NOT NULL DEFAULT '0',
  `updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_hedera_id` (`account_hedera_id`),
  UNIQUE KEY `account_key_id` (`account_key_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 
