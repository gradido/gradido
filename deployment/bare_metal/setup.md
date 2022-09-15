# Setup script to setup the server be ready to run gradido
# This assums you have root access via ssh to your cleanly setup server
# Furthermore this assumes you have debian (11 64bit) running

# Check your (Sub-)Domain with your Provider.
# In this document gddhost.tld refers to your chosen domain

> ssh root@gddhost.tld

# change root default shell
> chsh -s /bin/bash
# Create user `gradido`
> useradd -d /home/gradido -m gradido
> passwd gradido
>> enter new password twice

# Gives the user priviledges - this might be omitted in order to harden security
# Care: This will require another administering user if you don't want root access.
#       Since this setup expects the user running the software be the same as the administering user,
#       you have to adjust the instructions according to that scenario.
#       You might lock yourself out, if done wrong.
> usermod -a -G sudo gradido

# change gradido default shell
> chsh -s /bin/bash gradido
# Install sudo
> apt-get install sudo
# switch to the new user
> su gradido

# Register first ssh key for user `gradido`
> mkdir ~/.ssh
> chmod 700 ~/.ssh
> nano ~/.ssh/authorized_keys
>> insert public key
>> ctrl + x
>> save

# Test authentication via SSH
> ssh -i /path/to/privKey gradido@gddhost.tld
>> This should log you in and allow you to use sudo commands, which will require the user's password

# Disable password authentication & root login
> cd /etc/ssh
> sudo cp sshd_config sshd_config.org
> sudo nano sshd_config
>> change `PermitRootLogin yes` to `PermitRootLogin no`
>> change `#PasswordAuthentication yes` to `PasswordAuthentication no`
>> change `UsePAM yes` to `UsePAM no`
>> ctrl + x
>> save
> sudo /etc/init.d/ssh restart

# Test SSH Access only, no root ssh access
> ssh gradido@gddhost.tld
>> Will result in in either a password request for your key or the message `Permission denied (publickey)`
> ssh -i /path/to/privKey root@gddhost.tld
>> Will result in `Permission denied (publickey)`
> ssh -i /path/to/privKey gradido@gddhost.tld
>> Will succeed after entering the correct keys password (if any)

# update system
> sudo apt-get update
> sudo apt-get upgrade

# Install security tools
## ufw
> sudo apt-get install ufw
> sudo ufw allow http
> sudo ufw allow https
> sudo ufw allow ssh
> sudo ufw enable

## fail2ban
> sudo apt-get install -y fail2ban
> sudo /etc/init.d/fail2ban restart

# Install gradido
> sudo apt-get install -y git
> cd ~
> git clone https://github.com/gradido/gradido.git

# Timezone
# Note: This is needed - since there is Summer-Time included in the default server Setup - UTC is REQUIRED for production data
> sudo timedatectl set-timezone UTC
# > sudo timedatectl set-ntp on
# > sudo apt purge ntp
# > sudo systemctl start systemd-timesyncd
# >> timedatectl to verify

# Adjust .env
# NOTE ';' can not be part of any value
# The Github Secret is Created on Github in Settimgs -> Webhooks
> cd gradido/deployment/bare_metal
> cp .env.dist .env
> nano .env
>> Adjust values accordingly

# TODO the install.sh is not yet ready to run directly - consider to use it as pattern to do it manually

!!! ATTENTION:

- NGINX:
  - Be aware to set the values for NGINX in the following files according to your needs before you install NGINX!
    - `./nginx/sites-available/gradido.conf`
    - `./nginx/sites-available/update-page.conf`
- Commands in `./install.sh`:
  - The commands for setting the paths in the used env variables are not working directly in the terminal, consider the out commented commands for this purpose, see below.

Follow the commands in `./install.sh`.

