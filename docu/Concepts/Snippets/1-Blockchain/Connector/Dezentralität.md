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
Daher werden die Daten bei Gradido in spearate Blockchains pro Community gespeichert. 
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




