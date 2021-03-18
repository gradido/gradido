CREATE TABLE `state_users` (
  `id` int(11) NOT NULL,
  `index_id` smallint(6) NOT NULL,
  `state_group_id` int(11) NOT NULL,
  `public_key` binary(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
