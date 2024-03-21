## Migrate from Gradido Version 2.2.0 to 2.2.1
### What was wrong 
In [hetzner_cloud/install.sh](../../install.sh) there was an error.
$DB_PASSWORD and $JWT_SECRET password generation method don't work with `release-2_2_0` as parameter for install.sh

The Parameter forwarding from branch, `release-2_2_0` in this case to start.sh was also missing.

### What you can do now
You need to only run this [fixInstall.sh](fixInstall.sh) with `release_2_2_1` as parameter
```bash
cd /home/gradido/gradido/deployment/hetzner_cloud/migration/2_2_0-2_2_1
sudo ./fixInstall.sh `release_2_2_1`
```

Basically it will create a new $DB_PASSWORD, $JWT_SECRET and $FEDERATION_DHT_SEED,
update db user with new db password and update .env files in module folders.
Then it will call start.sh with first parameter if ./fixInstall.sh as his first parameter

