#!/bin/bash
# called from install.sh as gradido user
# ENV variables from install.sh are accessable by child scripts
# changing don't count for calling script

# Configure nginx
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/nginx/sites-available/gradido.conf.template > $SCRIPT_PATH/nginx/sites-available/gradido.conf
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/nginx/sites-available/update-page.conf.template > $SCRIPT_PATH/nginx/sites-available/update-page.conf
mkdir $SCRIPT_PATH/nginx/sites-enabled
ln -s $SCRIPT_PATH/nginx/sites-available/update-page.conf $SCRIPT_PATH/nginx/sites-enabled/default

# Install node 16. with nvm, with nodesource is depracted
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Close and reopen your terminal to start using nvm or run the following to use it now:
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 16 # first installed version will be set to default automatic

# Install yarn
npm i -g yarn

# Install pm2
npm i -g pm2 && pm2 startup

# Install logrotate
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/logrotate/gradido.conf.template > $SCRIPT_PATH/logrotate/gradido.conf

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

# create cronjob to delete yarn output in /tmp and for making backups regulary
crontab < $LOCAL_SCRIPT_DIR/crontabs.txt
