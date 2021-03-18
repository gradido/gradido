CREATE TABLE `state_errors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `state_user_id` int(10) unsigned NOT NULL,
  `transaction_type_id` int(10) unsigned NOT NULL,
  `created` datetime NOT NULL,
  `message_json` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
