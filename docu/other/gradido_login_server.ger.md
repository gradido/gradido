# Login Server

## Hauptaufgabe
Sicheres Verwahren der private Keys.

Die Private Keys werden mit E-Mail und Passwort verschlüsselt gespeichert, sodass nur der Benutzer selbst Zugang zu seinem Private Key hat und damit Transaktionen signieren kann. 
Um einem Datenverlust vorzubeugen wird dem Benutzer beim Konto anlegen eine Passphrase angezeigt, aus welcher der Seed für die Private Key Generierung berechnet wird. 
Da nicht alle Nutzer sich die Passphrase notieren, wird sie noch als Backup gespeichert, ebenfalls verschlüsselt. Sie soll mit dem Public Key des Server-Admin-Keys verschlüsselt werden, so dass nur der private-key Besitzer die Passphrase entschlüsseln und bei Bedarf an den Benutzer senden kann. Ursprünglich hatte ich die Idee die Daten noch zusätzlich mit einem symmetrischen Server-Key zu verschlüsseln aber ich glaube nicht das es die Sicherheit weiter steigern kann. 

## Technik

### Poco

Es wird C++ verwendet zusammen mit der Poco Bibliothek. Sie ist dafür entwickelt Netzwerk- und Internetbasierte C++ Programme zu unterstützen. 
Sie bringt u.a. HTTP und HTTPS Server und Clients mit, Multithreading, SMTP und Datenbankzugriff. 

### Crypto

Für die cryptografischen Funktionen wird libsodium verwendet sowie eine modifizierte iroha-ed25519 Bibliothek. Sie benutzt für ihre random Function den gleichen Namen wie libsodium, daher ist dies in der modifizierten Version auskommentietr. 

Die  iroha-ed25519 wird verwendet da die ed25519 Signaturen von libsodium nicht mit Hedera Hashgraph kompatibel sind.

### Mysql

Für die Datenbank wird mariadb verwendet. Dies ist eine Weiterentwicklung von mysql vom ursprünglichen Gründer, welches performanter läuft als mysql.
Für den Verbindungsaufbau wird der mariadb-connector-c benutzt und eine leicht modfizierte Version der mysql Klassen von Poco. Sie befinden sich direkt im Quellcode Verzeichnis. 

### Passphrase

Die Wörter der Passphrase wollte ich ungern im Klartext im Binary speichern, daher sind sie komprimiert. Um sie zu entpacken wird **tinf** verwendet.

### Localization

Für die Übersetzung wird spirit-po benutzt welche das Standard po Format versteht und einliest.
spirit-po setzt auf boost libs was dazu führt das zum kompilieren mehr als 1 GB Arbeitsspeicher verfügbar sein muss. 

### Protobuf

Um die Transaktionen entpacken zu können wird auch protobuf benötigt und der entsprechende Compiler in der gleichen Version. Im git-Repository werden nur die protobuf Messages gespeichert, nicht die daraus kompilierten C++-Klassen.

### Build-System

Als Build-System kommt CMake in Verbindung mit Conan zum Einsatz. 
Damit lassen sich einfach Makefiles oder Projectfiles (z.B. für Visual Studio) für verschiedene Plattformen generieren. 

Conan ist ein Packetmanager für C++ Bibliotheken, ist aber noch nicht so ausgereift. 

## Architektur

