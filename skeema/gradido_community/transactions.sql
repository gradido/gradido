CREATE TABLE `transactions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `state_group_id` int(11) DEFAULT NULL,
  `transaction_type_id` int(11) NOT NULL,
  `tx_hash` binary(32) DEFAULT NULL,
  `memo` varchar(255) COLLATE utf8_bin NOT NULL,
  `received` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
