# Build Login-Server yourself 
## Linux (Ubuntu) Packets
install build essentials 

```bash
sudo apt install -y gcovr build-essential gettext libcurl4-openssl-dev libssl-dev libsodium-dev libboost-dev
``` 

## CMake
I use CMake for build file generation and the Login-Server needs at least version v3.18.2
You can build and install it from source. 
The Version in apt is sadly to old.

```bash
git clone https://github.com/Kitware/CMake.git --branch v3.18.2
cd CMake
./bootstrap --parallel=$(nproc) && make -j$(nproc) && sudo make install
```

## dependencies 
load git submodules if you haven't done it yet

```bash
git submodule update --init --recursive
```

## build tools
build protoc and page compiler needed for generating some additional code

```bash
cd scripts
./prepare_build.sh 
```

## build 
build login-server in debug mode

```bash
cd scripts
./build_debug.sh
```

## multilanguage text 
Login-Server uses gettext translations found after build in src/LOCALE
On Linux Login-Server expect the *.po files in folder /etc/grd_login/LOCALE
on windows next to Binary in Folder LOCALE.
So please copy them over by yourself on first run or after change.

If you like to update some translations your find a messages.pot in src/LOCALE.
Use it together with poedit and don't forget to copy over *.po files after change to /etc/grd_login/LOCALE
To update messages.pot run 

```bash
./scripts/compile_pot.sh 
```
This will be also called by ./scripts/build_debug.sh

## database
Login-Server needs a db to run, it is tested with mariadb
table definitions are found in folder ./skeema/gradido_login
Currently at least one group must be present in table groups.
For example:
```sql
INSERT INTO `groups` (`id`, `alias`, `name`, `url`, `host`, `home`, `description`) VALUES
(1, 'docker', 'docker gradido group', 'localhost', 'localhost', '/', 'gradido test group for docker with blockchain db');
```

## configuration
Login-Server needs a configuration file to able to run. 
On Linux it expect it to find the file /etc/grd_login/grd_login.properties
and /etc/grd_login/grd_login_test.properties for unittest

Example configuration (ini-format)
```ini
# Port for Web-Interface
HTTPServer.port = 1200
# Port for json-Interface (used by new backend)
JSONServer.port = 1201
# default group id for new users, if no group was choosen
Gradido.group_id = 1

# currently not used
crypto.server_admin_public  = f909a866baec97c5460b8d7a93b72d3d4d20cc45d9f15d78bd83944eb9286b7f
# Server admin Passphrase 
# nerve execute merit pool talk hockey basic win cargo spin disagree ethics swear price purchase say clutch decrease slow half forest reform cheese able 
#

# TODO: auto-generate in docker build step
# expect valid hex 32 character long (16 Byte)
# salt for hashing user password, should be moved into db generated and saved per user, used for hardening against hash-tables
crypto.server_key = a51ef8ac7ef1abf162fb7a65261acd7a

# TODO: auto-generate in docker build step
# salt for hashing user encryption key, expect valid hex, as long as you like, used in sha512
crypto.app_secret = 21ffbbc616fe 

# for url forwarding to old frontend, path of community server
phpServer.url = http://localhost/
# host for community server api calls
phpServer.host = localhost
# port for community server api calls
phpServer.port = 80

# Path for Login-Server Web-Interface used for link-generation
loginServer.path = http://localhost/account
# default language for new users and if no one is logged in
loginServer.default_locale = de

# db setup tested with mariadb, should also work with mysql
loginServer.db.host = localhost
loginServer.db.name = gradido_login
loginServer.db.user = root
loginServer.db.password = 
loginServer.db.port = 3306

# check email path for new frontend for link generation in emails
frontend.checkEmailPath = http://localhost/vue/reset

# disable email all together
email.disable = true

# setup email smtp server for sending emails
#email.username =
#email.sender =
#email.admin_receiver = 
#email.password = 
#email.smtp.url =
#email.smtp.port = 

# server setup types: test, staging or production
# used mainly to decide if using http or https for links
# test use http and staging and production uses https
ServerSetupType=test
dev.default_group = docker

# Session timeout in minutes
session.timeout = 15

# Disabling security features for faster develop and testing
unsecure.allow_passwort_via_json_request = 1
unsecure.allow_auto_sign_transactions = 1
unsecure.allow_cors_all = 1

# default disable, passwords must contain a number, a lower character, a high character, special character, and be at least 8 characters long
unsecure.allow_all_passwords = 1

```
