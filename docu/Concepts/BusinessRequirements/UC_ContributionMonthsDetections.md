# Bestimmung der Schöpfungsmonate

Die Gradido-Anwendung erlaubt aktuell (10.2022), dass der User seine eigenen Gemeinwohl-Aktivitäten erfasst. Dabei wird ihm, ausgehend vom aktuellen Datum, für den aktuellen Monat und für den vorherigen Monat jeweils seine noch schöpfbaren Beträge bis zu den maximal erlaubten  1.000 GDD pro Monat angezeigt. Wenn der User nun eine neue Gemeinwohl-Aktivität erfassen will, dann muss er dazu auch ein Zieldatum angeben, um festzulegen, für welchen Monat der Betrag geschöpft werden soll.

Da es nun aber auf der Welt verschiedene Zeitzonen gibt und ein User von überall auf der Welt seine Contributions erfassen können soll, muß die Anwendung für die daraus resultierenden Zeit-Konstellationen vorbereitet sein.

## Zeit-Konstellationen

Das Backend und damit alle Zeitangaben, die in Gradido gespeichert werden, sind per Definition in der Weltzeit angegeben, sprich als UTC-Zeit ohne Offset. Damit wird gewährleistet, dass egal von wo ein User seine Daten erfasst, alle gespeicherten Daten zeitlich einheitlich vorliegen.

Wenn aber ein User sich nun aber in einer anderen Zeitzone befindet, dann müssen die daraus resultierenden Konstellationen beachtet werden.

### Zeitzone mit negativem Offset zu UTC

Der User befindet sich in einer Zeitzone, die zur UTC-Zeit einen negativen Offset hat und somit das Frontend sich zeitlich hinter der Backend-Zeit liegt.
