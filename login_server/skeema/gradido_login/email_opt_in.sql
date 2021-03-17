CREATE TABLE `email_opt_in` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `verification_code` bigint unsigned NOT NULL,
  `email_opt_in_type_id` int NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resend_count` int DEFAULT '0',
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verification_code` (`verification_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
