CREATE TABLE `transaction_send_coins` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` int UNSIGNED NOT NULL,
  `state_user_id` int UNSIGNED NOT NULL,
  `receiver_public_key` binary(32) NOT NULL,
  `receiver_user_id` int UNSIGNED NOT NULL,
  `amount` bigint NOT NULL,
  `sender_final_balance` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
