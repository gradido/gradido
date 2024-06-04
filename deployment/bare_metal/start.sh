#!/bin/bash
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
echo 'Configuring nginx to serve the update-page' >> $UPDATE_HTML
ln -sf $SCRIPT_DIR/nginx/sites-available/update-page.conf $SCRIPT_DIR/nginx/sites-enabled/default
sudo /etc/init.d/nginx restart

# stop all services
echo 'Stop and delete all Gradido services' >> $UPDATE_HTML
pm2 delete all
pm2 save

# git
BRANCH=$1
echo "Starting with git pull - branch:$BRANCH" >> $UPDATE_HTML
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
echo "====================================================================================================" >> $UPDATE_HTML
IFS="," read -a API_ARRAY <<< $FEDERATION_COMMUNITY_APIS
for api in "${API_ARRAY[@]}"
do
  export FEDERATION_APIVERSION=$api
  # calculate port by remove '_' and add value of api to baseport
  port=${api//_/}
  FEDERATION_PORT=${FEDERATION_COMMUNITY_API_PORT:-5000}
  FEDERATION_PORT=$(($FEDERATION_PORT + $port))
  export FEDERATION_PORT
  echo "create ngingx config: location /api/$FEDERATION_APIVERSION  to  http://127.0.0.1:$FEDERATION_PORT" >> $UPDATE_HTML
  envsubst '$FEDERATION_APIVERSION, $FEDERATION_PORT' < $NGINX_CONFIG_DIR/gradido-federation.conf.template >> $NGINX_CONFIG_DIR/gradido-federation.conf.locations
done
unset FEDERATION_APIVERSION
unset FEDERATION_PORT
echo "====================================================================================================" >> $UPDATE_HTML

# *** 2nd read gradido-federation.conf file in env variable to be replaced in 3rd step
export FEDERATION_NGINX_CONF=$(< $NGINX_CONFIG_DIR/gradido-federation.conf.locations)

# *** 3rd generate gradido nginx config including federation modules per api-version
echo 'Generate new gradido nginx config' >> $UPDATE_HTML
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
echo 'Generate new update-page nginx config' >> $UPDATE_HTML
case "$URL_PROTOCOL" in
 'https') TEMPLATE_FILE="update-page.conf.ssl.template" ;;
       *) TEMPLATE_FILE="update-page.conf.template" ;;
esac
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $NGINX_CONFIG_DIR/$TEMPLATE_FILE > $NGINX_CONFIG_DIR/update-page.conf

echo "====================================================================================================" >> $UPDATE_HTML
echo "Clean folders: tmp, node_modules, build; recreate .env files" >> $UPDATE_HTML
# Clean tmp folder - remove yarn files
find -path "/tmp" -name "yarn--*" -exec rm -r {} \;

# Remove node_modules folders
# we had problems with corrupted node_modules folder
rm -Rf $PROJECT_ROOT/database/node_modules
rm -Rf $PROJECT_ROOT/backend/node_modules
rm -Rf $PROJECT_ROOT/frontend/node_modules
rm -Rf $PROJECT_ROOT/admin/node_modules
rm -Rf $PROJECT_ROOT/dht-node/node_modules
rm -Rf $PROJECT_ROOT/federation/node_modules

# Remove build folders
# we had problems with corrupted incremtal builds
rm -Rf $PROJECT_ROOT/database/build
rm -Rf $PROJECT_ROOT/backend/build
rm -Rf $PROJECT_ROOT/frontend/build
rm -Rf $PROJECT_ROOT/admin/build
rm -Rf $PROJECT_ROOT/dht-node/build
rm -Rf $PROJECT_ROOT/federation/build

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
echo "====================================================================================================" >> $UPDATE_HTML

# Install & build database
echo "====================================================================================================" >> $UPDATE_HTML
echo 'Updating database' >> $UPDATE_HTML
echo "====================================================================================================" >> $UPDATE_HTML
cd $PROJECT_ROOT/database
yarn install
yarn build
if [ "$DEPLOY_SEED_DATA" = "true" ]; then
  yarn dev_up
  yarn dev_reset
else
  yarn up
fi

# Install & build backend
echo "====================================================================================================" >> $UPDATE_HTML
echo 'Updating backend' >> $UPDATE_HTML
echo "====================================================================================================" >> $UPDATE_HTML
cd $PROJECT_ROOT/backend
# TODO maybe handle this differently?
unset NODE_ENV
yarn install
yarn build
if [ "$DEPLOY_SEED_DATA" = "true" ]; then
  yarn seed
fi
# TODO maybe handle this differently?
export NODE_ENV=production


