#!/bin/bash
# stop if something fails
set -euo pipefail

log_error() {
    local message="$1"
    echo -e "\e[31m$message\e[0m" # red in console
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

# check for parameter
if [ -z "$1" ]; then
    log_error "Usage: Please provide a branch name as the first argument."
    exit 1
fi

# Note: This is needed - since there is Summer-Time included in the default server Setup - UTC is REQUIRED for production data
timedatectl set-timezone UTC
timedatectl set-ntp on
apt purge ntp
systemctl start systemd-timesyncd

set -o allexport
SCRIPT_PATH=$(realpath ../bare_metal)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
LOCAL_SCRIPT_PATH=$(realpath $0)
LOCAL_SCRIPT_DIR=$(dirname $LOCAL_SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/..
set +o allexport

# Replace placeholder secrets in .env
echo 'Replace placeholder secrets in .env'
# Load .env or .env.dist if not present
# NOTE: all config values will be in process.env when starting
# the services and will therefore take precedence over the .env
if [ -f "$SCRIPT_PATH/.env" ]; then
    ENV_FILE="$SCRIPT_PATH/.env"

    # --- Secret Generators -------------------------------------------------------

    gen_jwt_secret() {
        # 32 Character, URL-safe: A-Z a-z 0-9 _ -
        tr -dc 'A-Za-z0-9_-' < /dev/urandom | head -c 32 2>/dev/null || true
    }

    gen_webhook_secret() {
        # URL-safe, longer security (40 chars)
        tr -dc 'A-Za-z0-9_-' < /dev/urandom | head -c 40 2>/dev/null || true
    }

    gen_binary_secret() {
        local bytes="$1"
        # Hex -> 2 chars pro byte
        openssl rand -hex "$bytes" 2>/dev/null || true
    }

    # --- Mapping of Placeholder -> Function --------------------------------------

    generate_secret_for() {
    case "$1" in
        jwt_secret)      gen_jwt_secret      ;;
        webhook_secret)  gen_webhook_secret  ;;
        binary8_secret)  gen_binary_secret 8 ;;
        binary16_secret) gen_binary_secret 16;;
        binary32_secret) gen_binary_secret 32;;
        *) 
            echo "Unknown Placeholder: $1" >&2 
            exit 1
            ;;
    esac
    }

    # --- Placeholder List --------------------------------------------------------

    placeholders=(
    "jwt_secret"
    "webhook_secret"
    "binary8_secret"
    "binary16_secret"
    "binary32_secret"
    )

    # --- Processing in .env -------------------------------------------------

    TMP_FILE="${ENV_FILE}.tmp"
    cp "$ENV_FILE" "$TMP_FILE"

    for ph in "${placeholders[@]}"; do
        # Iterate over all lines containing the placeholder
        while grep -q "$ph" "$TMP_FILE"; do
            new_value=$(generate_secret_for "$ph")
            # Replace only the first occurrence per line
            sed -i "0,/$ph/s//$new_value/" "$TMP_FILE"
        done
    done

    # Write back
    mv "$TMP_FILE" "$ENV_FILE"
    chown gradido:gradido "$ENV_FILE"
fi

# If install.sh will be called more than once
# We have to load the backend .env to get DB_USERNAME and DB_PASSWORD 
export_var(){
  export $1=$(grep -v '^#' $PROJECT_ROOT/backend/.env | grep -e "$1" | sed -e 's/.*=//')
}

if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    export_var 'DB_USER'
    export_var 'DB_PASSWORD'
fi

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

# Configure git
git config pull.ff only

