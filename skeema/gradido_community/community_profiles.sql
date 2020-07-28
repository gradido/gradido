CREATE TABLE `community_profiles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_user_id` INT UNSIGNED NOT NULL,
  `profile_img` LONGBLOB NULL,
  `profile_desc` VARCHAR(2000) NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`state_user_id`) REFERENCES `state_users`(`id`)
) ENGINE=InnoDB;
