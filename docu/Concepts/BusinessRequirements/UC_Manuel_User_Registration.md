# Manuelle User-Registrierung

## Motivation

Bei einer Veranstaltung o.ä. sollen neue Mitglieder geworben werden. Dabei ist ungewiss, ob sie ein Endgerät dabei haben bzw. dieses korrekt bedienen können (QR-Code, E-Mail-Zugang etc.). Es soll nun ohne Einsatz zusätzlicher Technologien eine schnelle und unkomplizierte Möglichkeit geschaffen werden, dass ein Moderator im Admin-Interface zusätzliche Funktionen zur Unterstützung des User-Registrierungsprozesses erhält:

1. manuelle Aktivierung eines User-Accounts ohne Email-Bestätigung und setzen eines (vorläufigen) Passworts
2. vollständige User-Registrierung mit Daten-Erfassung, Account-Aktivierung und setzen eines (vorläufigen) Passworts



## 1. Unterstützung einer User-Registrierung

Ein neuer User hat schon mit seiner Registrierung bei Gradido begonnen, aber in dem Moment keinen Zugriff auf seine Emails. Somit kann er seine erhaltene Bestätigungs-Email mit dem Link zur Konto-Aktivierung nicht abrufen und die Registrierung abschließen.

Für diesen Fall wird im Admin-Interface eine neue Funktionalität zur "manuellen Aktivierung eines User-Accounts" bereitgestellt.





## Brainstorming von Bernd


Damit wir ohne zusätzliche Technologie möglichst schnell und unkompliziert eine Lösung bekommen, dass wir neue User direkt vor Ort registrieren können, schlage ich folgende zwei Funktionen im Admin-Bereich vor:

1. Manuell bestätigen und (vorläufiges) Passwort setzen
2. Neuen User registrieren

### Usecase

Bei einer Veranstaltung o.ä. sollen neue Mitglieder geworben werden. Dabei ist ungewiss, ob sie ein Endgerät dabei haben bzw. dieses korrekt bedienen können (QR-Code, E-Mail-Zugang etc.)

#### Lösung:

Bei der Veranstaltung ist ein Moderator vor Ort, oder der Veranstalter bekommt vorübergehend Moderatoren-Rechte.

Der Moderator hat auf einem Browser sein Gradido-Konto (Admin-Interface) laufen. Auf einem anderen Browser (oder einem anderen Gerät) können sich ggf. User einloggen.

##### Variante 1:

Der Interessent registriert sich über Link/QR-Code, hat aber keinen Zugang zu seinen E-Mails. Der Moderator bestätigt ihn und gibt ihm ein vorläufiges Passwort (oder lässt den User im Backend  selbst ein Passwort eintippen).

##### Variante 2:

Der Moderator registriert den Interessenten und gibt ihm ein vorläufiges Passwort (oder lässt den User  im Backend  selbst ein Passwort eintippen).

Das vorläufige Passwort kann so lange vom Moderator geändert werden, bis der User über die Mail sein Passwort neu gesetzt hat.  Dadurch wird erreicht, dass der Moderator den User so lange unterstützen kann (z.B. wenn er sein PW vergessen hat), bis er Mail-Zugang hat und sein Passwort selbst setzen kann.

##### Weitere Anwendungsfälle:

Wenn eine (zukünftige) Community beschließt, dass neue Mitglieder nur durch persönliche Einladung aufgenommen werden. Für diesen Fall müsste dann noch die User-Registrierung abgeschaltet werden können.
