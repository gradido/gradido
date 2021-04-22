# Gradido Node

Zweite Schicht von Gradido, die Blockchain, verwaltet durch Gradido Node Server. 
Es sollte mehrere Gradido Node Server für jede Gruppe geben. 
Dabei kann ein Gradido Node Server problemlos für mehrere Gruppen zuständig sein.
Oberste Priorität: Performance, lauffähig auf kleinen Servern, z.B. Mini-VPS oder Raspberry Phi ähnlichen Computern, und Super-Nodes die viele oder sogar alle Gruppen betreuen können

## Node Synchronisieren

Da Hedera die Nachrichten nur für kurze Zeit zur Verfügung stellt, müssen neue Nodes erstmal die bisherigen Transaktionen anfragen, wie bei Bitcoin und Co.
Dazu fragen sie bei benachbarten Gradido Node Servern die Transaktionen ab. 
Benachbart heißt in diesem Fall das sie für dieselben Gruppen zuständig sind.

## Transaktionen empfangen

Der Gradido Node empfängt die Transaktionen aus dem Hedera Netzwerk über Mirror-Server. 
Er lauscht auf alle Hedera Consensus Topics die mit die für ihn registrierten Gradido Gruppen übereinstimmen. Er überprüft die Transaktion und speichert sie dann auf der Festplatte ab.

## Transaktionen überprüfen

Insbesondere für die Überprüfung der Schöpfungstransaktionen kann es einiges zu tun geben, denn es müssen alle Transaktionen mit dem gleichen IdentHash aus dem gleichen Monat überprüft werden.

## Transaktionen speichern

Die im Protobuf format überreichten Transaktionen werden serialisiert und die aktuelle Block Datei der Gruppe für die die Transaktion war, geschrieben. 
Für alle Public Keys für die es noch keine kto index Einträge gibt, werden welche angelegt.
Ein Eintrag im Block Index wird angelegt.

## Transaktionen zur Verfügung stellen

Er stellt via jsonrpc ein schnelles Interface zum durchsuchen der Blockchains zur Verfügung damit der Community-Server effizient auf alle Transaktionen zugreifen kann, die für ihn interessent sind. 
Nur eine Verbindung pro IP zulassen um DDos angreifern das Leben schwer zu machen. 
[Slow Loris](http://en.wikipedia.org/wiki/Slowloris) Bekämpfen (Timeout für partiale HTTP-Requests)