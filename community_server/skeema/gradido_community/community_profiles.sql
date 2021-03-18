CREATE TABLE `community_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `state_user_id` int(10) unsigned NOT NULL,
  `profile_img` longblob,
  `profile_desc` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `state_user_id` (`state_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
