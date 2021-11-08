# Multiple Addresses with ed25519 and BIP32 
#608

Ich habe geschaut wie ich mit ed25519 Keys bip32 Funktionalität umsetzen kann und dafür eine Rust Bibliothek gefunden. 
Die habe ich dort eingebunden und ein bisschen getestet. 
Hier gibt es eine deutsche Erklärung des Mechanismus:
https://bitcoinblog.de/2017/01/18/simsalabim-so-einfach-wird-eine-abfolge-von-woertern-zum-backup-von-geld/
Kurz gesagt geht es darum das man aus einem key pair mehrere weitere key pairs ableiten kann. 
Ich kann also aus einem Privat Key beliebig viele weitere ableiten. Und eine Besonderheit ist das man auch die Public-Keys in eine Richtung ableiten kann, ohne die Private Keys kennen zu müssen.
Es gibt also eine geheime und eine nicht geheime Ableitung. 
Zum einen wollte ich das nutzen für die GDT Adresse, Diese würde ich über den Path GDT von der Root-Adresse des Benutzer ableiten. 
So ist diese neue Adresse algorithmisch mit dem Benutzer verbunden ohne das ich eine Liste der Adressen für jeden Benutzer speichern muss oder mehrere Private Keys für den Benutzer generieren müsste. 
So kann der Benutzer auch mehrere Unterkonten für sich anlegen, zum Beispiel die mit verschiedenen E-Mail Adressen verbunden sind, für Gewerbe und Privathaushalt, usw. 
Ohne das der Benutzer für jede neue Adresse einen neuen privat key benötigt. 
Auch wollte ich das ursprünglich für den Ausgleichs- und Umweltfond und Staatshaushalt-Topf benutzen als Unteradresse der Gruppen Adresse. 
Leider bringt eine public private key paar für die Gruppe den Nachteil mit sich, das es dann wieder zu zentral ist.


Daher habe ich für die Gruppen-Konten die Idee gehabt ein System zu nutzen bei dem diejenigen die zurzeit für die Gruppengelder verantwortlich sind das Gruppengeld ausgeben können. 
Dafür muss der Blockchain über das Voting-System bekannt sein wer dafür zurzeit "gewählt" wurde. Komplett ausgetüftelt habe ich das noch nicht. Ich habe nur eine vage Vorstellung davon, mehr ein Gefühl, ein Bild.
Es kann aber sein das ich auch hier wieder abgeleitete Adressen nutzen kann.

