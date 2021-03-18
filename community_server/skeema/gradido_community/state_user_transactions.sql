CREATE TABLE `state_user_transactions` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_user_id` int UNSIGNED NOT NULL,
  `transaction_id` int UNSIGNED NOT NULL,
  `transaction_type_id` int UNSIGNED NOT NULL,
  `balance` bigint(20) DEFAULT 0,
  `balance_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
