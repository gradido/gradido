#!/bin/bash

# Ensure required tools are installed

# make sure correct node version is installed
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
if ! command -v nvm &> /dev/null
then
    echo "'nvm' is missing, will be installed now!"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
fi
install_nvm() {
    nvm install 
    nvm use 
    nvm alias default 
    npm i -g yarn pm2
    pm2 startup
}
nvm use || install_nvm

# check for some tools and install them, when missing
# bun https://bun.sh/install, faster packet-manager as yarn
if ! command -v bun &> /dev/null
then
    if ! command -v unzip &> /dev/null
    then
        echo "'unzip' is missing, will be installed now!"
        sudo apt-get install -y unzip
    fi
    echo "'bun' is missing, will be installed now!"
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi
# turbo https://turborepo.com/docs/getting-started
if ! command -v turbo &> /dev/null
then
    echo "'turbo' is missing, will be installed now!"
    bun install --global turbo
fi
