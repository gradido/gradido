CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(255) DEFAULT '',
  `password` bigint unsigned NOT NULL,
  `pubkey` binary(32) DEFAULT NULL,
  `privkey` binary(80) DEFAULT NULL,
  `email_hash` binary(32) DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `email_checked` tinyint NOT NULL DEFAULT '0',
  `passphrase_shown` tinyint NOT NULL DEFAULT '0',
  `language` varchar(4) NOT NULL DEFAULT 'de',
  `disabled` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
