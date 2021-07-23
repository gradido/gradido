# Testfall: "C001-01-LoginMaske"

## Thema: "Benutzerverwaltung"

## Beschreibung:

*Welche(n) Anwendungsschritt/Oberfläche/Logik ist durch den Testfall betroffen?*

Es wird die Anzeige der Login-Maske geprüft auf:

* Vorhandensein aller geforderten Elemente gemäß Entwurf:

![Login Maske](../image/C001-01-LoginMaske.png)

* Layoutprüfung der statischen und dynamischen Elemente
* formelle Validierung von Eingaben in die Eingabefelder mit entsprechenden Fehlermeldungen
* Funktionsprüfung der Mehrsprachigkeit
* Funktionsprüfung der Footer-Links

**Nicht enthalten in diesem Testfall:**

* die Funktion hinter dem Button "Anmelden"; siehe dazu Testfall: [C001-02-LoginMaske]()
* die Funktion hinter dem Link "Passwort vergessen"; siehe dazu Testfall: [C001-03-LoginMaske]()

## Vorraussetzungen:

*Welche Vorraussetzungen (Daten/Anwendungschritte, etc.) müssen erfüllt sein, um den Testfall durchführen zu können?*

Es wird die URL

* Testumgebung: https://stage1.gradido.net/vue/login
* Produktionsumgebung: https://gradido.net/vue/login

aufgerufen und die Login-Maske wird angezeigt.


## Testfall-Schritte:

*Welche Schritte müssen zur Durchführung des Testfalles getätigt werden?  (Dateneingaben/ Navigationen/ Link- o Button-Klicks/ Schritte der Anwendungslogik/ etc.)*

1. Prüfung auf korrekte Anzeige der Statischen Elemente:

   1. Text, Rechtschreibung und Layout von:
      1. Maskenüberschrift "Gradido"
      2. Maskentext "Tausend Dank, weil du bei uns bist"
      3. Eingabeüberschrift "Anmeldung"
      4. Label "Email"
      5. Default-Text "Email" bei ungefülltem Eingabefeld
      6. Label "Passwort"
      7. Default-Text "Passwort" bei ungefülltem Eingabefeld
      8. Button-Text "Anmeldung"
      9. Linktext "Passwort vergessen"
      10. Sprachauswahltexte
      11. Footer Copyright
      12. Footer Links:
          1. "Gradido-Akademie"
          2. "App-Version"
          3. "Impressum"
          4. "Datenschutzerklärung"
          5. "Mitgliederbereich"
          6. "Whitepaper"
          7. "Support"
2. Prüfung der Eingabedynamik in der Login-Maske:

   1. Eingabefeld Email:
      1. valide Emailadresse gemäß Pattern: "name"@"domain"."ländercode"
      2. maximale Länge einer Email-Adresse?
   2. Eingabefeld Passwort:
      1. mindestens ein Zeichen
      2. maximale Länge eines Passwortes?
      3. Sichtbarschaltung und Verdeckung des eingegebenen Passwortes
   3. Sprachauswahl:
      1. entsprechen alle angezeigten Text der aktuell eingestellten Sprache?
      2. Umstellung der Sprache über die Sprachauswahl-Box
      3. Wiederholung von Schritt 2.3.1 und 2.3.2 bis alle verfügbaren Sprachen geprüft sind
   4. Footer-Links:
      1. "Gradido-Akademie" reagiert und landet je nach aktuell eingestellter Sprache auf URL "https://gradido.net/de"
      2. "App-Version" reagiert und landet je nach aktuell eingestellter Sprache auf URL "https://github.com/gradido/gradido/releases/latest"
      3. "Impressum" reagiert und landet je nach aktuell eingestellter Sprache auf URL "https://gradido.net/de/impressum/"
      4. "Datenschutzerklärung" reagiert und landet je nach aktuell eingestellter Sprache auf URL "https://gradido.net/de/datenschutz/"
      5. "Mitgliederbereich" reagiert und landet je nach aktuell eingestellter Sprache auf URL "https://elopage.com/s/gradido/sign_in?locale=de"
      6. "Whitepaper" reagiert und landet je nach aktuell eingestellter Sprache auf URL "https://docs.google.com/document/d/1jZp-DiiMPI9ZPNXmjsvOQ1BtnfDFfx8BX7CDmA8KKjY/edit?usp=sharing"
      7. "Support"reagiert und landet je nach aktuell eingestellter Sprache auf URL "https://gradido.net/de/contact/"


## Ende-Bedingungen:

*Welche Bedingungen werden am Ende des Testfalles bei positivem Ergebnis erwartet? (Daten/ GUI/ Zustände/ etc)*

Die Login-Maske wird wie erwartet angezeigt.

Die Texte und Layouts entsprechen den Vorgaben.

Die Format-Validierungen der Eingabefelder erfüllen die vorgegebenen Regeln

Alle Links reagieren gemäß den Vorgaben

Die Eingabefelder sind mit validen Inhalten gefüllt, so dass der Button "Anmeldung" betätigt werden könnte. Dies ist aber Teil des nächsten Testfalls unter [C001-02-LoginMaske]()


## erwartete Fehlerfälle:

*Welche Fehlerfälle können auftreten und wie ist das erwartete Verhalten/ Rückgabewerte/  Fehlercode?*

Eingabefeld "Email":

* kein Inhalt -> Fehlermeldung "Email ist ein Pflichtfeld"
* ungültige Email-Adresseingabe -> Fehlermeldung "Email muss eine gültige E-Mail-Adresse sein"

Eingabefeld "Passwort":

* kein Inhalt -> Fehlermeldung "Passwort ist ein Pflichtfeld"
