CREATE TABLE `state_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `index_id` varbinary(64) NOT NULL,
  `name` varchar(50) COLLATE utf8_bin NOT NULL,
  `root_public_key` binary(32) NOT NULL,
  `user_count` smallint(6) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
