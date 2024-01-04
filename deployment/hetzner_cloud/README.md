# Setup on Hetzner Cloud Server
Suggested minimal Plan: CX41
4x vCPU, 16 GB Ram, 160 GB Disk Space, 20.71 € per month (04.01.2024) 

Suggested OS:
Debian 12

For Hetzner Cloud Server a cloud config can be attached, which will be run before first start
https://community.hetzner.com/tutorials/basic-cloud-config/de
https://cloudinit.readthedocs.io/en/latest/reference/examples.html
You can use our [cloudConfig.yaml](./cloudConfig.yaml) but you must insert you own ssh public key, 
like this:
```yaml  
ssh_authorized_keys:
  - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAkLGbzbG7KIGfkssKJBkc/0EVAzQ/8vjvVHzNdxhK8J yourname
```

## After Setup Cloud Server with cloudConfig.yaml
### setup your domain pointing on server ip address 
### login to your new server as root
```bash
ssh -i /path/to/privKey root@gddhost.tld
```

### Change default shell

```bash
chsh -s /bin/bash
chsh -s /bin/bash gradido
```

### Set password for user `gradido`

```bash
$ passwd gradido
# enter new password twice
```

### Switch to the new user

```bash
su gradido
```

### Test authentication via SSH

If you logout from the server you can test authentication:

```bash
$ ssh -i /path/to/privKey gradido@gddhost.tld
# This should log you in and allow you to use sudo commands, which will require the user's password
```

### Disable password root login via ssh

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.org
sudo sed -i -e '/^\(#\|\)PermitRootLogin/s/^.*$/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i '$a AllowUsers gradido' /etc/ssh/sshd_config
sudo /etc/init.d/ssh restart
```

### Test SSH Access only, no root ssh access

```bash
$ ssh gradido@gddhost.tld
# Will result in in either a passphrase request for your key or the message 'Permission denied (publickey)'
$ ssh -i /path/to/privKey root@gddhost.tld
# Will result in 'Permission denied (publickey)'
$ ssh -i /path/to/privKey gradido@gddhost.tld
# Will succeed after entering the correct keys passphrase (if any)
```

### Install `Gradido` code
```bash
cd ~
git clone https://github.com/gradido/gradido.git
```
### Edit Config 
```bash
cd ~/gradido/deployment
cp ./bare_metal/.env.dist ./hetzner_cloud/.env