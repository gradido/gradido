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
LOCAL_SCRIPT_DIR=$(dirname $LOCAL_SCRIPT_PATH)
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

# Configure fail2ban, seems to not run out of the box on Debian 12
echo -e "[sshd]\nbackend = systemd" | tee /etc/fail2ban/jail.d/sshd.conf
# enable nginx-limit-req filter to block also user which exceed nginx request limiter
echo -e "[nginx-limit-req]\nenabled = true\nlogpath  = $SCRIPT_PATH/log/nginx-error.*.log" | tee /etc/fail2ban/jail.d/nginx-limit-req.conf
# enable nginx bad request filter 
echo -e "[nginx-bad-request]\nenabled = true\nlogpath  = $SCRIPT_PATH/log/nginx-error.*.log" | tee /etc/fail2ban/jail.d/nginx-bad-request.conf
systemctl restart fail2ban

# Configure nginx
rm /etc/nginx/sites-enabled/default
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/nginx/sites-available/gradido.conf.template > $SCRIPT_PATH/nginx/sites-available/gradido.conf
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/nginx/sites-available/update-page.conf.template > $SCRIPT_PATH/nginx/sites-available/update-page.conf
mkdir $SCRIPT_PATH/nginx/sites-enabled
ln -s $SCRIPT_PATH/nginx/sites-available/update-page.conf $SCRIPT_PATH/nginx/sites-enabled/default
ln -s $SCRIPT_PATH/nginx/sites-enabled/default /etc/nginx/sites-enabled
ln -s $SCRIPT_PATH/nginx/common /etc/nginx/
rmdir /etc/nginx/conf.d
ln -s $SCRIPT_PATH/nginx/conf.d /etc/nginx/

# setup https with certbot
certbot certonly --nginx --non-interactive --agree-tos --domains $COMMUNITY_HOST --email $COMMUNITY_SUPPORT_MAIL

# Install node 16. with nvm, with nodesource is depracted
sudo -u gradido bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash'
# Close and reopen your terminal to start using nvm or run the following to use it now:
sudo -u gradido bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
sudo -u gradido bash -c '. $HOME/.nvm/nvm.sh && nvm install 16' # first installed version will be set to default automatic

# Install yarn
sudo -u gradido bash -c '. $HOME/.nvm/nvm.sh && npm i -g yarn'

# Install pm2
sudo -u gradido bash -c '. $HOME/.nvm/nvm.sh && npm i -g pm2 && pm2 startup'

# Install logrotate
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/logrotate/gradido.conf.template > $SCRIPT_PATH/logrotate/gradido.conf
cp $SCRIPT_PATH/logrotate/gradido.conf /etc/logrotate.d/gradido.conf

# create db user
export DB_USER=gradido
# create a new password only if it not already exist
if [ -z "${DB_PASSWORD}" ]; then
    export DB_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);
fi
mysql <<EOFMYSQL
    CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'localhost';
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

# set all created or modified files back to belonging to gradido
chown -R gradido:gradido $PROJECT_ROOT

# create cronjob to delete yarn output in /tmp and for making backups regulary
sudo -u gradido crontab < $LOCAL_SCRIPT_DIR/crontabs.txt

# Start gradido
# Note: on first startup some errors will occur - nothing serious
sudo -u gradido $SCRIPT_PATH/start.sh 