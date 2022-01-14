#!/bin/bash

# This script will shut down all services, backup the whole database and restart the services

# Find current directory & configure paths
set -o allexport
SCRIPT_PATH=$(realpath $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../..
set +o allexport

# Load backend .env for DB_USERNAME, DB_PASSWORD & DB_DATABASE
set -o allexport
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    source $PROJECT_ROOT/backend/.env
else
    source $PROJECT_ROOT/backend/.env.dist
fi
set +o allexport

# Stop Services
pm2 stop all

# Backup data
mysqldump --databases --single-transaction --quick --lock-tables=false > ${SCRIPT_DIR}/backup/mariadb-backup-$(date +%d-%m-%Y_%H-%M-%S).sql -u ${DB_USER} -p${DB_PASSWORD} ${DB_DATABASE}

# Start Services
pm2 start all