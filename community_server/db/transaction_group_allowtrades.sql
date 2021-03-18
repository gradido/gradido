
CREATE TABLE `transaction_group_allowtrades` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `allow` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
