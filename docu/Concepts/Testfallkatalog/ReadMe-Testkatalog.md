# Testfall-Katalog

Der Testfall-Katalog wird in dem Verzeichnis *Testfallkatalog* angelegt. Er wird zu den verschiedenen fachlichen Themen durch Unterverzeichnisse gegliedert. In den jeweiligen Unterverzeichnissen sind die zugehörigen Testfälle als einzelne Dateien definiert.

## Namenskonventionen

Als **Themen** sind beispielsweise

* CommunityVerwaltung
* BenutzerVerwaltung
* Schöpfung/Vergänglichkeit
* u.a.

vorgesehen, die als Unterverzeichnisse mit folgenden Nameskonventionen angelegt sind:

* Prefix-Pattern: "T", zweistellige laufende Nr, "-", Themenbezeichnung
* Beispiel: T01-CommunityVerwaltung

Die **Testfälle** selbst werden in einzelnen Dateien beschrieben. Die Namen der Testfall-Dateien folgen dem Namenspattern:

* Prefix-Pattern: "Prefix des Verzeichnisses"-"C", dreistellige laufende Nr, "-", zweistellig laufende Nr, "-", Testfallbezeichnung
* Beispiel: T02-C002-01-Benutzerregistrierung
* die dreistellige Nummer wird mit der Testfallbezeichnung in Bezug gesetzt
* die zweistellige Nummer dient als optionale Untergliederung für einen Testfall
* Beispiel:
  * T02-C002-01-Benutzerregistrierung: Schritt 1 - Registrierungslink
  * T02-C002-02-Benutzerregistrierung: Schritt 2 - Datenerfassung
  * T02-C002-03-Benutzerregistrierung: Schritt 3 - ...

Um Dialog-Masken als **Bilder** in die Testfallbeschreibungen einzubinden, gibt es das Verzeichnis Testfallkatalog/image. Dieses enthält alle Bilder aller Testfälle nach folgenden Konventionen:

* Die Bild-Dateien werden so benannt, wie die Testfalldatei, die sie einbindet.
* Sollten mehrere Bilder pro Testfall-Beschreibung notwendig sein, dann wird am Ende des Dateinamens, aber vor der Extension eine laufende Nummer vergeben.
* In der Testfall-Beschreibung können diese Bilder mit folgender Notation eingebunden werden:
  * `![alternativer Text](../image/<Name der Bilddatei>)`
* *Wie man direkt DrawIO-Bilder einhängen kann, ist noch nicht klar (notfalls muss eben ein PNG-Bild davon exportiert werden)*

## Testfall-Vorlage

Im Verzeichnis Testfallkatalog liegt eine Datei *Testfall-Vorlage.md*, die als Kopie für das Anlegen eines neuen Testfalles herangezogen werden kann. Die Kopie der Testfallvorlage im Test-Thema-Verzeichnis ist dann gemäß den oben beschriebenen Namenskonventionen für die Testfall-Datei umzubenennen.

In der Testfall-Vorlage sind die Gliederungen und Themen benannt, was eine Testfallbeschreibung beinhalten sollte.

## Ziel des Testfall-Katalogs

1. Erfassung aller Testfälle für die bisher vorhandene Software
   1. Schrittweise werden die Testfall-Dateien auf Basis von Test-Sessions erstellt und mit Inhalt gefüllt.
2. Testfall-Erfassung als Grundlage **VOR** der Entwicklung!
   1. Bei der Erstellung eines Tickets für Software-Entwicklung/Änderung wird das "Test-Thema" und der "Testfall" definiert, der als Anforderung für das Ticket dann vom Ticket-Owner in Form einer Testfall-Datei beschrieben wird.
   2. Der Link der Testfall-Datei wird im Ticket hinterlegt
   3. Ein Ticket OHNE Testfall-Datei darf weder beim Review abgenommen noch für ein Release geschlossen werden.
