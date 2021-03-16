#!/bin/bash
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\e[33m"
COLOR_NONE="\033[0m"

LOGIN_DB_USER=gradido_login
LOGIN_DB_NAME=gradido_login
LOGIN_DB_PASSWD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);

COMMUNITY_DB_USER=gradido_community
COMMUNITY_DB_NAME=gradido_community
COMMUNITY_DB_PASSWD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);

# create table 
mysql <<EOFMYSQL
	create database $LOGIN_DB_NAME 
		DEFAULT CHARACTER SET utf8mb4
		DEFAULT COLLATE utf8mb4_unicode_ci;
	create database $COMMUNITY_DB_NAME
		DEFAULT CHARACTER SET utf8mb4
		DEFAULT COLLATE utf8mb4_unicode_ci;
    create database IF NOT EXISTS _skeema_tmp
		DEFAULT CHARACTER SET utf8mb4
		DEFAULT COLLATE utf8mb4_unicode_ci;
    CREATE USER '$LOGIN_DB_USER'@'localhost' IDENTIFIED BY '$LOGIN_DB_PASSWD';
	GRANT ALL PRIVILEGES ON $LOGIN_DB_NAME.* TO '$LOGIN_DB_USER'@'localhost';
	GRANT ALL PRIVILEGES ON _skeema_tmp.* TO '$LOGIN_DB_USER'@'localhost';

    CREATE USER '$COMMUNITY_DB_USER'@'localhost' IDENTIFIED BY '$COMMUNITY_DB_PASSWD';
	GRANT ALL PRIVILEGES ON $COMMUNITY_DB_NAME.* TO '$COMMUNITY_DB_USER'@'localhost';
	GRANT ALL PRIVILEGES ON _skeema_tmp.* TO '$COMMUNITY_DB_USER'@'localhost';
	FLUSH PRIVILEGES;
EOFMYSQL

# populate db of login-server
cd ../login_server/skeema 
sudo cat << EOF > .skeema
[production]
flavor=mariadb:10.3.25
host=127.0.0.1
port=3306
user=$LOGIN_DB_USER
EOF
cd gradido_login 
sudo cat << EOF > .skeema 
default-character-set=utf8mb4
default-collation=utf8mb4_unicode_ci
schema=$LOGIN_DB_NAME
EOF

source $HOME/.gvm/scripts/gvm
gvm use go1.14.4
skeema push -p$LOGIN_DB_PASSWD

cd ../../..
# populate db of community-server
cd community_server/skeema
sudo cat << EOF > .skeema
[production]
flavor=mariadb:10.3.25
host=127.0.0.1
port=3306
user=$COMMUNITY_DB_USER
EOF
cd gradido_community 
sudo cat << EOF > .skeema 
default-character-set=utf8mb4
default-collation=utf8mb4_unicode_ci
schema=$COMMUNITY_DB_NAME
EOF

skeema push -p$COMMUNITY_DB_PASSWD

echo -e "${COLOR_YELLOW}Login-Server db password: $LOGIN_DB_PASSWD${COLOR_NONE}"
echo -e "${COLOR_YELLOW}Community-Server db password: $COMMUNITY_DB_PASSWD${COLOR_NONE}"
