#!/bin/bash

# This script will shut down all services, backup the whole database and restart the services

# Find current directory & configure paths
set -o allexport
SCRIPT_PATH=$(realpath $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../..
set +o allexport

# Load backend .env for DB_USERNAME, DB_PASSWORD & DB_DATABASE
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    export $(cat $PROJECT_ROOT/backend/.env | sed 's/#.*//g' | xargs)
else
    export $(cat $PROJECT_ROOT/backend/.env.dist | sed 's/#.*//g' | xargs)
fi

# Stop Services
pm2 stop gradido-backend

# Backup data
mysqldump --databases --single-transaction --quick --hex-blob --lock-tables=false > ${SCRIPT_DIR}/backup/mariadb-backup-$(date +%d-%m-%Y_%H-%M-%S).sql -u ${DB_USER} -p${DB_PASSWORD} ${DB_DATABASE}

# Start Services
pm2 start gradido-backend