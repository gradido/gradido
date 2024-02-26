#!/bin/bash
# check for parameter
if [ -z "$1" ]; then
    echo "Usage: Please provide a branch name as the first argument."
    exit 1
fi

set -o allexport
SCRIPT_PATH=$(realpath ../../../bare_metal)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
LOCAL_SCRIPT_PATH=$(realpath $0)
LOCAL_SCRIPT_DIR=$(dirname $LOCAL_SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../../..
set +o allexport


# Load .env or .env.dist if not present
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "$SCRIPT_PATH/.env" ]; then
    set -o allexport
    source $SCRIPT_PATH/.env
    set +o allexport
else
    set -o allexport
    source $SCRIPT_PATH/.env.dist
    set +o allexport
fi

# create db user
export DB_USER=gradido
# create a new password only if it not already exist
export DB_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c 32; echo);


mysql <<EOFMYSQL
    ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    FLUSH PRIVILEGES;
EOFMYSQL

# Configure database
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/database/.env.template > $PROJECT_ROOT/database/.env

# Configure backend
export JWT_SECRET=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c 32; echo);
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/backend/.env.template > $PROJECT_ROOT/backend/.env

# Configure frontend
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/frontend/.env.template > $PROJECT_ROOT/frontend/.env

# Configure admin
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/admin/.env.template > $PROJECT_ROOT/admin/.env

# Configure dht-node
export FEDERATION_DHT_SEED=$(< /dev/urandom tr -dc a-f0-9 | head -c 32; echo);
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/dht-node/.env.template > $PROJECT_ROOT/dht-node/.env

# Configure federation
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/federation/.env.template > $PROJECT_ROOT/federation/.env

# set all created or modified files back to belonging to gradido
chown -R gradido:gradido $PROJECT_ROOT

# Start gradido
# Note: on first startup some errors will occur - nothing serious
sudo -u gradido $SCRIPT_PATH/start.sh $1