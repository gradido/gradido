
CREATE TABLE `transaction_send_coins` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `receiver_public_key` binary(32) NOT NULL,
  `receiver_user_id` varbinary(64) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `sender_final_balance` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
