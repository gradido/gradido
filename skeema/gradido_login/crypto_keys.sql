CREATE TABLE `crypto_keys` (
 `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
 `private_key` VARBINARY(64) NOT NULL,
 `public_key` BINARY(32) NOT NULL,
 `crypto_key_type_id` INT NOT NULL DEFAULT '0',
 PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4; 
