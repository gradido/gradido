#!/bin/bash

EMPTY_UPDATE_HTML=/var/www/html/updating_original.html
UPDATE_HTML=/var/www/html/updating.html
LOCK_FILE=/root/relay.lock
PROJECT_PATH=/var/www/html/gradido
SITE_CONFIG=stage1
UPDATE_SITE_CONFIG=stage1_updating

# this script can be called for example from webhookrelay.com relay 
# to auto-deploy automatic after a update to the master branch

if [ -f $LOCK_FILE ] ; then
  retVal="Already building!"
  return "${retVal}" 2>/dev/null || exit "${retVal}"
fi

touch $LOCK_FILE

# start with nearly empty html
# needed a nearly empty html page in the folder
cp $EMPTY_UPDATE_HTML $UPDATE_HTML

# let nginx showing a update page
# needed nginx site-configs in nginx folders
# gradido for running gradido servers
# gradido_updating for showing upddate.html idealy for all pathes
rm /etc/nginx/sites-enabled/$SITE_CONFIG
ln -s /etc/nginx/sites-available/$UPDATE_SITE_CONFIG /etc/nginx/sites-enabled/
service nginx restart

# stop login server
screen -XS login quit
echo 'starting with git pull<br>' >> $UPDATE_HTML
cd $PROJECT_PATH
# git checkout -f master
git pull
cd deployment/bare_metal
echo 'update schemas' >> $UPDATE_HTML
./update_db_schemas.sh
echo 'starting with rebuilding login-server<br>' >> $UPDATE_HTML
./build_and_start_login_server.sh
echo 'starting with rebuilding frontend<br>' >> $UPDATE_HTML
./build_frontend.sh


# let nginx showing gradido
rm /etc/nginx/sites-enabled/$UPDATE_SITE_CONFIG
ln -s /etc/nginx/sites-available/$SITE_CONFIG /etc/nginx/sites-enabled/
service nginx restart

rm $LOCK_FILE

