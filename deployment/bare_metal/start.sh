#!/bin/bash

# TODO Load .env

# TODO update git branch

# Node build process can be memory hungry - make sure you have either enoght memory or swap space
export NODE_OPTIONS="--max-old-space-size=6000"

# Install & build database
# TODO change directory correcty
yarn install
yarn build

# Install & build backend
# TODO change directory correcty
yarn install
yarn build

# Install & build frontend
# TODO change directory correcty
yarn install
yarn build

# Install & build admin
# TODO change directory correcty
yarn install
yarn build

# start backend
# TODO pm2 stop gradido-backend
pm2 delete gradido-backend
# TODO working directory
pm2 start --name gradido-backend "yarn start"

# start frontend
# TODO pm2 stop gradido-frontend
pm2 delete gradido-frontend
# TODO working directory
pm2 start --name gradido-frontend "yarn start"

# start admin
# TODO pm2 stop gradido-admin
pm2 delete gradido-admin
# TODO working directory
pm2 start --name gradido-admin "yarn start"