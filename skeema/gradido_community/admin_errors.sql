CREATE TABLE `admin_errors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `state_user_id` int(11) NOT NULL,
  `controller` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `msg` varchar(255) NOT NULL,
  `details` varchar(255) DEFAULT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
