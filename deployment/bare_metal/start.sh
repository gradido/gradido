#!/bin/bash

# check for some tools
# bun
if ! command -v bun &> /dev/null
then
    echo "'bun' is missing, will be installed now!"
    curl -fsSL https://bun.sh/install | bash
fi
if ! command -v turbo &> /dev/null
then
    echo "'turbo' is missing, will be installed now!"
    bun global add turbo
fi

# helper functions
log_step() {
    local message="$1"
    echo -e "\e[34m$message\e[0m" > /dev/tty # blue in console
    echo "<p style="color:blue">$message</p>" >> "$UPDATE_HTML" # blue in html 
}

# check for parameter
if [ -z "$1" ]; then
    echo "Usage: Please provide a branch name as the first argument."
    exit 1
fi
# Find current directory & configure paths
set -o allexport
SCRIPT_PATH=$(realpath $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
LOCK_FILE=$SCRIPT_DIR/update.lock
UPDATE_HTML=$SCRIPT_DIR/nginx/update-page/updating.html
PROJECT_ROOT=$SCRIPT_DIR/../..
NGINX_CONFIG_DIR=$SCRIPT_DIR/nginx/sites-available
set +o allexport

# enable nvm 
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use default

# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env

# We have to load the backend .env to get DB_USERNAME, DB_PASSWORD AND JWT_SECRET
# and the dht-node .env to get FEDERATION_DHT_SEED
export_var(){
  export $1=$(grep -v '^#' $PROJECT_ROOT/backend/.env | grep -e "$1" | sed -e 's/.*=//')
  export $1=$(grep -v '^#' $PROJECT_ROOT/dht-node/.env | grep -e "$1" | sed -e 's/.*=//')
}

if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    export_var 'DB_USER'
    export_var 'DB_PASSWORD'
    export_var 'JWT_SECRET'
fi

if [ -f "$PROJECT_ROOT/dht-node/.env" ]; then
    export_var 'FEDERATION_DHT_SEED'
fi

# Load .env or .env.dist if not present
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -o allexport
    source $SCRIPT_DIR/.env
    set +o allexport
else
    set -o allexport
    source $SCRIPT_DIR/.env.dist
    set +o allexport
fi

# set env variables dynamic if not already set in .env or .env.dist
: ${NGINX_SSL_CERTIFICATE:=/etc/letsencrypt/live/$COMMUNITY_HOST/fullchain.pem}
: ${NGINX_SSL_CERTIFICATE_KEY:=/etc/letsencrypt/live/$COMMUNITY_HOST/privkey.pem}

# export env variables
export NGINX_SSL_CERTIFICATE
export NGINX_SSL_CERTIFICATE_KEY

# lock start
if [ -f $LOCK_FILE ] ; then
  echo "Already building!"
  exit 1
fi
touch $LOCK_FILE

# find today string
TODAY=$(date +"%Y-%m-%d")

# Create a new updating.html from the template
\cp $SCRIPT_DIR/nginx/update-page/updating.html.template $UPDATE_HTML

# redirect all output of the script to the UPDATE_HTML and also have things on console
# TODO: this might pose a security risk
exec > >(tee -a $UPDATE_HTML) 2>&1

# configure nginx for the update-page
log_step 'Configuring nginx to serve the update-page'
ln -sf $SCRIPT_DIR/nginx/sites-available/update-page.conf $SCRIPT_DIR/nginx/sites-enabled/default
sudo /etc/init.d/nginx restart

# stop all services
log_step "Stop and delete all Gradido services"
pm2 delete all
pm2 save

# git
BRANCH=$1
log_step "Starting with git pull - branch:$BRANCH"
cd $PROJECT_ROOT
# TODO: this overfetches alot, but ensures we can use start.sh with tags
git fetch --all
git checkout $BRANCH
git pull
export BUILD_COMMIT="$(git rev-parse HEAD)"

# Generate gradido.conf from template
# *** 1st prepare for each apiversion the federation conf for nginx from federation-template
# *** set FEDERATION_PORT from FEDERATION_COMMUNITY_APIS and create gradido-federation.conf file
rm -f $NGINX_CONFIG_DIR/gradido.conf.tmp
rm -f $NGINX_CONFIG_DIR/gradido-federation.conf.locations
log_step "===================================================================================================="
IFS="," read -a API_ARRAY <<< $FEDERATION_COMMUNITY_APIS
for api in "${API_ARRAY[@]}"
do
  export FEDERATION_APIVERSION=$api
  # calculate port by remove '_' and add value of api to baseport
  port=${api//_/}
  FEDERATION_PORT=${FEDERATION_COMMUNITY_API_PORT:-5000}
  FEDERATION_PORT=$(($FEDERATION_PORT + $port))
  export FEDERATION_PORT
  log_step "create ngingx config: location /api/$FEDERATION_APIVERSION  to  http://127.0.0.1:$FEDERATION_PORT"
  envsubst '$FEDERATION_APIVERSION, $FEDERATION_PORT' < $NGINX_CONFIG_DIR/gradido-federation.conf.template >> $NGINX_CONFIG_DIR/gradido-federation.conf.locations
done
unset FEDERATION_APIVERSION
unset FEDERATION_PORT
log_step "===================================================================================================="

# *** 2nd read gradido-federation.conf file in env variable to be replaced in 3rd step
export FEDERATION_NGINX_CONF=$(< $NGINX_CONFIG_DIR/gradido-federation.conf.locations)

# *** 3rd generate gradido nginx config including federation modules per api-version
log_step 'Generate new gradido nginx config'
case "$URL_PROTOCOL" in
 'https') TEMPLATE_FILE="gradido.conf.ssl.template" ;;
       *) TEMPLATE_FILE="gradido.conf.template" ;;
