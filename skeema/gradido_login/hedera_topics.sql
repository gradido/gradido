CREATE TABLE `hedera_topics` (
 `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
 `topic_hedera_id` INT UNSIGNED NOT NULL,
 `auto_renew_account_hedera_id` INT UNSIGNED NULL,
 `auto_renew_period` INT UNSIGNED NOT NULL DEFAULT '0',
 `group_id` INT UNSIGNED NOT NULL,
 `admin_key_id` INT UNSIGNED NULL,
 `submit_key_id` INT UNSIGNED NULL,
 `current_timeout` BIGINT UNSIGNED NOT NULL DEFAULT '0',
 `sequence_number` BIGINT UNSIGNED NULL DEFAULT '0',
 `updated` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4; 
