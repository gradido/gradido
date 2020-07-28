CREATE TABLE `transaction_group_addaddress` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` int UNSIGNED NOT NULL,
  `address_type_id` int UNSIGNED NOT NULL,
  `public_key` binary(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
