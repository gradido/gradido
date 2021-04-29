CREATE TABLE `transaction_group_addaddress` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int unsigned NOT NULL,
  `address_type_id` int unsigned NOT NULL,
  `remove_from_group` BOOLEAN DEFAULT FALSE,
  `public_key` binary(32) NOT NULL,
  `state_user_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
