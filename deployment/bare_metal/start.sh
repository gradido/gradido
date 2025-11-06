#!/bin/bash
# stop if something fails
set -euo pipefail

# check for parameter
FAST_MODE=false
POSITIONAL_ARGS=()

# loop through arguments
for arg in "$@"; do
  case "$arg" in
    -f|--fast)
      FAST_MODE=true
      ;;
    *)
      POSITIONAL_ARGS+=("$arg")
      ;;
  esac
done

# set $1, $2, ... only with position arguments
set -- "${POSITIONAL_ARGS[@]}"
BRANCH_NAME="$1"

# check for parameter
if [ -z "$BRANCH_NAME" ]; then
    echo "Usage: $0 [--fast] <branchName> [--fast]"
    exit 1
fi
echo "Use branch: $BRANCH_NAME"
if [ "$FAST_MODE" = true ] ; then 
  echo "Use fast mode, keep packet manager, turbo and build cache"
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

# called always on exit, regardless of error or success
cleanup() {
  # release lock
  rm $LOCK_FILE
}
trap cleanup EXIT

# find today string
TODAY=$(date +"%Y-%m-%d")

# Create a new updating.html from the template
\cp $SCRIPT_DIR/nginx/update-page/updating.html.template $UPDATE_HTML

# store real console stream in fd 3
if test -t 1; then
  # stdout is a TTY - normal console
  exec 3> /dev/tty
else
  # stdout is not a TTY - probably Docker or CI
  exec 3> /proc/$$/fd/1
fi
# redirect all output of the script to the UPDATE_HTML
# TODO: this might pose a security risk
exec > >(tee -a $UPDATE_HTML) 2>&1

# configure nginx for the update-page
echo 'Configuring nginx to serve the update-page'
nginx_restart() {
  sudo /etc/init.d/nginx restart || {
    echo -e "\e[33mwarn: nginx restart failed\e[0m" >&3
    # run nginx -t to show problem but ignore exit code to prevent trap
    { sudo nginx -t || true; } >&3
    echo -e "\e[33mwarn: will try to fix with 'sudo systemctl reset-failed nginx' and 'sudo systemctl start nginx'\e[0m" >&3
    sudo systemctl reset-failed nginx
    sudo systemctl start nginx
  }
}
ln -sf $SCRIPT_DIR/nginx/sites-available/update-page.conf $SCRIPT_DIR/nginx/sites-enabled/default
nginx_restart

# helper functions
log_step() {
    local message="$1"
    echo -e "\e[34m$message\e[0m" >&3 # blue in console
    echo "<p style="color:blue">$message</p>" >> "$UPDATE_HTML" # blue in html 
}
log_error() {
    local message="$1"
    echo -e "\e[31m$message\e[0m" >&3 # red in console
    echo "<span style="color:red">$message</span>" >> "$UPDATE_HTML" # red in html 
}
log_warn() {
    local message="$1"
    echo -e "\e[33m$message\e[0m" >&3 # orange in console
    echo "<span style="color:orange">$message</span>" >> "$UPDATE_HTML" # orange in html 
}
log_success() {
    local message="$1"
    echo -e "\e[32m$message\e[0m" >&3 # green in console
    echo "<p style="color:green">$message</p>" >> "$UPDATE_HTML" # green in html 
}

# called always on error, log error really visible with ascii art in red on console and html
# stop script execution
onError() {
  local exit_code=$?
  log_error "Command failed!"
  log_error " /\\_/\\ Line: $(caller 0)"
  log_error "( x.x )  Exit Code: $exit_code"
  log_error " >   <   Offending command: '$BASH_COMMAND'"
  log_error ""
  exit 1  
}
trap onError ERR

# stop all services
log_step "Stop and delete all Gradido services"
# make sure nvm is loaded
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# check if pm2  has processes, maybe it was already cleared from a failed update
# pm2 delete all if pm2 has no processes will trigger error and stop script
# so let's check first
if [ "$(echo "$(pm2 prettylist)" | tail -n 1)" != "[]" ]; then
  pm2 delete all
  pm2 save
else
  log_warn "PM2 is already empty"
fi

# git
log_step "Starting with git pull - branch:$BRANCH_NAME"
cd $PROJECT_ROOT
# TODO: this overfetches alot, but ensures we can use start.sh with tags
git fetch --all
git checkout $BRANCH_NAME
git pull
git submodule update --init --recursive
export BUILD_COMMIT="$(git rev-parse HEAD)"

# install missing dependencies
log_step "Install missing dependencies (nvm, correct nodejs version, bun, rust, grass)"
source ./deployment/bare_metal/install-missing-deps.sh

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

export DLT_NGINX_CONF="${DLT_NGINX_CONF:-# dlt disabled}"
# prepare inspector and gradido dlt node nginx config blocks if enabled
if [ "$DLT_CONNECTOR" = true ] ; then
  log_step "prepare inspector and dlt gradido node nginx config block"
  envsubst '$DLT_NODE_SERVER_PORT' < $NGINX_CONFIG_DIR/gradido-dlt.conf.template >> $NGINX_CONFIG_DIR/gradido-dlt.conf
  export DLT_NGINX_CONF=$(< $NGINX_CONFIG_DIR/gradido-dlt.conf)
  rm $NGINX_CONFIG_DIR/gradido-dlt.conf
