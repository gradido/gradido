## Dezentralität

Ich habe von Anfang an versucht Gradido so dezentral wie möglich zu entwerfen.
Dezentral an der Basis. Kryptografie und Blockchain-Technologie sind meiner Meinung nach die besten Technologien dafür.
Sie ermöglichen einen Ansatz bei dem der Benutzer und seine Daten im Mittelpunkt stehen. In der Form,
das nur der Benutzer selbst die volle Kontrolle über seine Daten haben kann. 
Dadurch wird der Benutzer unabhägig von Server-Admins und das Gesamtsystem hat weniger Points of Failure.
Bei den Crypto-Coins wie Bitcoin wird diese Kontrolle des Benutzers über seine Daten durch die Nutzung
von Public-Private Kryptografie erreicht. Damit sind zwei grundlegende Arten von Operationen möglich.

Die eine Art der Operationen kann nur derjenige ausführen, der Zugriff auf den Private Key hat. 
Das Ergebnis kann jedoch von allen überprüft werden die Zugriff auf den Public Key haben. 

Und es gibt Operationen die man mit dem public key ausführen kann, bei denen nur der Inhaber das Private Keys das 
Ergebnis sehen kann. 

Wenn mehr Wert auf Anonymität gelegt wird, gibt es auch sogenannte Zero-Knowledge Protokolle wie bei zcash welche Transaktionen ermöglichen 
die nicht nachvollziehbar sind. 

In der Praxis heißt das, das jede Transaktion die von einem Nutzer kommt mit dessen Private Key signiert wird. 
Dabei fließen alle relevanten Daten der Transaktion mit in die Signatur ein und können daher später überprüft werden ob sie 
verändert wurden. Denn eine neue gültige Signatur kann nur derjenige erstellen welche Zugriff auf den Private Key hat. 
Mit dem Private Key steht und fällt alles. Daher ist es wichtig das dieser gut geschützt ist. 

Diese Transaktionsblöcke werden dann in Form einer Blockchain gespeichert. Sie werden durch einen running hash oder transactions hash 
miteinander verbunden. Dieser wird aus dem vorherigen Hash, der Transaktionsnr, Empfangsdatum und der Signaturen berechnet. 
Jeder der einen Node-Server betreibt hat dadurch eine einfache Möglichkeit zu überprüfen ob andere Node-Server einwandfrei funktionieren,
indem er einfach den running hash von einer Transaktion auf seinem Node mit dem running hash derselben Transaktion (gleiche nr) des entsprechenden 
Node-Servers vergleicht.

### Wo werden nun die Daten genau gespeichert?
Bei Bitcoin und Co. werden einfach alle Transaktionen bei allen Node Betreibern gespeichert. Das stößt aber schnell an physikalische Grenzen. 
Daher werden die Daten bei Gradido in spearate Blockchains pro Community gespeichert. Dabei ist der Node-Server so ausgelegt, das er beliebig viele
Blockchains von Communities abspeichern kann. Das hängt letzendlich von der Leistung der Hardware ab auf der er läuft und wie groß und aktiv die jeweiligen Communities sind. 
Damit das System also gut funktioniert braucht es viele Node-Server Betreiber und eventuell müssen wir noch extra Anreize schaffen 
Gradido-Nodes zu betreiben. 
Im Idealfall könnte also jeder Gradido Benutzer einen eigenen Node-Server auf seinem Heim-PC betreiben und kann dadurch immer prüfen das seine
Community nicht manipuliert wurde.

### Wo werden die Keys gespeichert
In Idealfall würde sich jeder Benutzer um seine eigenen Keys kümmern, so wie es bei Bitcoin und Co gemacht wird. 
Das ist aber nicht in jedem Fall praktikabel weil die meisten Benutzer nicht so technikaffin sind. 
Daher das Konzept mit dem Login-Server oder man könnte auch Key-Server dazu sagen, der die Keys möglichst sicher verwahrt.
So sicher das selbst ein unerfahrender Admin die Sicherheit der Keys nicht so leicht gefährden kann. 

Anfangs sollte er nur die verschlüsselt Keys speichern und dem Benutzer beim Anlegen der Keys eine dazugehörige Passphrase zeigen,
mit der der User umziehen kann oder sein Passwort zurücksetzen kann, wenn er es mal vergisst. 
Aber auch das hat sich als zu kompliziert für viele herausgestellt. Daher war die nächste Idee,
die Passphrase mit dem Admin-Public-Key verschlüsselt zu speichern so das nur der Admin mit seinem Private-Key sie entschlüsseln und damit freigeben kann, für ein Password Reset.
Der Nachteil das dadurch nun wieder dem Admin vertraut werden muss. Oder man setzte dafür mehrere Vertrauenspersonen ein, welche bei angeforderten Passwort-Reset ihre Keys eingeben. Solange das Programm nicht modifiziert wird, können diese die Private Keys auch nicht missbrauchen. 
Aktuell wird die Passphrase jedoch noch unverschlüsselt gespeichert. Das verschlüsselte Speichern der Passphrase setzt einige andere Änderungen voraus, und der Passwort-Reset Prozess muss überarbeitet werden. 

### Ausblick
Die Maximale Dezentralität könnten wir später erreichen, indem wir ganz auf einen (pro Community) zentralen Server verzichten
und die gesamte Arbeit im Desktop-Client oder in der Handy App machen. 
Diese benötigen dann einen Node-Server mit dem sie sich verbinden können um zu funktionieren. 
Das Bitcoin-Qt Wallet funktioniert genauso. Es läuft einmal ein Bitcoin-Node und dann das QT-Wallet als Desktop App
das mit dem Bitcoin-Node kommuniziert und darüber die Transaktionsdaten bezieht und Transaktionen versendet. 
Man bräuchte dann nur noch einen minimalen Server für die Benutzer die keine Desktop-App wollen und es in der Web-App machen wollen. Denn dann müssten alle Daten die nicht in der Blockchain gespeichert werden irgendwohin. Der Community-Server würde dann nur diese Daten verwalten und an der Webapp zur Verfügung stellen, den Rest kann die Webapp auch selber machen. Sie kann den Private Key des Benutzer entschlüsseln, die Transaktionen anlegen und per Iota ins Netzwerk schicken und sich die Transaktionen des Benutzer von einem Node-Server besorgen. 
In diesem Szenario würde eine Abschaltung des Community-Servers nur die Schöpfungen betreffen, die Benutzer könnten ihre Gradidos die sie besitzen 
weiterhin ausgeben. Und es wäre relativ einfach einen neuen Community-Server aufzusetzen ohne das die bestehenden Konten verändert werden müssten. 

Ich kann mir vorstellen das man selbst in diesem dezentralen Szenario dafür sorgen kann das die Keys der Benutzer zusätzlich gesichtert sind,
für die Benutzer die nicht selbst für genügend Sicherheit sorgen können. 
Dafür wählen sie einen oder mehrere andere Benutzer denen sie vertrauen, dann wird die Passphrase mit dem Public Keys dieser Benutzer verschlüsselt an diese Nutzer gesendet und wenn der Benutzer sein Passwort vergessen hat oder einen neuen PC/Handy hat löst ein Prozess aus bei die Vertrauensperson(en) ihr(e) passw(o|ö)rt(er) eintippen, die Passphrase entschlüsselt, mit einem temporären secret vom Benutzer neuverschlüsselt an den Benutzer sendet.
Der bzw. dessen Desktop App kann aus der Passphrase die Keys wieder herstellen und mit dem neuen Passwort ein neuen Secret Key zum verschlüsseln generieren, das damit verschlüsseln und abspeichern. 





