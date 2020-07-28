CREATE TABLE `transactions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_group_id` int UNSIGNED DEFAULT NULL,
  `transaction_type_id` int UNSIGNED NOT NULL,
  `tx_hash` binary(32) DEFAULT NULL,
  `memo` varchar(255) NOT NULL,
  `received` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
