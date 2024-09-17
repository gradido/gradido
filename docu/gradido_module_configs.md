# Gradido modules, configurations and dependencies

## Configurations

The configuration of the gradido modules are set by using the package `dotenv`.

### Templates

The configuration file `.env.template` contains all necessary configuration property names for the module and their values are set by still existing and exported properties with the same property-name. This will be expressed by the following expression:

`property_name = $property_name`

This template configuration file is registered in the git repository of the associated module.

### Distributions

The configuration file `.env.dist` contains all necessary configuration properties for the module and their values are set on default values used by the module.

The distribution configuration file is registered in the git repository of the associated module.

### Individuals

The configuration file `.env` contains all necessary configuration properties for the module including individual values.

The individual configuration file is optional and **not** registered in the git repository of the associated module.

### Handling of configuration files

#### module specific

The handling of the different configuration files are part of each module. The `dotenv` package (please see [this link](https://www.dotenv.org/docs/) for more details) defines and handles each of these three configuration files with the following dependency

```
.env
  +- .env.template
  +- .env.dist
```

#### centralized

A central kind of configuration handling is part of the unix bash script `gradido/deplyment/baremetal/start.sh`.

Property values defined in this file will **not** overwrite existing property values or will define new properties.

## Common valid Porperties

CONFIG_VERSION

COMMUNITY_HOST=localhost:8082

URL_PROTOCOL=http

## Modules

### Graphic User Interfaces

#### admin

##### .env

```CONFIG_VERSION=v3.2024-08-06ADMIN_MODULE_PROTOCOL=http
CONFIG_VERSION=v3.2024-08-06

ADMIN_MODULE_PROTOCOL=http
ADMIN_MODULE_HOST=localhost
ADMIN_MODULE_PORT=8082

# COMMUNITY_HOST=localhost:8082
# URL_PROTOCOL=http
WALLET_URL=http://localhost:3000
WALLET_AUTH_PATH=/authenticate?token={token}
WALLET_LOGIN_PATH=/login
GRAPHQL_PATH=/graphql
GRAPHQL_URL=http://localhost:4000
DEBUG_DISABLE_AUTH=false

```

##### .env.dist

```
ADMIN_MODULE_PROTOCOL=http
ADMIN_MODULE_HOST=localhost
ADMIN_MODULE_PORT=8080

GRAPHQL_URL=http://localhost:4000
GRAPHQL_PATH=/graphql
WALLET_URL=http://localhost
WALLET_AUTH_PATH=/authenticate?token={token}
WALLET_LOGIN_PATH=/login
DEBUG_DISABLE_AUTH=false
```

##### .env.template

```
CONFIG_VERSION=$ADMIN_CONFIG_VERSION

ADMIN_MODULE_PROTOCOL=$ADMIN_MODULE_PROTOCOL
ADMIN_MODULE_HOST=$ADMIN_MODULE_HOST
ADMIN_MODULE_PORT=$ADMIN_MODULE_PORT

COMMUNITY_HOST=$COMMUNITY_HOST
URL_PROTOCOL=$URL_PROTOCOL

#(optional) is created in config by: process.env.WALLET_URL ?? COMMUNITY_URL ?? 'http://localhost'
# WALLET_URL=$WALLET_URL
WALLET_AUTH_PATH=$WALLET_AUTH_PATH
WALLET_LOGIN_PATH=$WALLET_LOGIN_PATH
GRAPHQL_PATH=$GRAPHQL_PATH
DEBUG_DISABLE_AUTH=false

```


#### frontend

```
STAGE_HOST=localhost

FRONTEND_MODULE_PROTOCOL=http
FRONTEND_MODULE_HOST=$STAGE_HOST
FRONTEND_MODULE_PORT=3000

# Endpoints
GRAPHQL_URI=http://localhost:4000/graphql
ADMIN_AUTH_URL=http://localhost:8082
ADMIN_AUTH_PATH=/authenticate?token={token}
# routing with nginx the location "/admin" is used to route to admin module
# ADMIN_AUTH_PATH=/admin/authenticate?token={token}

# Community
COMMUNITY_NAME=Gradido Entwicklung
COMMUNITY_URL=http://localhost:4000/
COMMUNITY_REGISTER_URL=http://localhost:4000/register
COMMUNITY_DESCRIPTION=Die lokale Entwicklungsumgebung von Gradido.
COMMUNITY_SUPPORT_MAIL=support@supportmail.com
COMMUNITY_LOCATION='49.280377, 9.690151'

# Meta
META_URL=http://localhost:4000
META_TITLE_DE="Gradido – Dein Dankbarkeitskonto"
META_TITLE_EN="Gradido - Your gratitude account"
META_DESCRIPTION_DE="Dankbarkeit ist die Währung der neuen Zeit. Immer mehr Menschen entfalten ihr Potenzial und gestalten eine gute Zukunft für alle."
META_DESCRIPTION_EN="Gratitude is the currency of the new age. More and more people are unleashing their potential and shaping a good future for all."
META_KEYWORDS_DE="Grundeinkommen, Währung, Dankbarkeit, Schenk-Ökonomie, Natürliche Ökonomie des Lebens, Ökonomie, Ökologie, Potenzialentfaltung, Schenken und Danken, Kreislauf des Lebens, Geldsystem"
META_KEYWORDS_EN="Basic Income, Currency, Gratitude, Gift Economy, Natural Economy of Life, Economy, Ecology, Potential Development, Giving and Thanking, Cycle of Life, Monetary System"
META_AUTHOR="Bernd Hückstädt - Gradido-Akademie"

GMS_ACTIVE=true

```

#### gms_vue

##### .env

```


VUE_APP_API_URL=http://localhost:8080
#VUE_APP_API_URL=https://gms.gradido.net
#VUE_APP_API_URL=http://54.176.169.179:3071
VUE_APP_GOOGLE_MAP_KEY=AIzaSyDZxA_Mi5SiDCYv - QpfR67oJ6ztNX7fJ6M
VUE_APP_MAPBOX_KEY=pk.eyJ1IjoidmlrYXNpbG16IiwiYSI6ImNsbG03NzNkNTFwZXMzbHQ2bTV6NHA0ZjgifQ.knlN4jnVdmhDkJTaka5RoQ

```


#### humHub

### Backoffice

#### backend

##### .env

```
BACKEND_MODULE_PROTOCOL=https
BACKEND_MODULE_HOST=localhost
BACKEND_MODULE_PORT=4000

LOG_LEVEL=debug
GRAPHIQL=true
DLT_CONNECTOR=false
FEDERATION_XCOM_SENDCOINS_ENABLED=true
GMS_ACTIVE=true
# GMS_API_URL=https://gms.gradido.net/gms
GMS_API_URL=http://localhost:4044
GMS_DASHBOARD_URL=http://localhost:8080

```


##### .env.dist

```
# Backend_Module
BACKEND_MODULE_PROTOCOL=https
BACKEND_MODULE_HOST=localhost
BACKEND_MODULE_PORT=4000

# Server
PORT=4000
JWT_SECRET=secret123
JWT_EXPIRES_IN=10m
GRAPHIQL=false
GDT_API_URL=https://gdt.gradido.net

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=gradido_community
TYPEORM_LOGGING_RELATIVE_PATH=typeorm.backend.log

# Klicktipp
KLICKTIPP=false
KLICKTTIPP_API_URL=https://api.klicktipp.com
KLICKTIPP_USER=gradido_test
KLICKTIPP_PASSWORD=secret321
KLICKTIPP_APIKEY_DE=SomeFakeKeyDE
KLICKTIPP_APIKEY_EN=SomeFakeKeyEN

# DltConnector
DLT_CONNECTOR=true
DLT_CONNECTOR_URL=http://localhost:6010

# Community
COMMUNITY_NAME=Gradido Entwicklung
COMMUNITY_URL=http://localhost
COMMUNITY_REGISTER_PATH=/register
COMMUNITY_REDEEM_PATH=/redeem/{code}
COMMUNITY_REDEEM_CONTRIBUTION_PATH=/redeem/CL-{code}
COMMUNITY_DESCRIPTION=Die lokale Entwicklungsumgebung von Gradido.
COMMUNITY_SUPPORT_MAIL=support@supportmail.com

# Login Server
LOGIN_APP_SECRET=21ffbbc616fe
LOGIN_SERVER_KEY=a51ef8ac7ef1abf162fb7a65261acd7a

# EMail
EMAIL=false
EMAIL_TEST_MODUS=false
EMAIL_TEST_RECEIVER=stage1@gradido.net
EMAIL_USERNAME=gradido_email
EMAIL_SENDER=info@gradido.net
EMAIL_PASSWORD=xxx
EMAIL_SMTP_URL=gmail.com
EMAIL_SMTP_PORT=587
EMAIL_LINK_VERIFICATION_PATH=/checkEmail/{optin}{code}
EMAIL_LINK_SETPASSWORD_PATH=/reset-password/{optin}
EMAIL_LINK_FORGOTPASSWORD_PATH=/forgot-password
EMAIL_LINK_OVERVIEW_PATH=/overview
EMAIL_CODE_VALID_TIME=1440
EMAIL_CODE_REQUEST_TIME=10

# Webhook
WEBHOOK_ELOPAGE_SECRET=secret

# SET LOG LEVEL AS NEEDED IN YOUR .ENV
# POSSIBLE VALUES: all | trace | debug | info | warn | error | fatal
# LOG_LEVEL=info

# Federation
FEDERATION_VALIDATE_COMMUNITY_TIMER=60000
FEDERATION_XCOM_SENDCOINS_ENABLED=false

# GMS
# GMS_ACTIVE=true
# Coordinates of Illuminz test instance
#GMS_API_URL=http://54.176.169.179:3071
GMS_API_URL=http://localhost:4044/
GMS_DASHBOARD_URL=http://localhost:8080/

# HUMHUB
HUMHUB_ACTIVE=false
#HUMHUB_API_URL=https://community.gradido.net/
#HUMHUB_JWT_KEY=

```

##### .env.template

```
# must match the CONFIG_VERSION.EXPECTED definition in scr/config/index.ts
CONFIG_VERSION=$BACKEND_CONFIG_VERSION

# Backend_Module
BACKEND_MODULE_PROTOCOL=$BACKEND_MODULE_PROTOCOL
BACKEND_MODULE_HOST=$BACKEND_MODULE_HOST
BACKEND_MODULE_PORT=$BACKEND_MODULE_PORT

# Server
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=$JWT_EXPIRES_IN
GRAPHIQL=false
GDT_API_URL=$GDT_API_URL

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=gradido_community
TYPEORM_LOGGING_RELATIVE_PATH=$TYPEORM_LOGGING_RELATIVE_PATH

# Klicktipp
KLICKTIPP=$KLICKTIPP
KLICKTTIPP_API_URL=https://api.klicktipp.com
KLICKTIPP_USER=$KLICKTIPP_USER
KLICKTIPP_PASSWORD=$KLICKTIPP_PASSWORD
KLICKTIPP_APIKEY_DE=$KLICKTIPP_APIKEY_DE
KLICKTIPP_APIKEY_EN=$KLICKTIPP_APIKEY_EN

# DltConnector
DLT_CONNECTOR=$DLT_CONNECTOR
DLT_CONNECTOR_PORT=$DLT_CONNECTOR_PORT

# Community
COMMUNITY_HOST=$COMMUNITY_HOST
URL_PROTOCOL=$URL_PROTOCOL
COMMUNITY_NAME=$COMMUNITY_NAME
COMMUNITY_REGISTER_PATH=$COMMUNITY_REGISTER_PATH
COMMUNITY_REDEEM_PATH=$COMMUNITY_REDEEM_PATH
COMMUNITY_REDEEM_CONTRIBUTION_PATH=$COMMUNITY_REDEEM_CONTRIBUTION_PATH
COMMUNITY_DESCRIPTION=$COMMUNITY_DESCRIPTION
COMMUNITY_SUPPORT_MAIL=$COMMUNITY_SUPPORT_MAIL

# Login Server
LOGIN_APP_SECRET=21ffbbc616fe
LOGIN_SERVER_KEY=a51ef8ac7ef1abf162fb7a65261acd7a

# EMail
EMAIL=$EMAIL
EMAIL_TEST_MODUS=$EMAIL_TEST_MODUS
EMAIL_TEST_RECEIVER=$EMAIL_TEST_RECEIVER
EMAIL_USERNAME=$EMAIL_USERNAME
EMAIL_SENDER=$EMAIL_SENDER
EMAIL_PASSWORD=$EMAIL_PASSWORD
EMAIL_SMTP_URL=$EMAIL_SMTP_URL
EMAIL_SMTP_PORT=$EMAIL_SMTP_PORT
EMAIL_LINK_VERIFICATION_PATH=$EMAIL_LINK_VERIFICATION_PATH
EMAIL_LINK_SETPASSWORD_PATH=$EMAIL_LINK_SETPASSWORD_PATH
EMAIL_LINK_FORGOTPASSWORD_PATH=$EMAIL_LINK_FORGOTPASSWORD_PATH
EMAIL_LINK_OVERVIEW_PATH=$EMAIL_LINK_OVERVIEW_PATH
EMAIL_CODE_VALID_TIME=$EMAIL_CODE_VALID_TIME
EMAIL_CODE_REQUEST_TIME=$EMAIL_CODE_REQUEST_TIME

# Webhook
WEBHOOK_ELOPAGE_SECRET=$WEBHOOK_ELOPAGE_SECRET

# Federation
FEDERATION_VALIDATE_COMMUNITY_TIMER=$FEDERATION_VALIDATE_COMMUNITY_TIMER
FEDERATION_XCOM_SENDCOINS_ENABLED=$FEDERATION_XCOM_SENDCOINS_ENABLED

# GMS
GMS_ACTIVE=$GMS_ACTIVE
GMS_API_URL=$GMS_API_URL
GMS_DASHBOARD_URL=$GMS_DASHBOARD_URL
GMS_WEBHOOK_SECRET=$GMS_WEBHOOK_SECRET
GMS_CREATE_USER_THROW_ERRORS=$GMS_CREATE_USER_THROW_ERRORS

# HUMHUB
HUMHUB_ACTIVE=$HUMHUB_ACTIVE
HUMHUB_API_URL=$HUMHUB_API_URL
HUMHUB_JWT_KEY=$HUMHUB_JWT_KEY


```


#### dht

##### .env


##### .env.dist

```
DHT_MODULE_PROTOCOL=http
DHT_MODULE_HOST=localhost
DHT_MODULE_PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=gradido_community
TYPEORM_LOGGING_RELATIVE_PATH=typeorm.dht-node.log

# SET LOG LEVEL AS NEEDED IN YOUR .ENV
# POSSIBLE VALUES: all | trace | debug | info | warn | error | fatal
# LOG_LEVEL=info

# Federation
# if you set the value of FEDERATION_DHT_TOPIC, the DHT hyperswarm will start to announce and listen on an hash created from this topic
FEDERATION_DHT_TOPIC=GRADIDO_HUB
# FEDERATION_DHT_SEED=64ebcb0e3ad547848fef4197c6e2332f
FEDERATION_COMMUNITY_URL=http://localhost
# comma separated values, which apis should be announced
FEDERATION_COMMUNITY_APIS=1_0
```

##### .env.template

```
# must match the CONFIG_VERSION.EXPECTED definition in scr/config/index.ts
CONFIG_VERSION=$FEDERATION_DHT_CONFIG_VERSION

DHT_MODULE_PROTOCOL=$DHT_MODULE_PROTOCOL
DHT_MODULE_HOST=$DHT_MODULE_HOST
DHT_MODULE_PORT=$DHT_MODULE_PORT

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=gradido_community
TYPEORM_LOGGING_RELATIVE_PATH=$TYPEORM_LOGGING_RELATIVE_PATH

# Community
COMMUNITY_NAME=$COMMUNITY_NAME
COMMUNITY_DESCRIPTION=$COMMUNITY_DESCRIPTION

# Federation
FEDERATION_DHT_CONFIG_VERSION=$FEDERATION_DHT_CONFIG_VERSION
# if you set the value of FEDERATION_DHT_TOPIC, the DHT hyperswarm will start to announce and listen 
# on an hash created from this topic
FEDERATION_DHT_TOPIC=$FEDERATION_DHT_TOPIC
FEDERATION_DHT_SEED=$FEDERATION_DHT_SEED
# comma separated values, which apis should be announced
FEDERATION_COMMUNITY_APIS=$FEDERATION_COMMUNITY_APIS
COMMUNITY_HOST=$COMMUNITY_HOST
URL_PROTOCOL=$URL_PROTOCOL

```


#### federation

##### .env

```
# Federation_Module
FEDERATION_MODULE_PROTOCOL='http'
FEDERATION_MODULE_HOST='localhost
FEDERATION_MODULE_PORT=5010

```

##### .env.dist

```
# Federation_Module
FEDERATION_MODULE_PROTOCOL='http'
FEDERATION_MODULE_HOST='localhost
FEDERATION_MODULE_PORT=5010

# Database
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=gradido_community
DB_USER=root
DB_PASSWORD=

# Federation
FEDERATION_API=1_0
FEDERATION_PORT=5010
FEDERATION_COMMUNITY_URL=http://localhost

```

##### .env.template

```
# must match the CONFIG_VERSION.EXPECTED definition in scr/config/index.ts
CONFIG_VERSION=$FEDERATION_CONFIG_VERSION

# Federation_Module
FEDERATION_MODULE_PROTOCOL=$FEDERATION_MODULE_PROTOCOL
FEDERATION_MODULE_HOST=$FEDERATION_MODULE_HOST
FEDERATION_MODULE_PORT=$FEDERATION_MODULE_PORT

LOG_LEVEL=$LOG_LEVEL
# this is set fix to false, because it is important for 'production' environments. only set to true if a graphql-playground should be in use
GRAPHIQL=false

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=gradido_community

# Federation
COMMUNITY_HOST=$COMMUNITY_HOST
URL_PROTOCOL=$URL_PROTOCOL
FEDERATION_CONFIG_VERSION=$FEDERATION_CONFIG_VERSION
# comma separated list of api-versions, which cause starting several federation modules
FEDERATION_COMMUNITY_APIS=$FEDERATION_COMMUNITY_APIS
```


#### dlt

##### .env


##### .env.dist

```
CONFIG_VERSION=v6.2024-02-20

DLT_MODULE_PROTOCOL=http
DLT_MODULE_HOST=localhost
DLT_MODULE_PORT=6010

# SET LOG LEVEL AS NEEDED IN YOUR .ENV
# POSSIBLE VALUES: all | trace | debug | info | warn | error | fatal
# LOG_LEVEL=info

# IOTA
IOTA_API_URL=https://chrysalis-nodes.iota.org
IOTA_COMMUNITY_ALIAS=GRADIDO: TestHelloWelt2
IOTA_HOME_COMMUNITY_SEED=aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=gradido_dlt
DB_DATABASE_TEST=gradido_dlt_test
TYPEORM_LOGGING_RELATIVE_PATH=typeorm.backend.log

# DLT-Connector
DLT_CONNECTOR_PORT=6010

# Route to Backend
BACKEND_SERVER_URL=http://localhost:4000
JWT_SECRET=secret123
```

##### .env.template

```
CONFIG_VERSION=$DLT_CONNECTOR_CONFIG_VERSION

DLT_MODULE_PROTOCOL=$DLT_MODULE_PROTOCOL
DLT_MODULE_HOST=$DLT_MODULE_HOST
DLT_MODULE_PORT=$DLT_MODULE_PORT

JWT_SECRET=$JWT_SECRET

#IOTA
IOTA_API_URL=$IOTA_API_URL
IOTA_COMMUNITY_ALIAS=$IOTA_COMMUNITY_ALIAS
IOTA_HOME_COMMUNITY_SEED=$IOTA_HOME_COMMUNITY_SEED

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=gradido_dlt
DB_DATABASE_TEST=$DB_DATABASE_TEST
TYPEORM_LOGGING_RELATIVE_PATH=typeorm.backend.log

# DLT-Connector
DLT_CONNECTOR_PORT=$DLT_CONNECTOR_PORT

# Route to Backend
BACKEND_SERVER_URL=http://localhost:4000
```

#### gms

##### .env

```
# Application Information
APPLICATION_TITLE=Gradido
APPLICATION_CODE=APPCODE
CYPRESS_PROJECT_ID=64r6bg
PASSCODE=APP_PASS_CODE
SUPERADMIN_EMAIL=admin@illuminz.com
SUPERADMIN_PASSWORD=admin@illuminz.com
LOG4JS_CONFIG=log4js-config.json
LOG_LEVEL=debug

# Nodejs configuration
NODE_ENV=DEVELOPMENT
NODE_HOST=localhost
NODE_PORT=4044
PROTOCOL=http
SERVER_HOST=localhost:4044

NODE_DB_SETUP=0

# message broker setting
#MESSAGE_BROKER_HOST=54.176.169.179
#MESSAGE_BROKER_PORT=9092

# Token Configuration
JWT_PRIVATE_KEY=CKS5gIMIyvVp5vzvmenvP9vW8G2sLQZE
JWT_ALGO=HS256

# Verification attempt counts
INVALID_ATTEMPTS=5
PAGINATION_LIMIT=20

# Crypto encryption key
CRYPTO_KEY=UXU4ktjkV20alIpDPelUD6GLKanzWO2U
DATA_KEY=ZXU4ktjkV20alIpDPelUD6GLKanzWO2U
HASH_ROUNDS=5;

# Localization
VALID_LANGUANGE_CODES=en
DEFAULT_LANGUANGE_CODE=en

# Default signup role
DEFAULT_USER_ROLE=user
DEFAULT_COMMUNITY_ROLE=community

# Mobile Number Authentication
MASTER_CODE_FLAG=true
MASTER_CODE=9999


# DB CONNECTIONS MYSQL PRODUCTION
#MYSQL_HOST='50.18.176.176'
#MYSQL_USER_NAME='serviceAccount'
#MYSQL_DATABASE_NAME='serviceAccount'
#MYSQL_PASSWORD='SerKzedpmXS8SjJ#'

# DB CONNECTIONS MYSQL DEVELOPMENT
#--Illuminz
#MYSQL_DEVELOPMENT_HOST='50.18.176.176
#MYSQL_DEVELOPMENT_USER_NAME='gradido'
#MYSQL_DEVELOPMENT_DATABASE_NAME='gradido'
#MYSQL_DEVELOPMENT_PASSWORD='GrghFGFhdiDojh786#'
#--Grdido
MYSQL_DEVELOPMENT_HOST=localhost
MYSQL_DEVELOPMENT_PORT=3306
MYSQL_DEVELOPMENT_USER_NAME=root
MYSQL_DEVELOPMENT_PASSWORD=
MYSQL_DEVELOPMENT_DATABASE_NAME=gradido_gms

# DB CONNECTIONS MYSQL TEST
#--Illuminz
#MYSQL_TEST_HOST='localhost'
#MYSQL_TEST_USER_NAME='root'
#MYSQL_TEST_DATABASE_NAME='gradido'
#MYSQL_TEST_PASSWORD='znimulli'
#-Gradido
#MYSQL_TEST_HOST=localhost
#MYSQL_TEST_PORT=3306
#MYSQL_TEST_USER_NAME=root
#MYSQL_TEST_PASSWORD=
#MYSQL_TEST_DATABASE_NAME=gradido_gms

# DB CONNECTIONS MYSQL LOCAL
#MYSQL_LOCAL_HOST='localhost'
#MYSQL_LOCAL_USER_NAME='root'
#MYSQL_LOCAL_DATABASE_NAME='gradido'
#MYSQL_LOCAL_PASSWORD='znimulli'

# MYSQL Settings

MYSQL_DIALECT=mariadb
#MYSQL_DIALECT='mysql'
MYSQL_PORT=3306
DB_POOL_MAX=10
DB_POOL_MIN=1
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# FILE SYSTEM (KEEP ONLY ONE AT STATUS 1)
USE_FILE_SYSTEM=0
USE_S3_BUCKET=1
CMK_KEY_ID=cd9d9c41-3862-4e5a-ac61-2b9311deadb5
CMK_KEY_SPEC=AES_256
ENCRYPTION_ALGORITHM='AES-256-CBC'
IV="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"


# AWS S3 ACCESS
#S3_BUCKET_NAME=illuminzuploads
S3_BUCKET_NAME='curate-media-content'
S3_KEY_PREFIX='local/'
S3_URL_EXPIRATION_TIME=300
#S3_ACCESS_KEY=
#S3_ACCESS_SECRET=
#S3_REGION='us-west-1'
S3_ACCESS_KEY=
S3_ACCESS_SECRET=
S3_REGION='ap-south-1'

# AWS SES Settings
EMAIL_PROTOCOL=smtp
SES_ACCESS_KEY=
SES_ACCESS_SECRET=
SES_REGION='us-west-1'
SES_SMTP_EMAIL=noreply@illuminz.com
SES_SMTP_HOST=email-smtp.us-west-1.amazonaws.com
SES_SMTP_USERNAME=
SES_SMTP_PASSWORD=
SES_SMTP_SSL=

# set sms gateway msg91,twilio
SMS_GATEWAY_TO_USE='msg91'

# Twilio OTP settings

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_SERVICE_SID=

# message 91 OTP setting
MSG91_SEND_MSG=https://api.msg91.com/api/v5/otp
MSG91_RESEND_MSG=https://api.msg91.com/api/v5/otp/retry
MSG91_VERIFY_OTP=https://api.msg91.com/api/v5/otp/verify
MSG91_AUTH_KEY=
MSG91_TEMPLET_ID=

# ENABLE TWO FACTOR AUTHENTICATION
ENABLE_2FA=0
ENCODING_2FA=ascii

# SHOULD NOT BE ALTERED AFTER INITIALIZING THE SYSTEM
SAAS_ENABLED=1

# RAZORPAY PAYMENT SETTINGS
# RAZORPAY_MODE=['TEST','LIVE']
RAZORPAY_MODE=TEST
RAZORPAY_MERCHANT_ID=
RAZORPAY_API_KEY_TEST=
RAZORPAY_API_SECRET_TEST=
RAZORPAY_API_KEY_LIVE=
RAZORPAY_API_SECRET_LIVE=
# Deepl translation api key
DEEPL_TRANSATIONA_API_KEY=572003f9-0a30-4c2b-62fb-ff5cd2b9e861RAZORPAY_PAYMENT_SECRET=walltpayment

# Social login validatior
GOOGLE_LOGIN_TOKEN_VALIDATOR=https://www.googleapis.com/oauth2/v1/tokeninfo?access_token
APPLE_AUTH_KEY_URL=https://appleid.apple.com/auth/keys

# API ENCRYPRION
ENABLE_API_ENCRYPTION=1
COOKIE_PASSWORD=75A0TbY2zuDBpRKxP9VYMv6ZHNZvuzN8
# Deepl translation api key
DEEPL_TRANSATIONA_API_KEY=572003f9-0a30-4c2b-62fb-ff5cd2b9e861

VUE_APP_API_URL=http://localhost:4044
VUE_APP_GOOGLE_MAP_KEY=AIzaSyDZxA_Mi5SiDCYv - QpfR67oJ6ztNX7fJ6M
VUE_APP_MAPBOX_KEY=pk.eyJ1IjoidmlrYXNpbG16IiwiYSI6ImNsbG03NzNkNTFwZXMzbHQ2bTV6NHA0ZjgifQ.knlN4jnVdmhDkJTaka5RoQ

```


#### humHub
