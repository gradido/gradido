# Vue Gradido Wallet

## Ensure prerequisits
The frontend modul will not use a node-instance at runtime but it will be treated by ngnix.
In consequence the frontend sources have to be build before usage.

For building the frontend source the following prerequisits have to be ensured:
### Upgrade node to version 20.0.0
To upgrade to the correct node version please use the following command(s)
  
Show all node versions handled by nvm

```bash
nvm list
```

Selecting the correct node-version by

```bash
nvm use v20.0.0
# or
nvm use stable
```

In case the necessary version 20.0.0 does not exist, please install it by

```bash
nvm install v20.0.0
```

### Upgrade yarn to version 4.2.2
To upgrade the yarn version please call

```bash
yarn set version stable
```

and to verify for correct setting please invoke

```bash
yarn --version
```

Before start build and usage please invoke the following commands to 

```bash
cd frontend
rm -r node_modules
yarn cache clear
yarn install
yarn build
```

### Possible OpenSSLError
The build could run in an `OpenSSLError`, which will be caused in a securityfix from node 17 and up.
In this version a security issues was solved and in conjunction with package dependencies this error could occur.

There are two ways to solve this:

- the short, quick and unsave way

> Tell Node to use the legacy OpenSSL provider
> 
> On Unix-like (Linux, macOS, Git bash, etc.):
> 
>>```bash
>> export NODE_OPTIONS=--openssl-legacy-provider
>>```
> 
> On Windows command prompt:
> 
>>```bash
>> set NODE_OPTIONS=--openssl-legacy-provider
>>```
> 
> On PowerShell:
> 
>>```bash
>> $env:NODE_OPTIONS = "--openssl-legacy-provider"
>>```
> 

- the save but more time consuming and stronger way