# Secure mysql https://gist.github.com/Mins/4602864
SECURE_MYSQL=$(expect -c "

set timeout 10
spawn mysql_secure_installation

expect \"Enter current password for root (enter for none):\"
send \"\r\"

expect \"Switch to unix_socket authentication:\"
send \"Y\r\"

expect \"Change the root password?\"
send \"n\r\"

expect \"Remove anonymous users?\"
send \"y\r\"

expect \"Disallow root login remotely?\"
send \"y\r\"

expect \"Remove test database and access to it?\"
send \"y\r\"

expect \"Reload privilege tables now?\"
send \"y\r\"

expect eof
")
echo "$SECURE_MYSQL"

# Configure fail2ban, seems to not run out of the box on Debian 12
echo -e "[sshd]\nbackend = systemd" | tee /etc/fail2ban/jail.d/sshd.conf
# enable nginx-limit-req filter to block also user which exceed nginx request limiter
echo -e "[nginx-limit-req]\nenabled = true\nlogpath  = $SCRIPT_PATH/log/nginx-error.*.log" | tee /etc/fail2ban/jail.d/nginx-limit-req.conf
# enable nginx bad request filter 
echo -e "[nginx-bad-request]\nenabled = true\nlogpath  = $SCRIPT_PATH/log/nginx-error.*.log" | tee /etc/fail2ban/jail.d/nginx-bad-request.conf
systemctl restart fail2ban

# Configure nginx
rm /etc/nginx/sites-enabled/default
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/nginx/sites-available/gradido.conf.template > $SCRIPT_PATH/nginx/sites-available/gradido.conf
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/nginx/sites-available/update-page.conf.template > $SCRIPT_PATH/nginx/sites-available/update-page.conf
mkdir -p $SCRIPT_PATH/nginx/sites-enabled
ln -sf $SCRIPT_PATH/nginx/sites-available/update-page.conf $SCRIPT_PATH/nginx/sites-enabled/default
ln -sf $SCRIPT_PATH/nginx/sites-enabled/default /etc/nginx/sites-enabled
ln -sf $SCRIPT_PATH/nginx/common /etc/nginx/
if [ -e /etc/nginx/conf.d ] && [ ! -L /etc/nginx/conf.d ]; then
    rm -rf /etc/nginx/conf.d
    ln -s $SCRIPT_PATH/nginx/conf.d /etc/nginx/
fi

# Make nginx restart automatic
mkdir -p /etc/systemd/system/nginx.service.d
# Define the content to be put into the override.conf file
CONFIG_CONTENT="[Unit]
StartLimitIntervalSec=500
StartLimitBurst=5

[Service]
Restart=on-failure
RestartSec=5s"

# Write the content to the override.conf file
echo "$CONFIG_CONTENT" | sudo tee /etc/systemd/system/nginx.service.d/override.conf >/dev/null

# Reload systemd to apply the changes
sudo systemctl daemon-reload

# setup https with certbot
certbot certonly --nginx --non-interactive --agree-tos --domains $COMMUNITY_HOST --email $COMMUNITY_SUPPORT_MAIL

# run as gradido user (until EOF)
sudo -u gradido bash <<'EOF'
    export NVM_DIR="/home/gradido/.nvm"
    NODE_VERSION="v18.20.7"
    export NVM_DIR
    # Install nvm if it doesn't exist
    if [ ! -d "$NVM_DIR" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi
    # Load nvm 
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    # Install Node if not already installed
    if ! nvm ls $NODE_VERSION >/dev/null 2>&1; then
        nvm install $NODE_VERSION
    fi
    # Install yarn and pm2
    npm i -g yarn pm2 
EOF
# Load nvm 
export NVM_DIR="/home/gradido/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# start pm2
pm2 startup

# Install logrotate
envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < $SCRIPT_PATH/logrotate/gradido.conf.template > $SCRIPT_PATH/logrotate/gradido.conf
cp $SCRIPT_PATH/logrotate/gradido.conf /etc/logrotate.d/gradido.conf

# create db user
export DB_USER=gradido
# create a new password only if it not already exist
: "${DB_PASSWORD:=$(tr -dc '_A-Za-z0-9' < /dev/urandom | head -c 32)}"

# Check if DB_PASSWORD is still empty, then exit with an error
if [ -z "${DB_PASSWORD}" ]; then
    echo "Error: Failed to generate DB_PASSWORD."
    exit 1
fi
export DB_PASSWORD

mysql <<EOFMYSQL
    CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'localhost';
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

# create cronjob to delete yarn output in /tmp and for making backups regulary
sudo -u gradido crontab < $LOCAL_SCRIPT_DIR/crontabs.txt

# Start gradido
# Note: on first startup some errors will occur - nothing serious
sudo -u gradido $SCRIPT_PATH/start.sh $1