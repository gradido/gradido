#!/bin/bash

# This install script requires the minimum requirements already installed.
# How to do this is described in detail in [setup.md](./setup.md)

# Load .env or .env.dist if not present
set -o allexport
if [ -f ".env" ]; then
    source .env
else
    source .env.dist
fi
set +o allexport

# Install mariadb
sudo apt-get install -y mariadb-server
sudo mysql_secure_installation
# Enter current password for root (enter for none): enter
# Switch to unix_socket authentication [Y/n] Y
# Change the root password? [Y/n] n
# Remove anonymous users? [Y/n] Y
# Disallow root login remotely? [Y/n] Y
# Remove test database and access to it? [Y/n] Y
# Reload privilege tables now? [Y/n] Y

# create db user
DB_USER=gradido 
DB_PASSWORD=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-32};echo);
# create table 
#create database gradido_community 
#    DEFAULT CHARACTER SET utf8mb4
#    DEFAULT COLLATE utf8mb4_unicode_ci;
# GRANT ALL PRIVILEGES ON gradido_community.* TO '$DB_USER'@'localhost';
sudo mysql <<EOFMYSQL
    CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWD';
    GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'localhost';
    FLUSH PRIVILEGES;
EOFMYSQL
# TODO generate .env
echo $DB_PASSWORD

#TODO go to database
#TODO generate this
#TODO database setup
cp .env.dist .env

#TODO go to backend
#TODO generate this
#TODO database setup
#TODOchange jwt secret
#TODO change email releated stuff
cp .env.dist .env

#TODO go to frontend
#TODO generate this
#TODO backend url
#TODO admin url
cp .env.dist .env

#TODO go to admin
#TODO generate this
#TODO change graphqlurl
#TODO change wallet url

cp .env.dist .env

#TODO import old database

# Install nginx
sudo apt-get install -y nginx
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /home/gradido/gradido/deployment/bare_metal/nginx/sites-available/gradido.conf /etc/nginx/sites-available
sudo ln -s /etc/nginx/sites-available/gradido.conf /etc/nginx/sites-enabled
sudo ln -s /home/gradido/gradido/deployment/bare_metal/nginx/sites-available/update-page.conf /etc/nginx/sites-available
cd /etc/nginx
sudo ln -s /home/gradido/gradido/deployment/bare_metal/nginx/common common

# Install yarn
sudo apt-get install -y curl
sudo apt-get install -y gnupg
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update
sudo apt-get install -y yarn

# Install node 16.x
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential

# Install pm2
sudo yarn global add pm2

# Install certbot
sudo apt-get install -y certbot
sudo apt-get install -y python3-certbot-nginx
sudo certbot --certonly
> Enter email address (used for urgent renewal and security notices) > support@gradido.net
> Please read the Terms of Service at > Y
> Would you be willing, once your first certificate is successfully issued, to > N
> No names were found in your configuration files. Please enter in your domain > stage1.gradido.net

git config pull.ff only

# Allow nginx configuration and restart for gradido
sudo nano /etc/sudoers.d/gradido
> gradido ALL=(ALL) NOPASSWD: /etc/init.d/nginx start,/etc/init.d/nginx stop,/etc/init.d/nginx restart
sudo chmod a+rw /etc/nginx/sites-enabled

# Webhooks (optional)
sudo apt install webhook
nano ~/hooks.json
```
[
  {
    "id": "github",
    "execute-command": "/home/gradido/gradido/deployment/bare_metal/start.sh",
    "command-working-directory": "/home/gradido/gradido/deployment/bare_metal",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hash-sha1",
            "secret": "secret",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/new_deployment",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
```

webhook -hooks ~/hooks.json &
# or for debugging
webhook -hooks ~/hooks.json -verbose