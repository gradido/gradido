## Migrate from Gradido Version 2.5.1 to 2.5.2
### What
We need to upgrade the used nodejs version in deployment. Until now for pm2, backend, dht-node, federation nodejs 16 was used,
but some newer npm libs don't work with this old nodejs version so we upgrade to nodejs 18.20.7

### What you can do now
You need to only run this [upgradeNodeJs.sh](upgradeNodeJs.sh) with `release-2_5_2-beta` as parameter
```bash
cd /home/gradido/gradido/deployment/hetzner_cloud/migration/2_5_1-2_5_2
sudo ./upgradeNodeJs.sh `release-2_5_2-beta`
```

It will stop pm2, install new nodejs version + pm2 + yarn, remove nodejs 16.
Then it will call start.sh with first parameter of ./upgradeNodeJs.sh as his first parameter

