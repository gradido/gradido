
CREATE TABLE `transactions` (
  `id` bigint(20) NOT NULL,
  `state_group_id` int(11) NOT NULL,
  `transaction_type_id` int(11) NOT NULL,
  `tx_hash` binary(32) NOT NULL,
  `received` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
