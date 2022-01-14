#!/bin/bash

# update system
sudo apt-get update
sudo apt-get upgrade

# update pm2
sudo yarn global add pm2
pm2 update