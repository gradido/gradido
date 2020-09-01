CREATE TABLE `crypto_keys` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `private_key` binary(80) NOT NULL,
  `public_key` binary(32) NOT NULL,
  `crypto_key_type_id` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE(`public_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 