esac
envsubst '$FEDERATION_NGINX_CONF' < $NGINX_CONFIG_DIR/$TEMPLATE_FILE > $NGINX_CONFIG_DIR/gradido.conf.tmp
unset FEDERATION_NGINX_CONF
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $NGINX_CONFIG_DIR/gradido.conf.tmp > $NGINX_CONFIG_DIR/gradido.conf
rm $NGINX_CONFIG_DIR/gradido.conf.tmp
rm $NGINX_CONFIG_DIR/gradido-federation.conf.locations

# Generate update-page.conf from template
log_step 'Generate new update-page nginx config'
case "$URL_PROTOCOL" in
 'https') TEMPLATE_FILE="update-page.conf.ssl.template" ;;
       *) TEMPLATE_FILE="update-page.conf.template" ;;
esac
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $NGINX_CONFIG_DIR/$TEMPLATE_FILE > $NGINX_CONFIG_DIR/update-page.conf

log_step 'Clean tmp and yarn cache'
# Clean tmp folder - remove yarn files
find /tmp -name "yarn--*" -exec rm -r {} \;
# Clean user cache folder
rm -Rf ~/.cache/yarn

log_step 'Remove all node_modules and build folders'
# Remove node_modules folders
# we had problems with corrupted node_modules folder
rm -Rf $PROJECT_ROOT/database/node_modules
rm -Rf $PROJECT_ROOT/config/node_modules
rm -Rf $PROJECT_ROOT/backend/node_modules
rm -Rf $PROJECT_ROOT/frontend/node_modules
rm -Rf $PROJECT_ROOT/admin/node_modules
rm -Rf $PROJECT_ROOT/dht-node/node_modules
rm -Rf $PROJECT_ROOT/federation/node_modules

# Remove build folders
# we had problems with corrupted incremtal builds
rm -Rf $PROJECT_ROOT/database/build
rm -Rf $PROJECT_ROOT/config/build
rm -Rf $PROJECT_ROOT/backend/build
rm -Rf $PROJECT_ROOT/frontend/build
rm -Rf $PROJECT_ROOT/admin/build
rm -Rf $PROJECT_ROOT/dht-node/build
rm -Rf $PROJECT_ROOT/federation/build

