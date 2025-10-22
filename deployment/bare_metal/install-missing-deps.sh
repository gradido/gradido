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

# unzip needed for bun install script
if ! command -v unzip &> /dev/null
then
    echo "'unzip' is missing, will be installed now!"
    sudo apt-get install -y unzip
fi

# check for some tools and install them, when missing
# bun https://bun.com/install, faster packet-manager as yarn
BUN_VERSION_FILE="$SCRIPT_DIR/.bun-version"
if [ ! -f "$BUN_VERSION_FILE" ]; then
    echo ".bun-version file not found at: $BUN_VERSION_FILE"
    exit 1
fi
BUN_VERSION="$(cat "$BUN_VERSION_FILE" | tr -d '[:space:]')"
if ! command -v bun &> /dev/null
then    
    echo "'bun' is missing, v$BUN_VERSION will be installed now!"
    curl -fsSL https://bun.com/install | bash -s "bun-v${BUN_VERSION}"
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
else 
    CURRENT_VERSION="$(bun --version | tr -d '[:space:]')"
    if [ "$CURRENT_VERSION" != "$BUN_VERSION" ]
    then
        echo "'bun' is outdated, v$BUN_VERSION will be installed now!"
        curl -fsSL https://bun.com/install | bash -s "bun-v${BUN_VERSION}"
    fi
fi
# turbo https://turborepo.com/docs/getting-started
if ! command -v turbo &> /dev/null
then
    echo "'turbo' is missing, will be installed now!"
    bun install --global turbo
fi

# rust and grass 
if ! command -v cargo &> /dev/null
then
    echo "'cargo' is missing, will be installed now!"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    export CARGO_HOME="$HOME/.cargo"
    export PATH="$CARGO_HOME/bin:$PATH"
fi
if ! command -v grass &> /dev/null
then
    echo "'grass' is missing, will be installed now!"
    cargo install grass
fi
