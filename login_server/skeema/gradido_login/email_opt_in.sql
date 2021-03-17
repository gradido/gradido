CREATE TABLE `email_opt_in` (
  `id` int UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `verification_code` bigint unsigned NOT NULL,
  `email_opt_in_type_id` int NOT NULL,
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `resend_count` int DEFAULT 0,
  `updated` DATETIME on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verification_code` (`verification_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
