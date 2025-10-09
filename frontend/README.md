# Vue Gradido Wallet

## install grass, a faster sass compiler written in rust
First install [rust](https://www.rust-lang.org/) if not already installed.

Then install grass, it need some time, because it will be compiled.
```bash
cargo install grass
```	
Now with using bun compile-sass or turbo compile-sass grass will be used.


### Compiles and hot-reloads for development
```
turbo dev
```
or from root folder: 

```
turbo frontend#dev
```


### Compiles and minifies for production
```
turbo build
```
or from root folder: 

```
turbo frontend#build
```

### Lints and fixes files
```
turbo lint
```
or from root folder: 

```
turbo frontend#lint
```

### Unit tests
```
turbo test
```
For filtering out single tests: 
```
turbo test -- <test_name>
```
Everything after -- will be passed to vitest.

or from root folder: 

```
turbo frontend#test
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