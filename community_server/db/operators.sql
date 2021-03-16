CREATE TABLE `operators` ( 
 `id` INT NOT NULL AUTO_INCREMENT , 
 `username` VARCHAR(128) NOT NULL , 
 `data_base64` VARCHAR(255) NOT NULL , 
 PRIMARY KEY (`id`), UNIQUE (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

