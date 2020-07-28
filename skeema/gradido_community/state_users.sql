CREATE TABLE `state_users` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `index_id` smallint NOT NULL DEFAULT 0,
  `group_id` int UNSIGNED NOT NULL DEFAULT 0,
  `public_key` binary(32) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `disabled` tinyint DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_key` (`public_key`)
) ENGINE=InnoDB;
