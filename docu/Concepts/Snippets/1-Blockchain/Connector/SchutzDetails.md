# Gesichert vor Hackern und Abschaltung
Genauere Erläuterungen wie die Ziele erreicht werden

## Geschützt vor einzelnen Hacker die sich ein paar Gradidos dazu tricksen wollen
Gradidos werden über Schöpfungen erschaffen, diese müssen auf Blockchain Ebene von einem anderen 
Benutzer unterzeichnet werden. Außerdem sind sie auf 1000 GDD pro Monat beschränkt. 
Für die Zukunft ist außerdem eine Rechtesystem auf Blockchain-Ebene geplant das diejenigen die Schöpfen dürfen
weiter eingrenzt. Im Idealfall entscheiden alle Community-Mitglieder zusammen wer Schöpfen darf.
Somit ist ausgeschlossen das sich ein Hacker einfach einen zweiten Account anlegt um für sich selbst schöpfen zu können. 
Solange der Hacker keinen Privat Key von jemand anderes der Gradidos hat erbeuten kann, kann er sich keine Gradidos ertricksen. 
Alle ungültigen Transaktionen werden von den Gradidos Nodes abgelehnt. 
Wen von anderen Gradidos Nodes ungültige Transaktionen kommen, werden diese auch abgelehnt und der Gradido Node der sie verschickt hat, als fehlerhaft markiert. Das senkt das Vertrauen und könnte nach Wiederholung auch dazu führen das dem Gradido Node überhaupt nicht mehr vertraut wird.
Wenn er es schafft sich in die Community-Server Datenbank zu hacken, könnte er dort die Datenbestände ändern. Aber spätestens wenn er eine Transaktion rausschickt bei denen er mehr Gradidos versenden möchte als er eigentlich hat, werden die Gradido Nodes seine Transaktion ablehnen.
Er müsste schon mindestens die Hälfte alle Gradido Nodes seiner Community manipulieren oder eventuell auch mehr als 2/3 um Erfolg zu haben. Dann kann er seine Gradidos aber nur innerhalb der Community nutzen. Wenn er sie in einer anderen Community einsetzen will, muss er auch von dieser Community den Großteil der Gradido Nodes manipulieren. 


## Geschützt davor das einzelne Menschen ausgeschlossen werden können z.B. kritische Journalisten
Solange der Mensch seine Passphrase hat, kann er sein Konto bei anderen Communities wieder herstellen. 
Er kann dann anstatt ein neues Konto anzulegen, sein altes umziehen. Die Transaktionsdaten sind öffentlich auf den Gradido-Node Servern die seine ehemalige Community hosten einsehbar. 
Um seine Transaktionsdaten nachhaltig zu löschen, müssten schon mehr als die Hälfte der Gradido Node Server manipuliert werden die seine Community hosten. Daher ist es so wichtig das möglichst viele Menschen eigene Gradido Node Server hosten. 
Oder die alte Community kommt an seinen Privat Key heran und kann sein Geld sonstwohin schicken. 
Daher wäre es am besten wenn er kein Backup von seinem Privat Key auf dem Login-Server gespeichert hat, sondern sich stattdessen seine Passphrase gut weggelegt hat. 
Wenn keine Community ihn aufnehmen möchte, dann liegt es vielleicht an ihm oder ihr. 

## Geschützt davor das es von einzelnen Admins einfach abgeschaltet werden kann (z.B. durch Bestechung)
Dafür ist es wichtig das es neben der zentralen Zugriffsmöglichkeit über den Community-Server auch lokale Clients, wie ein Handy- oder Desktop Client gibt, welche Transaktionen direkt an die Blockchain senden können. 

## Sichern der Private Keys so das kein Hacker sie selbst bei einem Server Hack in die Finger bekommen kann
Mit einem C++ Programm hat man die Möglichkeit dem Program beim Start einen Schlüssel mitzugeben der zusätzlich für die Verschlüsselung der Passwörter verwendet wird. 
Nicht als Parameter sondern per Eingabe so das das Passwort nicht im bash log auftaucht. 
Oder schon direkt beim compilieren und auf dem Production Server landet dann nur das compilierte Binary. Das ist aber weniger sicher, 
weil ein Hacker das Binary untersuchen kann um den Schlüssel daraus zu extrahieren, auch wenn es mit Obfuscator Techniken erschwert werden kann.

Auf die Art wäre es für einen Hacker selbst dann unmöglich an die Private Keys der Benutzer zu kommen, wenn er den Server gehackt hat,
auf dem der Login-Server läuft und er E-Mails und Passwörter von Benutzern erbeutet hat. Dieser Schlüssel würde also nirgendwo auf dem 
Server gespeichert werden und läge damit nur im Arbeitsspeicher vor. Dazu müsste man dann noch Techniken benutzen um zu verhindern 
das der Schlüssel aus dem Arbeitsspeicher gelesen werden kann. 

Für die Berechnung des verschlüsselungs Key für den einzelnen Benutzer wird argon2id eine sogenannte Slow-Hashing Funktion verwendet. 
Die Parameter sind so gewählt das die Berechnung auf einem durchschnittlichen PC etwa 0,5 Sekunden dauert. 
argon2 ist ASIC und GPU resistent, das heißt selbst mit ASIC und GPU dauert die Berechnung noch ihre Zeit. 
Meine eigenen Tests mit https://github.com/WebDollar/argon2-gpu haben ergeben das ein Ryzen 9 5950X CPU etwa 20 Hashes per Second schafft. 
Ebenso eine NVIDIA GTX 1060 6GB GPU.

## Transparenz (das man z.B. bei Politikern sehen kann von wem sie alles Geld bekommen)
Das ist ein etwas schwieriges Thema: Transparenz vs. Privatsphäre.
Die Transaktionen auf der Blockchain sind für alle einsehbar, sind aber nicht mit Klarnamen versehen. 
Man muss schon den public-key einer Person wissen um herausfinden zu können, wieviele Gradidos sie gerade
auf ihrem Konto hat.
Oder durch Blockchain Analyse wer, wem wieviel wann schickt, das errechnen.
Genauso wie wohl der CIA die Bitcoin-Blockchain analysiert um Geldwäsche und andere Straftaten darüber finden zu können. 
Solange wir kein zSnark oder andere Anonymisierungsprotokolle verwenden ist es nicht möglich ein Konto
auf der Blockchain komplett zu verstecken. Man sieht das es da ist, auch wenn man vielleicht nicht weiß wem es gehört. 

