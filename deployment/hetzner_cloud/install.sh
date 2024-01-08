#!/bin/bash

# Note: This is needed - since there is Summer-Time included in the default server Setup - UTC is REQUIRED for production data
timedatectl set-timezone UTC
timedatectl set-ntp on
apt purge ntp
systemctl start systemd-timesyncd

set -o allexport
SCRIPT_PATH=$(realpath ../bare_metal)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../..
set +o allexport

# Load .env or .env.dist if not present
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "./.env" ]; then
    set -o allexport
    source $SCRIPT_DIR/.env
    set +o allexport
else
    set -o allexport
    source $SCRIPT_DIR/.env.dist
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

# Configure nginx
rm /etc/nginx/sites-enabled/default
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_DIR/nginx/sites-available/gradido.conf.template > $SCRIPT_DIR/nginx/sites-available/gradido.conf
ln -s $SCRIPT_DIR/nginx/sites-available/gradido.conf /etc/nginx/sites-available
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_DIR/nginx/sites-available/update-page.conf.template > $SCRIPT_DIR/nginx/sites-available/update-page.conf
ln -s $SCRIPT_DIR/nginx/sites-available/update-page.conf /etc/nginx/sites-available
ln -s $SCRIPT_DIR/nginx/common /etc/nginx/
rmdir /etc/nginx/conf.d
ln -s $SCRIPT_DIR/nginx/conf.d /etc/nginx/

# setup https with certbot
certbot --nginx --non-interactive --agree-tos --domains $COMMUNITY_HOST --email $COMMUNITY_SUPPORT_MAIL

# Install node 16.x
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# Install yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
apt-get update
apt-get install -y yarn

# Install pm2
yarn global add pm2
pm2 startup

# Install logrotate
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_DIR/logrotate/gradido.conf.template > $SCRIPT_DIR/logrotate/gradido.conf
cp $SCRIPT_DIR/logrotate/gradido.conf /etc/logrotate.d/gradido.conf
chown root:root /etc/logrotate.d/gradido.conf

# create db user
export DB_USER=gradido
export DB_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);
mysql <<EOFMYSQL
    CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON 'gradido_community'.* TO '$DB_USER'@'localhost';
    FLUSH PRIVILEGES;
EOFMYSQL

# Configure database
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/database/.env.template > $PROJECT_ROOT/database/.env

# Configure backend
export JWT_SECRET=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/backend/.env.template > $PROJECT_ROOT/backend/.env

# Configure frontend
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/frontend/.env.template > $PROJECT_ROOT/frontend/.env

# Configure admin
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/admin/.env.template > $PROJECT_ROOT/admin/.env

# Configure dht-node
export FEDERATION_DHT_SEED=$(< /dev/urandom tr -dc a-f0-9 | head -c 32;echo);
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/dht-node/.env.template > $PROJECT_ROOT/dht-node/.env

# Configure federation
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/federation/.env.template > $PROJECT_ROOT/federation/.env

# create cronjob to delete yarn output in /tmp
# crontab -e
# hourly job: 0 * * * * find /tmp -name "yarn--*" -cmin +60 -exec rm -r {} \; > /dev/null
crontab -l | { cat; echo "0 * * * * find /tmp -name "yarn--*" -cmin +60 -exec rm -r {} \; > /dev/null"; } | crontab -
# daily job:  0 4 * * * find /tmp -name "yarn--*" -ctime +1 -exec rm -r {} \; > /dev/null
crontab -l | { cat; echo "0 4 * * * find /tmp -name "yarn--*" -ctime +1 -exec rm -r {} \; > /dev/null"; } | crontab -
# Start gradido
# Note: on first startup some errors will occur - nothing serious
$SCRIPT_PATH/start.sh