fi

# *** 2nd read gradido-federation.conf file in env variable to be replaced in 3rd step
export FEDERATION_NGINX_CONF=$(< $NGINX_CONFIG_DIR/gradido-federation.conf.locations)

# *** 3rd generate gradido nginx config including federation modules per api-version
log_step 'Generate new gradido nginx config'
case "$URL_PROTOCOL" in
 'https') TEMPLATE_FILE="gradido.conf.ssl.template" ;;
       *) TEMPLATE_FILE="gradido.conf.template" ;;
esac
envsubst '$FEDERATION_NGINX_CONF,$DLT_NGINX_CONF' < $NGINX_CONFIG_DIR/$TEMPLATE_FILE > $NGINX_CONFIG_DIR/gradido.conf.tmp
unset FEDERATION_NGINX_CONF
unset DLT_NGINX_CONF
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

# Define all relevant subdirectories
MODULES=(
  database
  backend
  frontend
  admin
  dht-node
  federation
)
if [ "$DLT_CONNECTOR" = true ] ; then
  MODULES+=("inspector")
  MODULES+=("dlt-connector")
fi

if [ "$FAST_MODE" = false ] ; then 
  log_step 'Clean tmp, bun and yarn cache'
  # Clean tmp folder - remove yarn files
  # ignore error/warnings, we want only to remove all yarn files
  find /tmp -name "yarn--*" -exec rm -r {} \; || true
  # Clean user cache folder
  rm -Rf ~/.cache/yarn
  # Clean bun cache
  rm -Rf ~/.bun/install/cache

  log_step 'Remove all node_modules, turbo cache and build folders'
  
  EXTENDED_MODULES=("" config-schema "${MODULES[@]}")
  # Remove node_modules, build and .turbo folders for all modules inclusive config-schema and project root
  for dir in "${EXTENDED_MODULES[@]}"; do
    base="$PROJECT_ROOT"
    # if dir isn't empty add to base
    [ -n "$dir" ] && base="$PROJECT_ROOT/$dir"

    rm -rf $base/node_modules
    rm -rf $base/build
    rm -rf $base/.turbo
  done
fi

# Regenerate .env files for all modules
log_step 'Regenerate .env files'
for dir in "${MODULES[@]}"; do
  base="$PROJECT_ROOT/$dir"
  # Backup .env file if exists
  if [ -f "$base/.env" ]; then
    cp -f $base/.env $base/.env.bak
  fi
  envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $base/.env.template > $base/.env
done

# Install all node_modules
log_step 'Installing node_modules'
bun install

# build all modules
log_step 'build all modules'
turbo build --env-mode=loose --concurrency=$(nproc)

# build inspector and dlt-connector
if [ "$DLT_CONNECTOR" = true ]; then
  log_step 'build inspector'
  cd $PROJECT_ROOT/inspector
  bun install
  bun run build

  log_step 'build dlt-connector'
  cd $PROJECT_ROOT/dlt-connector
  bun install
  bun run build
  
  cd $PROJECT_ROOT
fi

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

# start after building all to use up less ressources
pm2 start --name gradido-backend \
 "env TZ=UTC NODE_ENV=production node ./build/index.js" \
 --cwd $PROJECT_ROOT/backend \
 -l $GRADIDO_LOG_PATH/pm2.backend.$TODAY.log \
 --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'

if [ "$DLT_CONNECTOR" = true ] ; then
 pm2 start --name dlt-connector \
 "env TZ=UTC NODE_ENV=production bun ./build/index.js" \
 --cwd $PROJECT_ROOT/dlt-connector \
 -l $GRADIDO_LOG_PATH/pm2.dlt-connector.$TODAY.log \
 --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
fi

pm2 save
if [ ! -z $FEDERATION_DHT_TOPIC ]; then
  pm2 start --name gradido-dht-node \
    "env TZ=UTC NODE_ENV=production node ./build/index.js" \
    --cwd $PROJECT_ROOT/dht-node \
    -l $GRADIDO_LOG_PATH/pm2.dht-node.$TODAY.log \
    --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
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
  pm2 start --name $MODULENAME \
    "env TZ=UTC NODE_ENV=production node ./build/index.js" \
    --cwd $PROJECT_ROOT/federation \
    -l $GRADIDO_LOG_PATH/pm2.$MODULENAME.$TODAY.log \
    --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS'
  pm2 save
done

# let nginx showing gradido
log_step 'Configuring nginx to serve gradido again'
ln -sf $SCRIPT_DIR/nginx/sites-available/gradido.conf $SCRIPT_DIR/nginx/sites-enabled/default
nginx_restart

# keep the update log
cat $UPDATE_HTML >> $GRADIDO_LOG_PATH/update.$TODAY.log

log_success " /\\_/\\ "
log_success "( ^.^ )  Update finished successfully!"
log_success " >   <"
