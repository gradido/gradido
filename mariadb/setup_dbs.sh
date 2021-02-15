create database gradido_login 
		DEFAULT CHARACTER SET utf8mb4
		DEFAULT COLLATE utf8mb4_unicode_ci;
    create database IF NOT EXISTS _skeema_tmp
		DEFAULT CHARACTER SET utf8mb4
		DEFAULT COLLATE utf8mb4_unicode_ci;
    CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWD';
	GRANT ALL PRIVILEGES ON gradido_login.* TO '$DB_USER'@'localhost';
	GRANT ALL PRIVILEGES ON _skeema_tmp.* TO '$DB_USER'@'localhost';
	FLUSH PRIVILEGES;