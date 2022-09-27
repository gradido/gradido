
# Instructions To Run `Gradido` On Your Server

We split setting up `Gradido` on your server into two steps:

- [Preparing your server](#command-list-to-setup-your-server-be-ready-to-install-gradido)
- [Installing `Gradido`](#use-commands-in-installsh-manually-in-your-shell-for-now)

## Command List To Setup Your Server Be Ready To Install `Gradido`

We assume you have root access via ssh to your cleanly setup server.
Furthermore we assume you have debian (11 64bit) running.

Check your (Sub-)Domain with your Provider.
In this document `gddhost.tld` refers to your chosen domain.

### SSH into your server

```bash
ssh root@gddhost.tld
```

### Change root default shell

```bash
chsh -s /bin/bash
```

### Create user `gradido`

```bash
$ useradd -d /home/gradido -m gradido
$ passwd gradido
# enter new password twice
```

### Give the user priviledges

This might be omitted in order to harden security.

***!!! Attention !!!***

- Care: This will require another administering user if you don't want root access.
- Since this setup expects the user running the software be the same as the administering user,
  - you have to adjust the instructions according to that scenario.
  - you might lock yourself out, if done wrong.

#### Add the new user `gradido` to `sudo` group

```bash
usermod -a -G sudo gradido
```

### Change gradido default shell

```bash
chsh -s /bin/bash gradido
```

### Install sudo

```bash
apt-get install sudo
```

### Switch to the new user

```bash
su gradido
```

### Register first ssh key for user `gradido`

```bash
$ mkdir ~/.ssh
$ chmod 700 ~/.ssh
$ nano ~/.ssh/authorized_keys
# insert public key
# ctrl + x
# save
```

### Test authentication via SSH

```bash
$ ssh -i /path/to/privKey gradido@gddhost.tld
# This should log you in and allow you to use sudo commands, which will require the user's password
```

### Disable password authentication and root login

```bash
$ cd /etc/ssh
$ sudo cp sshd_config sshd_config.org
$ sudo nano sshd_config
# change 'PermitRootLogin yes' to `PermitRootLogin no`
# change 'PasswordAuthentication yes' to 'PasswordAuthentication no'
# change 'UsePAM yes' to 'UsePAM no'
# ctrl + x
# save
$ sudo /etc/init.d/ssh restart
```

### Test SSH Access only, no root ssh access

```bash
$ ssh gradido@gddhost.tld
# Will result in in either a password request for your key or the message 'Permission denied (publickey)'
$ ssh -i /path/to/privKey root@gddhost.tld
# Will result in 'Permission denied (publickey)'
$ ssh -i /path/to/privKey gradido@gddhost.tld
# Will succeed after entering the correct keys password (if any)
```

### Update system

```bash
sudo apt-get update
sudo apt-get upgrade
```

### Install security tools

#### Install: `ufw`

```bash
sudo apt-get install ufw
sudo ufw allow http
sudo ufw allow https
sudo ufw allow ssh
sudo ufw enable
```

#### Install: `fail2ban`

```bash
sudo apt-get install -y fail2ban
sudo /etc/init.d/fail2ban restart
```

### Install `Gradido` code

```bash
sudo apt-get install -y git
cd ~
git clone https://github.com/gradido/gradido.git
```

### Timezone

*Note: This is needed - since there is Summer-Time included in the default server Setup - UTC is REQUIRED for production data.*

```bash
sudo timedatectl set-timezone UTC
sudo timedatectl set-ntp on
sudo apt purge ntp
sudo systemctl start systemd-timesyncd
# timedatectl to verify
```

### Adjust the values in `.env`

***!!! Attention !!!***

*Don't forget this step!
All your following installations in `install.sh` will fail!*

*Notes:*

- *`;` cannot be part of any value!*
- *The GitHub secret is created on GitHub in Settings -> Webhooks.*

#### Create `.env` and set values

```bash
$ cd gradido/deployment/bare_metal
$ cp .env.dist .env
$ nano .env
# adjust values accordingly
```

## Use Commands In `install.sh` Manually In Your Shell For Now

The script `install.sh` is not yet ready to run directly.
Use it as pattern to do all steps manually in your terminal shell.

*TODO: Bring the `install.sh` script to run in the shell.*

***!!! Attention !!!***

- *Commands in `install.sh`:*
  - *The commands for setting the paths in the used env variables are not working directly in the terminal, consider the out commented commands for this purpose.*

Follow the commands in `./install.sh` as installation pattern.

## Define cronjob to compensate yarn output in /tmp

> yarn creates output in /tmp directory, which must be deleted regularly and will be done per cronjob
> on stage1 a hourly job is necessary by setting the following job in the crontab for the gradido user
> crontab -e opens the crontab in edit-mode and insert the following entry:
> "0 * * * * find /tmp -name "yarn--*" -cmin +60 -exec rm -r {} \; > /dev/null"
> on stage2 a daily job is necessary by setting the following job in the crontab for the gradido user
> crontab -e opens the crontab in edit-mode and insert the following entry:
> "0 4 * * * find /tmp -name "yarn--*" -ctime +1 -exec rm -r {} \; > /dev/null"

