# GDD-Creation per Link/QR-Code

Die Idee besteht darin, dass ein Administrator eine Contributions mit all seinen Attributen und Regeln im System erfasst. Dabei kann er unter anderem festlegen, ob für diese ein Link oder ein QR-Code generiert und über andere Medien wie Email oder Messenger versendet werden kann. Der Empfänger kann diesen Link bzw QR-Code dann über die Gradido-Anwendung einlösen und bekommt dann den Betrag der Contribution als Schöpfung auf seinem Konto gutgeschrieben.

Für die Erfassung, Suche und Anzeige der Contributions und deren Gliederung in Kategorien wird es dazu im Admin-Bereich zusätzliche Funktionen und Dialoge geben.

## Übersicht - Dialog

In der Admin-Übersicht wird es zusätzliche Navigations- bzw. Menüpunkte geben, über die der Admin die gewünschte Funktionalität und die zugehörigen Dialoge öffnen kann.

![Admin Overview](./image/UC_Send_Contribution_Admin-Overview.png)


## Contribution erfassen

Bei der Erfassung einer Contribution wird die Kategorie, ein eindeutiger Name, eine Beschreibung der Contribution und der Betrag eingegeben.

Der Gültigkeitsstart wird als Default mit dem aktuellen Erfassungszeitpunkt vorbelegt, wobei das Gültigkeitsende leer bleibt und damit als endlos gültig definiert wird. Mit Eingabe eines Start- und/oder Endezeitpunktes kann aber ein konkreter Gültigkeitszeitraum erfasst werden.

Wie häufig ein User für diese Contribution eine Schöpfung gutgeschrieben bekommen kann, wird über die Auswahl eines Zyklus - stündlich, 2-stündlich, 4-stündlich, etc. - und innerhalb dieses Zyklus eine Anzahl an Wiederholungen definiert. Voreinstellung sind 1x täglich.

![Zyklus](./image/UC_Send_Contribution_Admin-new ContributionZyklus.png)

Ob die Contribution über einen versendeten Link bzw. QR-Code geschöpft werden kann, wird mittels der Auswahl "Versenden möglich als" bestimmt.


![send](./image/UC_Send_Contribution_Admin-new ContributionSend.png)


Für die Schöpfung der Contribution können weitere Regeln definiert werden:

* Gesamt - max. Anzahl Schöpfungen:   bestimmt die maximale Anzahl der möglichen Schöpfungen über alle User dieser Community. Sobald diese Anzahl an Schöpfungen erreicht ist, werden alle weiteren eingehenden Schöpfungsanfragen für diese Contribution -egal ob per Links, per QR-Code oder User-Online-Erfassung mit einer entsprechend aussagekräftigen Fehlermeldung abgelehnt.
* pro User
  * max schöpfbarer Betrag pro Monat:   mit diesem definierbaren Betrag kann vordefiniert werden, wieviel Gradido ein User innerhalb eines Abrechnungsmonats maximal durch diese Contribution schöpfen kann. Ist diese Summer erreicht werden weiter eingehende Schöpfungsanfragen - egal ob per Link, per QR-Code oder online - mit einer entsprechend aussagekräftigen Fehlermeldung abgelehnt.
  * max. Kontostand vor Schöpfung:   mit diesem definierbaren Betrag kann festgelegt werden, dass bevor für diese Contribution eine Schöpfung für den user erfolgt, eine Prüfung auf den aktuellen Kontostand erfolgt. Sobald der Kontostand höher als der vorgegebene Betrag ist, wird die eingehende Schöpfungsanfrage, ob per Link, per QR-Code oder online, mit einer entsprechend aussagekräftigen Fehlermeldung abgelehnt.
  * min. Abstand zw. erneuter Schöpfung:   es kann ein zeitlicher Abstand in Stunden definiert werden, der angibt wieviel Stunden seit der letzten erfolgten Schöpfung vergehen müssen, bevor eine erneute Schöpfungsanfrage, ob per Link, per QR-Code oder online angenommen und durchgeführt werden darf. Ist bei einer erneuten Schöpfungsanfrage der zeitliche Abstand noch nicht erreicht, dann wird mit einer entsprechend aussagekräftigen Fehlermeldung abgebrochen.

![new](./image/UC_Send_Contribution_Admin-newContribution.png)


## Datenbank-Modell


