#!/bin/bash
# For that to work, node v12.19.0 needs to be installed with nvm for root
# or NPM_BIN Path and NVM_DIR must be adjusted

cd /var/www/html/gradido/frontend

NPM_BIN=/root/.nvm/versions/node/v12.19.0/bin/npm

export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

$NPM_BIN install
$NPM_BIN run build
