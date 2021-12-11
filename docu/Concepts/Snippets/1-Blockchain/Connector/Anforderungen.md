## Allgemeine Anforderung
Anforderungen von Gradido die von Bernd genannt wurden oder die ich aus den Gesprächen mit Bernd hergeleitet habe.

### So skalierbar das es von der ganzen Welt verwendet werden kann
Gegenwärtiges Transaktionsvolumen auf der Welt: 3,5 Milliarden Transaktionen pro Tag.
Der erste Schritt um das besser erüllbar zu machen war die Aufteilung auf Gemeinschaften, bzw. Gruppen,
nicht nur von der Verwaltung her sondern auch auf Datenebene.
Auch wenn die Weltbevölkerung aufgeteilt wird auf einzelne Gemeinschaften können diese teilweise auch sehr groß werden. 
China hat die größte Bevölkerung und von daher auch die größten Verwaltungseinheiten. 
Der Größte Stadtbezirk in China Baiyun, in der größten Region Guangzhou, in der größten Provinz Guangdong enthält 16 Straßenvirtel. 
Zu einem Straßenvirtel gehören ~ 138.916 Menschen. 
Meine Planung war bisher dafür Programmiersprachen einzusetzen die besonders performant sind wie C++ und Möglichkeiten bieten die es zum Beispiel bei php nicht gibt um Datenbankabfragen zu reduzieren in dem die Daten welche oft benötigt werden direkt vom Server im Arbeitsspeicher gehalten werden.
Dadurch kann ich die Antwortszeit auf Request die keine Datenbankabfrage benötigen auf unter 1 ms drücken und ein einziger Server kann viel mehr Benutzer bedienen.
Dennoch haben wir uns anfangs dazu entschieden ein Teil der Community Funktionen in php abzubilden um in der Entwicklung schneller 
voran zu kommen. Nur die sicherheitsrelevanten Teile blieben in C++.

### Gesichert vor Hackern und Abschaltung
- Geschützt vor einzelnen Hacker die sich ein paar Gradidos dazu tricksen wollen
- Geschützt davor das einzelne Menschen ausgeschlossen werden können z.B. kritische Journalisten
- Geschützt davor das es von einzelnen Admins einfach abgeschaltet werden kann (z.B. durch Bestechung)
- Sichern der Private Keys so das kein Hacker sie selbst bei einem Server Hack in die Finger bekommen kann
- Transparenz (das man z.B. bei Politikern sehen kann von wem sie alles Geld bekommen)

Mit einem C++ Programm hat man die Möglichkeit dem Program beim Start einen Schlüssel mitzugeben der zusätzlich für die Verschlüsselung der Passwörter verwendet wird. 
Nicht als Parameter sondern per Eingabe so das das Passwort nicht im bash log auftaucht. 
Oder schon direkt beim compilieren und auf dem Production Server landet dann nur das compilierte Binary. Das ist aber weniger sicher, 
weil ein Hacker das Binary untersuchen kann um den Schlüssel daraus zu extrahieren, auch wenn es mit Obfuscator Techniken erschwert werden kann.

Auf die Art wäre es für einen Hacker selbst dann unmöglich an die Private Keys der Benutzer zu kommen, wenn er den Server gehackt hat,
auf dem der Login-Server läuft und er E-Mails und Passwörter von Benutzern erbeutet hat. Dieser Schlüssel würde also nirgendwo auf dem 
Server gespeichert werden und läge damit nur im Arbeitsspeicher vor. Dazu müsste man dann noch Techniken benutzen um zu verhindern 
das der Schlüssel aus dem Arbeitsspeicher gelesen werden kann. 

### In der Benutzung so einfach wie paypal
Also das Gradidos einfach an eine E-Mail Addresse gesendet werden können.
Der größte Teil der aktuellen Zielgruppe ist nicht besonders Computeraffin.



