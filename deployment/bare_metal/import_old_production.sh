#!/bin/bash

set -o allexport
SCRIPT_PATH=$(realpath $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../..
set +o allexport

BACKUP_FILE_LOGIN=$1 #gradido_login_22-01-24.sql
BACKUP_FILE_COMMUNITY=$2 #gradido_node_22-01-24.sql

# Load backend .env for DB_USERNAME, DB_PASSWORD & DB_DATABASE
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    export $(cat $PROJECT_ROOT/backend/.env | sed 's/#.*//g' | xargs)
else
    export $(cat $PROJECT_ROOT/backend/.env.dist | sed 's/#.*//g' | xargs)
fi

# Delete whole database
sudo mysql -uroot -e "show databases" | grep -v Database | grep -v mysql| grep -v information_schema| gawk '{print "drop database `" $1 "`;select sleep(0.1);"}' | sudo mysql -uroot

BACKUP_LOGIN=$SCRIPT_DIR/backup/$BACKUP_FILE_LOGIN
BACKUP_COMMUNITY=$SCRIPT_DIR/backup/$BACKUP_FILE_COMMUNITY

# import backup login
mysql -u ${DB_USER} -p${DB_PASSWORD} <<EOFMYSQL
    source $BACKUP_LOGIN
EOFMYSQL

# import backup community
mysql -u ${DB_USER} -p${DB_PASSWORD} <<EOFMYSQL
    source $BACKUP_COMMUNITY
EOFMYSQL