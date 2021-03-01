#!/bin/bash

[! -z "${FOLDER_NAME}"] && FOLDER_NAME=community_server

COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\e[33m"
COLOR_NONE="\033[0m"

SCRIPT=`realpath -s $0`
SCRIPTPATH=`dirname $SCRIPT`
#echo -e "script: $SCRIPT, Path: $SCRIPTPATH "

cd /var/www/html
if [ ! -d "$FOLDER_NAME" ] ; then
	mkdir $FOLDER_NAME
else
	chmod -R 0755 $FOLDER_NAME
fi
cd $FOLDER_NAME
cp -r $SCRIPTPATH/src .
cp -r $SCRIPTPATH/config .
cp -r $SCRIPTPATH/composer.json .
cp -r $SCRIPTPATH/webroot .
composer install 
if [ ! -d "tmp" ] ; then
	mkdir tmp
	chown -R www-data:www-data ./tmp
fi
if [ ! -d "logs" ] ; then
	mkdir logs
	chown -R www-data:www-data ./logs
fi

cd ..
chown -R www-data:www-data $FOLDER_NAME
chmod -R 0755 $FOLDER_NAME/src
chmod -R 0755 $FOLDER_NAME/config
chmod -R 0755 $FOLDER_NAME/webroot 
