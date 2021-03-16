CREATE TABLE `transaction_creations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int(10) unsigned NOT NULL,
  `state_user_id` int(10) unsigned NOT NULL,
  `amount` bigint(20) NOT NULL,
  `ident_hash` binary(32) NOT NULL,
  `target_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