log_step 'Regenerate .env files'
# Regenerate .env files
cp -f $PROJECT_ROOT/database/.env $PROJECT_ROOT/database/.env.bak
cp -f $PROJECT_ROOT/backend/.env $PROJECT_ROOT/backend/.env.bak
cp -f $PROJECT_ROOT/frontend/.env $PROJECT_ROOT/frontend/.env.bak
cp -f $PROJECT_ROOT/admin/.env $PROJECT_ROOT/admin/.env.bak
cp -f $PROJECT_ROOT/dht-node/.env $PROJECT_ROOT/dht-node/.env.bak
cp -f $PROJECT_ROOT/federation/.env $PROJECT_ROOT/federation/.env.bak
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/database/.env.template > $PROJECT_ROOT/database/.env
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/backend/.env.template > $PROJECT_ROOT/backend/.env
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/frontend/.env.template > $PROJECT_ROOT/frontend/.env
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/admin/.env.template > $PROJECT_ROOT/admin/.env
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/dht-node/.env.template > $PROJECT_ROOT/dht-node/.env
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $PROJECT_ROOT/federation/.env.template > $PROJECT_ROOT/federation/.env

# Install all node_modules
log_step 'Installing node_modules'
bun install

# build all modules
log_step 'build all modules'
turbo build --env-mode=loose

# database
log_step 'Updating database'
if [ "$DEPLOY_SEED_DATA" = "true" ]; then
  log_step 'Clearing database'
  turbo clear --env-mode=loose
  turbo up --env-mode=loose
  log_step 'Seeding database'
  turbo seed --env-mode=loose
else
  turbo up --env-mode=loose
fi

nvm use default
# start after building all to use up less ressources
pm2 start --name gradido-backend "turbo backend#start --env-mode=loose" -l $GRADIDO_LOG_PATH/pm2.backend.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
#pm2 start --name gradido-frontend "yarn --cwd $PROJECT_ROOT/frontend start" -l $GRADIDO_LOG_PATH/pm2.frontend.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
#pm2 start --name gradido-admin "yarn --cwd $PROJECT_ROOT/admin start" -l $GRADIDO_LOG_PATH/pm2.admin.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
pm2 save
if [ ! -z $FEDERATION_DHT_TOPIC ]; then
  pm2 start --name gradido-dht-node "turbo dht-node#start --env-mode=loose" -l $GRADIDO_LOG_PATH/pm2.dht-node.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
  pm2 save
else
  log_step "====================================================================="
  log_step "WARNING: FEDERATION_DHT_TOPIC not configured. DHT-Node not started..."
  log_step "====================================================================="
fi

# set FEDERATION_PORT from FEDERATION_COMMUNITY_APIS
IFS="," read -a API_ARRAY <<< $FEDERATION_COMMUNITY_APIS
for api in "${API_ARRAY[@]}"
do
  export FEDERATION_API=$api
  log_step "FEDERATION_API=$FEDERATION_API"
  export MODULENAME=gradido-federation-$api
  log_step "MODULENAME=$MODULENAME"
  # calculate port by remove '_' and add value of api to baseport
  port=${api//_/}
  FEDERATION_PORT=${FEDERATION_COMMUNITY_API_PORT:-5000}
  FEDERATION_PORT=$(($FEDERATION_PORT + $port))
  export FEDERATION_PORT
  log_step "===================================================="
  log_step " start $MODULENAME listening on port=$FEDERATION_PORT"
  log_step "===================================================="
  pm2 start --name $MODULENAME "turbo federation#start --env-mode=loose" -l $GRADIDO_LOG_PATH/pm2.$MODULENAME.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
  pm2 save
done

# let nginx showing gradido
log_step 'Configuring nginx to serve gradido again'
ln -sf $SCRIPT_DIR/nginx/sites-available/gradido.conf $SCRIPT_DIR/nginx/sites-enabled/default
sudo /etc/init.d/nginx restart

# keep the update log
cat $UPDATE_HTML >> $GRADIDO_LOG_PATH/update.$TODAY.log

# release lock
rm $LOCK_FILE
