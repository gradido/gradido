#!/bin/bash

# Note: This is needed - since there is Summer-Time included in the default server Setup - UTC is REQUIRED for production data
timedatectl set-timezone UTC
timedatectl set-ntp on
apt purge ntp
systemctl start systemd-timesyncd

set -o allexport
SCRIPT_PATH=$(realpath ../bare_metal)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
LOCAL_SCRIPT_PATH=$(realpath $0)
LOCAL_SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/..
set +o allexport

# If install.sh will be called more than once
# We have to load the backend .env to get DB_USERNAME, DB_PASSWORD AND JWT_SECRET
# and the dht-node .env to get FEDERATION_DHT_SEED
export_var(){
  export $1=$(grep -v '^#' $PROJECT_ROOT/backend/.env | grep -e "$1" | sed -e 's/.*=//')
  export $1=$(grep -v '^#' $PROJECT_ROOT/dht-node/.env | grep -e "$1" | sed -e 's/.*=//')
}

if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    export_var 'DB_USER'
    export_var 'DB_PASSWORD'
    export_var 'JWT_SECRET'
fi

if [ -f "$PROJECT_ROOT/dht-node/.env" ]; then
    export_var 'FEDERATION_DHT_SEED'
fi


# Load .env or .env.dist if not present
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "$SCRIPT_PATH/.env" ]; then
    set -o allexport
    source $SCRIPT_PATH/.env
    set +o allexport
else
    set -o allexport
    source $SCRIPT_PATH/.env.dist
    set +o allexport
fi

# Configure git
git config pull.ff only

# Secure mysql https://gist.github.com/Mins/4602864
SECURE_MYSQL=$(expect -c "

set timeout 10
spawn mysql_secure_installation

expect \"Enter current password for root (enter for none):\"
send \"\r\"

expect \"Switch to unix_socket authentication:\"
send \"Y\r\"

expect \"Change the root password?\"
send \"n\r\"

expect \"Remove anonymous users?\"
send \"y\r\"

expect \"Disallow root login remotely?\"
send \"y\r\"

expect \"Remove test database and access to it?\"
send \"y\r\"

expect \"Reload privilege tables now?\"
send \"y\r\"

expect eof
")
echo "$SECURE_MYSQL"

# create db user
export DB_USER=gradido
export DB_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);

# run all commands which must be called in gradido user space
sudo -u gradido $LOCAL_SCRIPT_DIR/install_gradido.sh 

# Configure nginx
rm /etc/nginx/sites-enabled/default
ln -s $SCRIPT_PATH/nginx/sites-enabled/default /etc/nginx/sites-enabled
ln -s $SCRIPT_PATH/nginx/common /etc/nginx/
rmdir /etc/nginx/conf.d
ln -s $SCRIPT_PATH/nginx/conf.d /etc/nginx/

# setup https with certbot
certbot certonly --nginx --non-interactive --agree-tos --domains $COMMUNITY_HOST --email $COMMUNITY_SUPPORT_MAIL

# Install logrotate
cp $SCRIPT_PATH/logrotate/gradido.conf /etc/logrotate.d/gradido.conf

# setup db user
mysql <<EOFMYSQL
    CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'localhost';
    FLUSH PRIVILEGES;
EOFMYSQL

# Start gradido
# Note: on first startup some errors will occur - nothing serious
sudo -u gradido $SCRIPT_PATH/start.sh 