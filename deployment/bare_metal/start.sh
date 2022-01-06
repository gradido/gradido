#!/bin/bash

# TODO Load .env

# TODO update git branch

# Install & build database
# TODO change directory correcty
yarn install
yarn build
yarn up
# TODO only in staging!
yarn seed 

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
pm2 save

# start frontend
# TODO pm2 stop gradido-frontend
pm2 delete gradido-frontend
# TODO working directory
pm2 start --name gradido-frontend "yarn start"
pm2 save

# start admin
# TODO pm2 stop gradido-admin
pm2 delete gradido-admin
# TODO working directory
pm2 start --name gradido-admin "yarn start"
pm2 save

# restart nginx
sudo /etc/init.d/nginx restart