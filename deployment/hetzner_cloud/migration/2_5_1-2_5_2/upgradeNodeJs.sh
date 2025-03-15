#!/bin/bash
# check for parameter
if [ -z "$1" ]; then
    echo "Usage: Please provide a branch name as the first argument."
    exit 1
fi

# stop all services
pm2 delete all
pm2 save

# upgrade node js version
nvm install 18.20.7
nvm use 18.20.7
nvm alias default 18.20.7
npm install -g pm2 yarn
nvm uninstall 16

# Start gradido
sudo -u gradido $SCRIPT_PATH/start.sh $1