> as discussed in the following subchapter and under this [link](https://stackoverflow.com/questions/69692842/error-message-error0308010cdigital-envelope-routinesunsupported):

#### important part of this error-solution discussion:
> <h3>Danger</h3>
> <p>This question has more than 30 answers, most suggesting to either downgrade Node.js to pre v17 or to use the legacy SSL provider. Both of those solutions are <em>hacks that leave your builds open to security threats</em>.</p>
> <h3>Reason For The Error</h3>
> <p>In Node.js v17, the Node.js developers closed a security hole in the SSL provider. This fix was a breaking change that corresponded with similar breaking changes in the SSL packages in NPM. When you attempt to use SSL in Node.js v17 or later without also upgrading those SSL packages in your <code>package.json</code>, then you will see this error.</p>
> <h3>The Correct (safe) Solution (for npm users)</h3>
> <p>Use an up-to-date version of Node.js, and also use packages that are up-to-date with security fixes.</p>
> <p>You can first try an update to see if that solves the problem:</p>
> <pre class="lang-none prettyprint-override"><code>npm update
> </code></pre>
> <p>If that is not enough, for many people, the following command will fix the issue:</p>
> <pre class="lang-none prettyprint-override"><code>npm audit fix --force
> </code></pre>
> <p>However, be aware that, for complex builds, the above command will pull in breaking security fixes that can <em>potentially</em> break your build.</p>
> <h3>Note for Yarn users</h3>
> <p>Yarn users can use <a href="https://www.npmjs.com/package/yarn-audit-fix" rel="noreferrer">yarn-audit-fix</a> which can be run without installing as a dependency via</p>
> <pre class="lang-none prettyprint-override"><code>npm_config_yes=true npx yarn-audit-fix
> </code></pre>
> <p>or windows powershell:</p>
> <pre class="lang-none prettyprint-override"><code>$env:npm_config_yes = 1; npx yarn-audit-fix
> </code></pre>
> <h3>A less heavy-handed (also correct) solution for Webpack</h3>
> <p>In your Webpack config, set either of the following:
> (See <a href="https://webpack.js.org/configuration/output/#outputhashfunction" rel="noreferrer">the ouput.hashFunction docs</a>)</p>
> <p>A. (Webpack v5) Set <code>output.hashFunction = 'xxhash64'</code>.<br />
> B. (Webpack v4) This will depend on <a href="https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options" rel="noreferrer">what hash > algorithms nodejs supports on your system</a>. Some common options you can try are <code>output.hashFunction = 'sha512'</code> or <code>output.hashFunction = 'sha256'</code>.</p>
> <p>See more info <a href="https://stackoverflow.com/a/73465262/564406">in Greg's answer</a>.</p>
> 


## install mit yarn 
```bash
cd frontend
yarn install
yarn run serve

# build
yarn run build
```

## install mit docker

```bash
# build
docker build -t gradido-frontend .

# run
docker run -it -p 80:80 --rm gradido-frontend
```

**Fully Coded Components**

Bootstrap Vue Gradido Wallet -  
 
 **DEMO:** [https://vast-atoll-44277.herokuapp.com/](https://vast-atoll-44277.herokuapp.com/) 
 

ISSUES:

 - [ ]  csrf token management 
 

 - [ ]  Userdaten - Testbenutzer - test.json
 

 - [ ]  Session Cookie: GRADIDO_LOGIN enhancement
 

 - [ ]  🚀 [Feature] - Create a dockerfile for the frontend application enhancement
 
 
 **DEMO:** [https://vast-atoll-44277.herokuapp.com/](https://vast-atoll-44277.herokuapp.com/) 



 ___________
 

# 🌟 [EPIC] - Gradido Web- and App- Client

Web-App:
Einstiegspunkt:
[ ] Login-Server for app-requests (Sollte in der App einstellbar sein) https://staging.gradido.net/appRequest

[ ] Auch die url für Community-Server requests sollte in einer Variable gespeichert sein.
CakePHP Seite auf die der Login-Server nach dem Login weiterleitet.
https://staging.gradido.net/client

Hiermit kann ein Konto anlegt werden:
https://staging.gradido.net/account/registerDirect

# Fehler im Code
Wenn etwas nicht stimmt, entweder mit den Input-Paremetern, oder ein Fehler im Code gibt es meistens folgendes als Ergebnis:
```
{
	"state": "error",
	"msg": "<kurze Fehlerbeschreibung>",
	"details": "<optional zusätzliche Informationen zum Fehler, z.B. Framework Fehlermeldung>"
}
  ```
  
# csfr Token
Bindet das js ein.
Stellt folgende js-Variablen zur Verfügung:

csfr : string
csfr Token (https://book.cakephp.org/3/en/controllers/components/csrf.html)
user: object

# Testbenutzer
Enthält Daten des aktuell eingeloggten Benutzers, z.B.: mein Testbenutzer:
console.log(user);
```
{
  "created": 1578688666,
  "disabled": false,
  "email": "dervommond@gmail.com",
  "email_checked": true,
  "first_name": "Max",
  "group_alias": "gdd1",
  "ident_hash": 2928827813,
  "last_name": "Miau",
  "public_hex": "2ed28a1cf5e116d83615406bc577152221c2f774a5656f66a0e7540f7576d71b",
  "role": "admin",
  "username": "",
  "balance": 174500, // Gradido Cent, 4 Nachkommastellen (2 Reserve) entspricht 17,45 
  "id": 1,
  "errorCount": 0
}
```
Das sind im Grunde die Benutzerangaben aus der Login-Server Datenbank.

session :int
Login-Server session id, notwendig für alle ajax-request.

# Seiten
Navigation:
Für alle Benutzer:

Kontoübersicht
Startseite
Überweisung
Mitgliederbereich (externer Link zu elopage: https://elopage.com/s/gradido/sign_in)
Rechts oben:
Profil
Abmelden
Startseite:
Für alle Benutzer:
Kontoübersicht
Überweisung
Benutzer Suche:
http://daten.einhornimmond.de/gradido_mithril_user_search.zip

# Mobile App
Login über eingebundene Login-Seite
auslesen der session_id aus dem Session Cookie: GRADIDO_LOGIN
Access Token vom Login-Server anfragen:
GET https://staging.gradido.net/appRequest/acquireAccessToken?session_id = <GRADIDO_LOGIN>
Du kannst auch den Cookie wieder mitschicken, solange die Login-Server Basis-url die gleiche ist, müsste das auch funktionieren.
Antwort:
```
{
  "state":"success", 
  "access_token" : "<integer>",
  "group_base_url":"<Community Server Base Url>"
}
```
Unterschied Access Token von der session_id: Access Tokens sind länger gültig
Du kannst über eine gültige session_id einen Access Token erhalten der eine Woche gültig ist. Die Client-IP des Aufrufess muss die gleiche sein, mit der eingeloggt wurde.
 

Mit einem gültigen Access-Token kannst du eine session_id erhalten.
GET https://staging.gradido.net/appRequest/appLogin?access_token =
Mit jedem Aufruf wird die Gültigkeit der Access-Tokens erneuert.
Antwort:
```
{
  "state":"success", 
  "session_id" : "<integer>"
}
```
# Kontoübersicht:
Liefert den aktuellen Kontostand.
Ajax:
GET https://staging.gradido.net/state-balances/ajaxGetBalance
Antwort:
`{"state":"success","balance":<GDD cent (4 Nachkommastellen)>}`

Listet die letzten Transaktionen auf, mit Paging.
Ajax:
GET https://staging.gradido.net/state-user-transactions/ajaxListTransactions//
page: Seite der Transaktionen, default = 1
count: Wie viele Transaktionen pro Seite, default = 20

Antwort:
Wenn alles okay:
```
{"state":"success", "transactions": 
	[
		{
			"name": "<first_name last_name>",
			"email": "<other_user.email>", //optional, only if send or receive and other user is known
			"type": "creation|send|receive",
			"transaction_id": <transaction_id>, // db id not id from blockchain
			"date": "<date string>",
			"balance": <GDD balance in GDD cent>,
			"memo": "<Verwendungszweck>",
			"pubkey": "<other_user.public_key in hex>"
		 
		 }
	],
	"transactionExecutingCount": <how many transaction for this user currently pending>,
	"count": <sum of finished transactions user is involved>
}
```
Holt die aktuelle Summe und Anzahl Einträge vom GDT Server für den Benutzer.
Ajax:
GET https://staging.gradido.net/state-balances/ajaxGdtOverview
```{"state": "success", "gdt": {"sum": <sum of all gdt transactions>, "count":<count of all gdt transactions>}}```

 
# 🌟 [EPIC] - Gradido Web- and App- Client

Web-App:
Einstiegspunkt:
[ ] Login-Server for app-requests (Sollte in der App einstellbar sein) https://staging.gradido.net/appRequest

[ ] Auch die url für Community-Server requests sollte in einer Variable gespeichert sein.
CakePHP Seite auf die der Login-Server nach dem Login weiterleitet.
https://staging.gradido.net/client

Hiermit kann ein Konto anlegt werden:
https://staging.gradido.net/account/registerDirect


# Fehler im Code
Wenn etwas nicht stimmt, entweder mit den Input-Paremetern, oder ein Fehler im Code gibt es meistens folgendes als Ergebnis:
```
{
	"state": "error",
	"msg": "<kurze Fehlerbeschreibung>",
	"details": "<optional zusätzliche Informationen zum Fehler, z.B. Framework Fehlermeldung>"
}
  ```
  
# csfr Token
Bindet das js ein.
Stellt folgende js-Variablen zur Verfügung:

csfr : string
csfr Token (https://book.cakephp.org/3/en/controllers/components/csrf.html)
user: object

# Testbenutzer
Enthält Daten des aktuell eingeloggten Benutzers, z.B.: mein Testbenutzer:
console.log(user);
```
{
  "created": 1578688666,
  "disabled": false,
  "email": "dervommond@gmail.com",
  "email_checked": true,
  "first_name": "Max",
  "group_alias": "gdd1",
  "ident_hash": 2928827813,
  "last_name": "Miau",
  "public_hex": "2ed28a1cf5e116d83615406bc577152221c2f774a5656f66a0e7540f7576d71b",
  "role": "admin",
  "username": "",
  "balance": 174500, // Gradido Cent, 4 Nachkommastellen (2 Reserve) entspricht 17,45 
  "id": 1,
  "errorCount": 0
}
```
Das sind im Grunde die Benutzerangaben aus der Login-Server Datenbank.

session :int
Login-Server session id, notwendig für alle ajax-request.

# Seiten
Navigation:
Für alle Benutzer:

Kontoübersicht
Startseite
Überweisung
Mitgliederbereich (externer Link zu elopage: https://elopage.com/s/gradido/sign_in)
Rechts oben:
Profil
Abmelden
Startseite:
Für alle Benutzer:
Kontoübersicht
Überweisung
Benutzer Suche:
http://daten.einhornimmond.de/gradido_mithril_user_search.zip

# Mobile App
Login über eingebundene Login-Seite
auslesen der session_id aus dem Session Cookie: GRADIDO_LOGIN
Access Token vom Login-Server anfragen:
GET https://staging.gradido.net/appRequest/acquireAccessToken?session_id = <GRADIDO_LOGIN>
Du kannst auch den Cookie wieder mitschicken, solange die Login-Server Basis-url die gleiche ist, müsste das auch funktionieren.
Antwort:
```
{
  "state":"success", 
  "access_token" : "<integer>",
  "group_base_url":"<Community Server Base Url>"
}
```
Unterschied Access Token von der session_id: Access Tokens sind länger gültig
Du kannst über eine gültige session_id einen Access Token erhalten der eine Woche gültig ist. Die Client-IP des Aufrufess muss die gleiche sein, mit der eingeloggt wurde.

Mit einem gültigen Access-Token kannst du eine session_id erhalten.
GET https://staging.gradido.net/appRequest/appLogin?access_token =
Mit jedem Aufruf wird die Gültigkeit der Access-Tokens erneuert.
Antwort:
```
{
  "state":"success", 
  "session_id" : "<integer>"
}
```
# Kontoübersicht:
Liefert den aktuellen Kontostand.
Ajax:
GET https://staging.gradido.net/state-balances/ajaxGetBalance
Antwort:
`{"state":"success","balance":<GDD cent (4 Nachkommastellen)>}`

Listet die letzten Transaktionen auf, mit Paging.
Ajax:
GET https://staging.gradido.net/state-user-transactions/ajaxListTransactions//
page: Seite der Transaktionen, default = 1
count: Wie viele Transaktionen pro Seite, default = 20

Antwort:
Wenn alles okay:
```
{"state":"success", "transactions": 
	[
		{
			"name": "<first_name last_name>",
			"email": "<other_user.email>", //optional, only if send or receive and other user is known
			"type": "creation|send|receive",
			"transaction_id": <transaction_id>, // db id not id from blockchain
			"date": "<date string>",
			"balance": <GDD balance in GDD cent>,
			"memo": "<Verwendungszweck>",
			"pubkey": "<other_user.public_key in hex>"
		 
		 }
	],
	"transactionExecutingCount": <how many transaction for this user currently pending>,
	"count": <sum of finished transactions user is involved>
}
```
Holt die aktuelle Summe und Anzahl Einträge vom GDT Server für den Benutzer.
Ajax:
GET https://staging.gradido.net/state-balances/ajaxGdtOverview
```{"state": "success", "gdt": {"sum": <sum of all gdt transactions>, "count":<count of all gdt transactions>}}```

Holt die letzten 100 GDT-Einträge für den Benutzer

 

Ein GDT Eintrag sieht so aus:
```
{
	"id": 8857,
	"amount": 1000, // GDT
	"date": "2020-06-17T14:12:00+00:00",
	"email": "foerderkreis-1@gradido.org",
	"comment": null,
	"coupon_code": "",
	"gdt_entry_type_id": 4,
	"factor": "20.0000",
	"amount2": 0,
	"factor2": "0.0500",
	"gdt": 1000
}
```
 
gdt entry types: (Auf welchen Weg der Eintrag eingetragen wurde)
1. Form: einzeln über das Formular, sollte nur wenige Einträg e betreffen
2. CVS: CVS Import, betrifft vor allem ältere Einträge von Spenden die weder über Elopage noch über Digistore reinkamen
3. Elopage: Alle GDT Einträge die automatisch durch eine Elopage-Transaktion erstellt wurden für den Einzahlenden.
4. Elopage-Publisher: Alle GDT Einträge die automatisch durch eine Elopage-Transaktion erstellt wurden für den Publisher, bis zu 5 Level nach oben.
5. Digistore: Alle GDT Einträge die automatisch durch eine Digistore-Transaktion angelegt wurden.
6. Cvs2: GDT Einträge die durch ein anderen CVS Import eingetragen wurden, betrifft ebenfalls nur alte Einträge.
amount: Menge in Euro-cent (2 Nachkommastellen) was eingezahlt wurde
factor: Der Umrechnungsfaktor der beim Einzahlen für den betreffenden Unterstützer galt.
amount2: ein Bonus Factor der drauf gerechnet wird bei Sonderaktionen, default 0
factor2: ein Bonus-Factor, default 1, wird aktuell im Code auf für Publisher-Transactionen benutzt.
Gdt: resultierender GDT Wert, wird folgendermaßen aus den bisherigen Werten berechnet:
gdt = amount * factor * factor2 + amount2
Es gibt zwei Arten von GDT Einträgen:

Was der Benutzer selbst in Euro gespendet hat
Was jemand anderes an Euro gespendet hat, der den Benutzer als Publisher gewählt hat (publisher-id bei Elopage), Publisher bis Level 5 erhalten jeweils 5% an GDT was der Spender erhalten hat.
z.B. Anna spendet 100 Euro bei einem Faktor von 20, bekommt also 2000 GDT.
Sie hat als Publisher Bernd angegeben, Bern erhält 100 GDT.
Bernd hat als Publisher damals Paul angegeben, Paul erhält also ebenfalls noch 100 GDT.
Bis zum 5. (Bernd ist 2.)
Diese Beziehung wird durch die connectEntries dargestellt.
Insbesondere durch den publishersPath, connect enthält einfach nur alle mögliche Daten.


# TODO
TODO: Update GDT-Server um paging und Zugriff auf alle Einträge zu erhalten, optimierter Zugriff
GET https://staging.gradido.net/state-balances/ajaxGdtTransactions
Liefert wenn alles in Ordnung ist:
 
wenn nicht type 7 dann "amount" in euro ansonsten in GDT

## Additional Software

For `yarn locales` you will need `jq` to use it.
You can install it (on arch) via

```
sudo pacman -S jq
```