CREATE TABLE `state_balances` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `state_user_id` int(10) unsigned NOT NULL,
  `modified` datetime NOT NULL,
  `record_date`datetime NULL,
  `amount` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
