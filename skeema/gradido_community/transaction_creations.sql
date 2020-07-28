CREATE TABLE `transaction_creations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` int UNSIGNED NOT NULL,
  `state_user_id` int UNSIGNED NOT NULL,
  `amount` bigint NOT NULL,
  `ident_hash` binary(32) NOT NULL,
  `target_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
