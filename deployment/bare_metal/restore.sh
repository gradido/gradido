#!/bin/bash

# This script will shut down all services, replace the whole database with the selected backup and restart the services

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
mysqldump --databases --single-transaction --quick --lock-tables=false > ${SCRIPT_DIR}/backup/mariadb-restore-backup-$(date +%d-%m-%Y_%H-%M-%S).sql -u ${DB_USER} -p${DB_PASSWORD} ${DB_DATABASE}

# Drop Database
mysql -u ${DB_USER} -p${DB_PASSWORD} <<EOFMYSQL
    DROP DATABASE $DB_DATABASE;
EOFMYSQL

# Restore Data
mysql -u ${DB_USER} -p${DB_PASSWORD} <<EOFMYSQL
    source ${SCRIPT_DIR}/backup/mariadb-restore-backup-14-01-2022_10-05-44.sql
EOFMYSQL

# Update database if needed (use dev_up for seeding setups)
yarn --cwd $PROJECT_ROOT/database up

# Start Services
pm2 start all