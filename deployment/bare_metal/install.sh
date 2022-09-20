#!/bin/bash

# This install script requires the minimum requirements already installed.
# How to do this is described in detail in [setup.md](./setup.md)

# Find current directory & configure paths
set -o allexport
SCRIPT_PATH=$(realpath $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../..
set +o allexport

# Load .env or .env.dist if not present
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "$SCRIPT_DIR/.env" ]; then
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

# Install mariadb
sudo apt-get install -y mariadb-server
sudo mysql_secure_installation
# Enter current password for root (enter for none): enter
# Switch to unix_socket authentication [Y/n] Y
# Change the root password? [Y/n] n
# Remove anonymous users? [Y/n] Y
# Disallow root login remotely? [Y/n] Y
# Remove test database and access to it? [Y/n] Y
# Reload privilege tables now? [Y/n] Y

# Install nginx
sudo apt-get install -y nginx
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /home/gradido/gradido/deployment/bare_metal/nginx/sites-available/gradido.conf /etc/nginx/sites-available
# sudo ln -s /etc/nginx/sites-available/gradido.conf /etc/nginx/sites-enabled
sudo ln -s /home/gradido/gradido/deployment/bare_metal/nginx/sites-available/update-page.conf /etc/nginx/sites-available
sudo ln -s /home/gradido/gradido/deployment/bare_metal/nginx/common /etc/nginx/
sudo rmdir /etc/nginx/conf.d
sudo ln -s /home/gradido/gradido/deployment/bare_metal/nginx/conf.d /etc/nginx/

# Allow nginx configuration and restart for gradido
#TODO generate file
sudo nano /etc/sudoers.d/gradido
> gradido ALL=(ALL) NOPASSWD: /etc/init.d/nginx start,/etc/init.d/nginx stop,/etc/init.d/nginx restart
sudo chmod a+rw /etc/nginx/sites-enabled

# Install node 16.x
sudo apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential

# Install yarn
sudo apt-get install -y gnupg
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update
sudo apt-get install -y yarn

# Install pm2
sudo yarn global add pm2
pm2 startup
> execute command output in shell

# Install certbot
sudo apt-get install -y certbot
sudo apt-get install -y python3-certbot-nginx
sudo certbot
> Enter email address (used for urgent renewal and security notices) > e.g. support@supportmail.com
> Please read the Terms of Service at > Y
> Would you be willing, once your first certificate is successfully issued, to > N
> No names were found in your configuration files. Please enter in your domain > stage1.gradido.net
# Note: this will throw an error regarding not beeing able to identify the nginx corresponding
#       config but produce the required certificate - thats perfectly fine this way
# Troubleshoot: to manually renew a certificate with running nginx use the following command:
#               (this might be required once to properly have things setup for the cron to autorenew)
# sudo certbot --nginx -d example.com -d www.example.com
# Troubleshoot: to check ut if things working you can use
# sudo certbot renew --dry-run

# Install logrotate
sudo apt-get install -y logrotate
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_DIR/logrotate/gradido.conf.template > $SCRIPT_DIR/logrotate/gradido.conf
sudo mv $SCRIPT_DIR/logrotate/gradido.conf /etc/logrotate.d/gradido.conf
sudo chown root:root /etc/logrotate.d/gradido.conf

# Install mysql autobackup
sudo apt-get install -y automysqlbackup

# Webhooks (optional) (for development)
sudo apt install -y webhook
# TODO generate
# put hook into github
# TODO adjust secret
# TODO adjust branch if needed
# https://stage1.gradido.net/hooks/github
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_DIR/webhook/hooks.json.template > ~/hooks.json

webhook -hooks ~/hooks.json &
# or for debugging
# webhook -hooks ~/hooks.json -verbose

# create db user
export DB_USER=gradido
export DB_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);
sudo mysql <<EOFMYSQL
    CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
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

# Start gradido
# Note: on first startup some errors will occur - nothing serious
./start.sh