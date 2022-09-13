# Zeitzonen

Die Gradido-Anwendung läuft im Backend in der Zeitzone UTC und im Frontend in der jeweiligen lokalen Zeitzone, in der der User sich anmeldet. Dadurch kann es zu zeitlichen Diskrepanzen kommen, die innerhalb der Anwendungslogik aufgelöst bzw. entsprechend behandelt werden müssen. In den folgenden Kapiteln werden die verschiedenen zeitlichen Konstellationen dargestellt und für die verschiedenen fachlichen Prozesse die daraus resultierenden Problemlösungen beschrieben.

![img](./image/ZeitzonenKonstellationen.png)

## Beispiel 1

Ein User meldet sich in einer Zeitzone t0 - 4 an. Das bedeutet der User liegt 4 Stunden gegenüber der Backend-Zeit zurück.

Konkret hat der User die Zeit 31.08.2022 21:00:00 auf dem Server ist aber die Zeit bei 01.09.2022 01:00:00

Für die Erstellung einer Contribution hat der User noch folgende Gültigkeitsmonate und Beträge zur Wahl:

    Juni 2022: 500 GDD |  Juli 2022: 200 GDD |  August 2022: 1000 GDD

**aber das Backend liefert nur die Beträge, die eigentlich so korrekt wären!!!!!**

    **Juli 2022: 200 GDD |  August 2022: 1000 GDD |  September 2022: 1000 GDD** 

Er möchte für den Juni 2022 eine Contribution mit 500 GDD erfassen. **Wird ihm der Juni noch als Schöpfungsmonat angezeigt?** 

Falls ja, dann wählt er dabei im FE im Kalender den 30.06.2022. Dann liefert das FE folgende Contribution-Daten an das Backend:

* Gültigkeitsdatum:	30.06.2022 00:00:00
* Memo: text
* Betrag: 500 GDD
* **Zeitzone:	wird eine Zeitzone des User aus dem Context geliefert? Das fehlt: entweder über eine Zeit vom FE zum BE und ermitteln Offset im BE**

Im Backend wird dieses dann interpretiert und verarbeitet mit:

* **Belegung des Schöpfungsmonate-Arrays: [ 6, 7, 8] oder [7, 8, 9] da auf dem Server ja schon der 01.09.2022 ist?**
* Gültigkeitsdatum:	**30.06.2022 00:00:00 oder 01.07.2022 04:00:00 ?**
* Memo: text
* Betrag 500 GDD
* created_at:	01.07.2022 04:00:00

**Frage: wird die Contribution dem Juni (6) oder dem Juli (7) zugeordnet?**

1. falls Juni zugeordnet kann die Contribution mit 500 GDD eingelöst werden
2. falls Juli zugeordnet muss die Contribution mit 500 GDD abgelehnt werden, da möglicher Schöpfungsbetrag überschritten


## Beispiel 2


Ein User meldet sich in einer Zeitzone t0 + 1 an. Das bedeutet der User liegt 1 Stunde gegenüber der Backend-Zeit voraus.

Konkret hat der User die Zeit 01.09.2022 00:20:00 auf dem Server ist aber die Zeit bei 31.08.2022 23:20:00

Für die Erstellung einer Contribution hat der User noch folgende Gültigkeitsmonate und Beträge zur Wahl:

    Juli 2022: 200 GDD |  August 2022: 1000 GDD |  September 2022: 1000 GDD

**oder wird ihm**

**
    Juni 2022: 500 GDD |  Juli 2022: 200 GDD |  August 2022: 1000 GDD**

**angezeigt, da auf dem BE noch der 31.08.2022 ist?**

Er möchte für den September 2022 eine Contribution mit 500 GDD erfassen und wählt dabei im FE im Kalender den 01.09.2022. Dann liefert das FE folgende Contribution-Daten an das Backend:

* Gültigkeitsdatum:	01.09.2022 00:00:00 (siehe Logauszüge der Fehleranalyse im Ticket #2179)
* Memo: text
* Betrag: 500 GDD
* **Zeitzone:	wird eine Zeitzone des User aus dem Context geliefert?**

Im Backend wird dieses dann interpretiert und verarbeitet mit:

* Belegung des Schöpfungsmonate-Arrays: [ 6, 7, 8] **wie kann der User dann aber vorher September 2022 für die Schöpfung auswählen?**
* Gültigkeitsdatum:	01.09.2022 00:00:00
* Memo: text
* Betrag 500 GDD
* created_at:	31.08.2022 23:20:00

Es kommt zu einem **Fehler im Backend**, da im Schöpfungsmonate-Array kein September (9) vorhanden ist, da auf dem Server noch der 31.08.2022 und damit das Array nur die Monate Juni, Juli, August und nicht September beinhaltet.


## Erkenntnisse:

* die dem User angezeigten Schöpfungsmonate errechnen sich aus der lokalen User-Zeit und nicht aus der Backend-Zeit
  * das Backend muss somit für Ermittlung der möglichen Schöpfungsmonate und deren noch freien Schöpfungssummen den UserTimeOffset berücksichten
* der gewählte Schöpfungsmonat muss 1:1 vom Frontend in das Backend übertragen werden
* es darf kein Mapping in die Backend-Zeit erfolgen
  * sondern es muss der jeweilige UserTimeOffset mitgespeichert werden
* die Logik im BE muss den übertragenen bzw. ermittelten Offset der FE-Zeit entsprechend berücksichten und nicht die Backendzeit in der Logik anwenden
  * im BE darf es kein einfaches now = new Date() geben
  * im BE muss stattdessen ein userNow = new Date() + UserTimeOffset verwendet werden
* ein CreatedAt / UpdatedAt / DeletedAt / ConfirmedAt wird wie bisher in BE-Zeit gespeichert
  * **NEIN nicht notwendig:** plus in einer jeweils neuen Spalte CreatedOffset / UpdatedOffset / DeletedOffset / ConfirmedOffset der dabei gültige UserTimeOffset
* im FE wird immer im Request-Header der aktuelle Zeitpunkt mit Zeitzone geschrieben
* 

## Entscheidung