# Install & build frontend
echo "====================================================================================================" >> $UPDATE_HTML
echo 'Updating frontend' >> $UPDATE_HTML
echo "====================================================================================================" >> $UPDATE_HTML
cd $PROJECT_ROOT/frontend
# TODO maybe handle this differently?
unset NODE_ENV
# TODO this is the quick&dirty solution for the openssl security topic, please see https://stackoverflow.com/questions/69692842/error-message-error0308010cdigital-envelope-routinesunsupported
export NODE_OPTIONS=--openssl-legacy-provider

# upgrade yarn and node versions
nvm use v20.0.0
yarn set version stabel
yarn cache clear
yarn install
yarn build
# TODO maybe handle this differently?
export NODE_ENV=production

# Install & build admin
echo "====================================================================================================" >> $UPDATE_HTML
echo 'Updating admin' >> $UPDATE_HTML
echo "====================================================================================================" >> $UPDATE_HTML
cd $PROJECT_ROOT/admin
# TODO maybe handle this differently?
unset NODE_ENV
# downgrade yarn and node versions
nvm use
yarn set version 1.22.19
yarn cache clear
yarn install
yarn build
# TODO maybe handle this differently?
export NODE_ENV=production

# Install & build dht-node
echo "====================================================================================================" >> $UPDATE_HTML
echo 'Updating dht-node' >> $UPDATE_HTML
echo "====================================================================================================" >> $UPDATE_HTML
cd $PROJECT_ROOT/dht-node
# TODO maybe handle this differently?
unset NODE_ENV
yarn install
yarn build
# TODO maybe handle this differently?
export NODE_ENV=production

# Install & build federation
echo "====================================================================================================" >> $UPDATE_HTML
echo 'Updating federation' >> $UPDATE_HTML
echo "====================================================================================================" >> $UPDATE_HTML
cd $PROJECT_ROOT/federation
# TODO maybe handle this differently?
unset NODE_ENV
yarn install
yarn build
# TODO maybe handle this differently?
export NODE_ENV=production

# start after building all to use up less ressources
pm2 start --name gradido-backend "yarn --cwd $PROJECT_ROOT/backend start" -l $GRADIDO_LOG_PATH/pm2.backend.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
#pm2 start --name gradido-frontend "yarn --cwd $PROJECT_ROOT/frontend start" -l $GRADIDO_LOG_PATH/pm2.frontend.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
#pm2 start --name gradido-admin "yarn --cwd $PROJECT_ROOT/admin start" -l $GRADIDO_LOG_PATH/pm2.admin.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
pm2 save
if [ ! -z $FEDERATION_DHT_TOPIC ]; then
  pm2 start --name gradido-dht-node "yarn --cwd $PROJECT_ROOT/dht-node start" -l $GRADIDO_LOG_PATH/pm2.dht-node.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
  pm2 save
else
  echo "=====================================================================" >> $UPDATE_HTML
  echo "WARNING: FEDERATION_DHT_TOPIC not configured. DHT-Node not started..."  >> $UPDATE_HTML
  echo "=====================================================================" >> $UPDATE_HTML
fi  

# set FEDERATION_PORT from FEDERATION_COMMUNITY_APIS
IFS="," read -a API_ARRAY <<< $FEDERATION_COMMUNITY_APIS
for api in "${API_ARRAY[@]}"
do
  export FEDERATION_API=$api
  echo "FEDERATION_API=$FEDERATION_API" >> $UPDATE_HTML
  export MODULENAME=gradido-federation-$api
  echo "MODULENAME=$MODULENAME" >> $UPDATE_HTML
  # calculate port by remove '_' and add value of api to baseport
  port=${api//_/}
  FEDERATION_PORT=${FEDERATION_COMMUNITY_API_PORT:-5000}
  FEDERATION_PORT=$(($FEDERATION_PORT + $port))
  export FEDERATION_PORT
  echo "====================================================" >> $UPDATE_HTML
  echo " start $MODULENAME listening on port=$FEDERATION_PORT" >> $UPDATE_HTML
  echo "====================================================" >> $UPDATE_HTML
#  pm2 delete $MODULENAME
  pm2 start --name $MODULENAME "yarn --cwd $PROJECT_ROOT/federation start" -l $GRADIDO_LOG_PATH/pm2.$MODULENAME.$TODAY.log --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
  pm2 save
done

# let nginx showing gradido
echo 'Configuring nginx to serve gradido again' >> $UPDATE_HTML
ln -sf $SCRIPT_DIR/nginx/sites-available/gradido.conf $SCRIPT_DIR/nginx/sites-enabled/default
sudo /etc/init.d/nginx restart

# keep the update log
cat $UPDATE_HTML >> $GRADIDO_LOG_PATH/update.$TODAY.log

# release lock
rm $LOCK_FILE