![Datenbankmodell](./image/DB-Diagramm_20220518.png)


### Contributions - Table

| Name                        | Typ          | Nullable |    Default    | Kommentar                                                                                                                              |
| --------------------------- | ------------ | :------: | :------------: | -------------------------------------------------------------------------------------------------------------------------------------- |
| ID                          | INT UNSIGNED | NOT NULL | auto increment | PrimaryKey                                                                                                                             |
| Name                        | varchar(100) | NOT NULL |               | unique Name                                                                                                                            |
| Description                 | varchar(255) |         |               |                                                                                                                                        |
| ContributionCategoryID      | INT UNSIGNED |         |               |                                                                                                                                        |
| ValidFrom                   | DATETIME     | NOT NULL |      NOW      |                                                                                                                                        |
| ValidTo                     | DATETIME     |         |      NULL      |                                                                                                                                        |
| Amount                      | DECIMAL      | NOT NULL |               |                                                                                                                                        |
| Cycle                       | ENUM         | NOT NULL |      ONCE      | ONCE, HOUR, 2HOUR, 4HOUR, 8HOUR, HALFDAY, DAY, 2DAYS, 3DAYS, 4DAYS, 5DAYS, 6DAYS, WEEK, 2WEEKS, MONTH, 2MONTH, QUARTER, HALFYEAR, YEAR |
| MaxPerCycle                 | INT UNSIGNED | NOT NULL |       1       |                                                                                                                                        |
| AbelToSend                  | ENUM         | NOT NULL |       NO       | NO, LINK, QRCODE                                                                                                                       |
| MaxAmountPerMonth           | DECIMAL      |         |      NULL      |                                                                                                                                        |
| TotalMaxCountOfContribution | INT UNSIGNED |         |      NULL      |                                                                                                                                        |
| MaxAccountBalance           | DECIMAL      |         |      NULL      |                                                                                                                                        |
| MinGapHours                 | INT UNSIGNED |         |      NULL      |                                                                                                                                        |
| CreatedAt                   | DATETIME     |         |      NOW      |                                                                                                                                        |
| Deleted                     | BOOL         | NOT NULL |     FALSE     |                                                                                                                                        |


### ContributionCategories -Table

| Name                   | Typ          | Nullable | Default        | Kommentar   |
| ---------------------- | ------------ | -------- | -------------- | ----------- |
| ID                     | INT UNSIGNED | NOT NULL | auto increment | PrimaryKey  |
| Name                   | varchar(100) | NOT NULL |                | unique Name |
| Description            | varchar(255) |          |                |             |
| Active                 | BOOL         | NOT NULL | TRUE           |             |
| ContributionCategoryID | INT UNSIGNED |          | NULL           |             |


![Contributions-DB](./image/DB-Diagramm_Contributions.png)



CREATE TABLE CommunityContributions (
Id INT UNSIGNED auto_increment NOT NULL,
Name varchar(100) NOT NULL,
Description varchar(255) NULL,
ContributionCategoryID INT UNSIGNED NULL,
ValidFrom DATETIME DEFAULT NOW NOT NULL,
ValidTo DATETIME DEFAULT null NULL,
Amount DECIMAL NOT NULL,
`Cycle` ENUM DEFAULT ONCE NOT NULL COMMENT 'ONCE, HOUR, 4HOUR, 8HOUR, HALFDAY, DAY, WEEK, 2WEEKS, MONTH, QUARTER, HALFYEAR, YEAR',
MaxPerCycle INT UNSIGNED DEFAULT 1 NOT NULL,
AbelToSend ENUM DEFAULT NO NOT NULL COMMENT 'NO, LINK, QRCODE',
MaxAmountPerMonth DECIMAL DEFAULT null NULL,
TotalMaxCountOfContribution INT UNSIGNED DEFAULT null NULL,
MaxAccountBalance DECIMAL DEFAULT null NULL,
MinGapHours INT UNSIGNED DEFAULT null NULL,
CreatedAt DATETIME DEFAULT NOW NULL,
Deleted BOOL DEFAULT FALSE NOT NULL
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE gradido_community.ContributionCategory (
ID INT UNSIGNED auto_increment NOT NULL,
Name varchar(100) NOT NULL,
Description varchar(255) NULL,
Active BOOL DEFAULT TRUE NOT NULL,
ContributionCategoryID INT UNSIGNED NULL
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
