CREATE TABLE `transaction_signatures` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` int UNSIGNED NOT NULL,
  `signature` binary(64) NOT NULL,
  `pubkey` binary(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
