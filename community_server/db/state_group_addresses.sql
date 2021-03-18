CREATE TABLE `state_group_addresses` (
  `id` int(11) NOT NULL,
  `state_group_id` int(11) NOT NULL,
  `public_key` binary(32) NOT NULL,
  `address_type_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