Es wird als Orientierung grob das MVC System verwendet. 
Modelle werden für alles verwendet was mit Daten zu tun hat. 
Zum Beispiel zum Abbilden der Daten aus der Datenbank oder auch für die E-Mails. 
Controller werden verwendet für die die Funktionen die auf Daten basieren. 
Der View gliedert sich in HTTPInterface und JSONInterface und definiert wie die Daten nach außen gebracht werden. Für jeden HTTP oder Json Request wird dabei ein eigener Thread aus einem Threadpool verwendet. 
Das HTTPInterface enthält darüber hinaus auch den Workflow der Benutzer Prozesse wie neues Konto erstellen oder Passwort zurücksetzen. 
SingletonManager enthält alle Klassen welche als Singleton definiert sind und sich um Verwaltungsaufgaben kümmern, die den gesamten Server betreffen. 
In Crypto befinden sich alle Klassen die sich mit Verschlüsseln und der Passphrase beschäftigen. 
In lib befinden sich kleine eigenständige Klassen, zum Teil aus anderen Projekten.
In tasks befinden sich alle Klassen die mit dem CPU Scheduler zu tun haben der einzelne Aufgaben in Form von Tasks von verschiedenen Worker-Threads abarbeiten lässt. Es soll die Reaktionszeit des Servers erhöhen um einer Überlastung vorzubeugen. Aufgaben deren Ergebnis der Benutzer nicht oder nicht unmittelbar benötigt werden im Hintergrund weiter ausgeführt, während der Benutzer schon eine Rückmeldung erhält und schon was anderes machen kann.

test enthält Unit-Test um einzelne Teile automatisch testen zu können.

## Session-Management

Der SessionManager speichert alle aktuellen Sessions im Arbeitsspeicher und ist eine Singleton-Klasse. 
Das Session-Objekt enthält vor allem den Benutzer. Im Augenblick in doppelter Ausführung, da ich dabei bin das Benutzer-Objekt zu überarbeiten.
Die neue Version ist stärker Objektorientiert aufgebaut. 
Das Session Objekt behält noch laufende Transaktionen des Benutzers im Blick. 
Die meisten Interface-Funktionen holen sich zu erst die aktuelle Session über die session_id die im Session-Cookie gespeichert ist. 
Das Session-Objekt wird zurückgesetzt wenn es nicht mehr benötigt wird (timout oder logout) und bekommt eine neue Session id.
Ich habe an manchen Stellen Objekte recycelt um die Speicherfragmentierung auf ein minimum zu halten. Denn der Login-Server soll ja dauerhaft laufen.

## HTTP-Interface

Arbeitet mit cpsp Dateien, das sind C++-Server-Pages.
Diese sind im Ordner src/cpsp zu finden. 
Poco hat einen Compiler der dafür der daraus C++ Klassen macht. 
Die compilierten C++-Server-Pages sind im Ordner src/cpp/HTTPInterface zu finden und sind im git-Repository eingecheckt. 
Der zentrale Einstiegspunkt bei jedem HTTP-Request ist die Klasse PageRequestHandlerFactory.
Hier findest das Routing statt in der Funktion createRequestHandler.

## New User

HTTPInterface: RegisterPageDirect

- Benutzer in Datenbank speichern
- Passphrase generieren
- Schlüssel generieren
- auf Community Server kopieren (push)

Datenbank anpassen:

- bool hinzufügen für Benutzer Passphrase gezeigt

Community Server:

- JsonRequestHandler erweitern um addUser | eigentlich müsste es auch so gehen, denn nach dem redirect auf den Community Server kopiert der sich ja den Benutzer. 
- eintragen bei Klick Tipp

**Hinweis**: Im Augenblick ist die Passhrase noch nicht verschlüsselt gespeichert, kann also jederzeit abgerufen werden. 
Wenn sie verschlüsselt gespeichert wird, ändert sich die Abfrage und das Passwort zurücksetzen, weil da vorher ein Admin die Passphrase freigeben muss (sein Privat Key eingeben, damit sie entschlüsselt werden kann) und dann wird sie im Arbeitsspeicher gehalten bis sie benötigt wird oder der Server neugestartet wurde. 

## Bestehende Benutzer

Beim einloggen prüfen ob ein public key vorhanden, sonst generieren
Auch wenn sie über Email verification code sich einloggen
Setze Wert für passphrase_shown auf 1 falls es einen Eintrag in user_backups gibt.

## Transaktion

Gradidos können erst versendet werden, wenn die E-Mail bestätigt wurde. 
In Transfer prepare also prüfen ob die E-Mail aktiviert ist und wenn nicht eine Fehlermeldung anzeigen. Den Signieren Knopf ausblenden und die Aktion Serverseitig nicht zulassen.

Beim neuladen neu prüfen, eventuell hat der Benutzer in der Zwischenzeit sein Konto aktiviert. 