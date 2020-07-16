CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(255) DEFAULT '',
  `password` bigint(25) unsigned NOT NULL,
  `pubkey` binary(32) DEFAULT NULL,
  `privkey` binary(80) DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `email_checked` tinyint(1) NOT NULL DEFAULT 0,
  `passphrase_shown` tinyint(1) NOT NULL DEFAULT 0,
  `language` varchar(4) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT 'de',
  `disabled` BOOLEAN NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
