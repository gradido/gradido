#!/bin/bash

# This script will shut down all services, replace the whole database with the selected backup and restart the services

# Find current directory & configure paths
set -o allexport
SCRIPT_PATH=$(realpath $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../..
set +o allexport

# Parameter is a proper file?
export BACKUP_FILE=${SCRIPT_DIR}/backup/$1 
if [ ! -f "$BACKUP_FILE" ]; then
    return "File '$BACKUP_FILE' does not exist" 2>/dev/null || exit 1
fi

# Load database .env for DB_USERNAME, DB_PASSWORD & DB_DATABASE
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "$PROJECT_ROOT/database/.env" ]; then
    export $(cat $PROJECT_ROOT/database/.env | sed 's/#.*//g' | xargs)
else
    export $(cat $PROJECT_ROOT/database/.env.dist | sed 's/#.*//g' | xargs)
fi

# Stop gradido-backend service
pm2 stop gradido-backend

# Backup data
mysqldump --databases --single-transaction --quick --hex-blob --lock-tables=false > ${SCRIPT_DIR}/backup/mariadb-restore-backup-$(date +%d-%m-%Y_%H-%M-%S).sql -u ${DB_USER} -p${DB_PASSWORD} ${DB_DATABASE}

# Drop Database
mysql -u ${DB_USER} -p${DB_PASSWORD} <<EOFMYSQL
    DROP DATABASE $DB_DATABASE
EOFMYSQL

# Restore Data
mysql -u ${DB_USER} -p${DB_PASSWORD} <<EOFMYSQL
    source $BACKUP_FILE
EOFMYSQL

# Update database if needed (use dev_up for seeding setups)
turbo up

# Start gradido-backend service
pm2 start gradido-backend