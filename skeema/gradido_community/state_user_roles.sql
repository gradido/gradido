CREATE TABLE `state_user_roles` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
