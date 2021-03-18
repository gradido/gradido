CREATE TABLE `transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `state_group_id` int(10) unsigned DEFAULT NULL,
  `transaction_type_id` int(10) unsigned NOT NULL,
  `tx_hash` binary(32) DEFAULT NULL,
  `memo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `received` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
