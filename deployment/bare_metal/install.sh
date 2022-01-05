#!/bin/bash

# This install script requires the minimum requirements already installed.
# How to do this is described in detail in [setup.md](./setup.md)

# Install mariadb
sudo apt-get install -y mariadb-server
#TODO sudo mysql_secure_installation

# Install nginx
sudo apt-get install -y nginx

# Install yarn
sudo apt-get install -y curl
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update
sudo apt-get install -y yarn

# Install node 16.x
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pm2
sudo yarn global add pm2
