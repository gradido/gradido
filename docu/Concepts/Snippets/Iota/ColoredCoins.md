# Wie Colored Coins in Iota funktionieren
## Schöpfung
- Colored Coins werden bei Iota mit einer speziellen Transaktion erzeugt
- Die Farbe des neuen Coins wird durch den Transaktionshash beschrieben
- Die einmal erzeugte Menge von Colored Coins ist fest
- Um die Menge zu erhöhen müssten neue Colored Coin erzeugt werden und die alten damit ausgetauscht werden (z.B. mittels SmartContract)

## Geldmenge
- Colored Coins basierend auf den normalen Iota-Coins somit werden soviele Iota-Coins benötigt wie man Colored-Coins braucht
- 2.779.530.283.000.000 Iota maximale Coinmenge
- Weltbevölkerung 2021: 7.915.559.780
- Pro Kopf Geldmenge Gradido: 53.476
- Benötigte Iota Coins für Gradido mit 4 Nachkommastellen mit 25% Puffer: 
- 7.915.559.780 * 534.760.000 * 1.25 = 5.291.155.935.000.000.000
- Vorhandene Iota coins:                   2.779.530.283.000.000
- Es sind nicht genügend Iota Coins vorhanden im die ganze Welt mit Gradido auf Basis von Iota versorgen zu können

## Kosten 
- Kurs am 30.08.2021: 1 Miota = 0,84
- Bei Verwendung von 4 Nachkommastellen braucht es 10 Miota für 1.000 Colored Coins (Gradido) also Miota im Wert von 8,40€
- Aktuell (30.08.2021) geschöpfte Gradido Cent: 17.001.990.500
- Notwendige Miota: 17.002.0, Wert: 14.286,73 €
- Solange die Benutzer Kontrolle über ihre Keys haben können sie mit einem regulärem Iota Wallet die Gradidos wieder in Iota umwandeln (um z.B. der Vergänglichkeit zu entgehen)
- Mit 2 Nachkommastellen wird die Vergänglichkeit schon bei 100 Gradido und 1 Stunde ungenau 
- 1 Stunde,	100 Gradido, Vergänglichkeit: 0,00576, Gradidos nach einer Stunde: 99,99424 GDD
- 1 Minute,	100 Gradido, Vergänglichkeit: 0,000096, Gradidos nach einer Minute:	99,999904 GDD

## Dust-Protection
- Iota erlaubt bei leeren Adressen nur Transaktionen von mindestens 1 Miota
- Nachdem 1 Miota da ist sind bis zu 10 Transaktione < 1 Miota erlaubt, bevor ein weitere Transaktion mit mindestens 1 Miota eingehen muss
- Bei Verwendung von 4 Nachkommastellen entspricht das 100 GDD, bei 2 Nachkommastellen 10.000 GDD

## Lösung
Wir können nur 3 Nachkommastellen verwenden. 
### Kosten
- 0,84 € für 1.000 GDD
- 1.428 Euro für alle bisherigen geschöpften Gradidos
### Dust-Protection
- 1.000 GDD entspricht 1 Miota, die erste Schöpfung muss also zwangsläufig 1k Gradido betragen
- Jeder kann nur maximal 10 Transaktionen < 1k GDD empfangen bevor er die GDD weitergesendet haben muss um neue erhalten zu können oder eine neue Schöpfung von 1k GDD bekommen hat


