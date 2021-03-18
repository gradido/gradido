CREATE TABLE `transaction_send_coins` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int(10) unsigned NOT NULL,
  `state_user_id` int(10) unsigned NOT NULL,
  `receiver_public_key` binary(32) NOT NULL,
  `receiver_user_id` int(10) unsigned NOT NULL,
  `amount` bigint(20) NOT NULL,
  `sender_final_balance` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
