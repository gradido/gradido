CREATE TABLE `groups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `alias` varchar(190) NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `home` varchar(255) DEFAULT "/",
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `alias` (`alias`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 