# Benutzer-Verwaltung

Benutzer

* natürliche Person = TRUE (Flag für Schöpfungserlaubnis Human)

  * Vorname
  * Nachname
* natürliche Person = FALSE (Flag für Schöpfungserlaubnis Human)

  * Projekt/Firmenname/Organisation/Verein...
* Benutzername / useralias
* Emailadresse
* Konto
* Trustlevel (Zukunft)

## Gradido-ID

Die GradidoID oder auch Username dient zur eindeutigen Identifizierung eines Nutzers. Sie soll einerseits *human readable* , aber auch die maschinelle Weiterverarbeitung bzw. Nutzung ermöglichen. Daher werden folgende Regeln festgelegt:

Pattern:  `<communityname>`/`<useralias>`

* `<communityname>`
  - Zeichen, die in einer URL erlaubt sind:
    * A-Z, a-z, 0-9
    * '-', '.', '_', '~'
* `<useralias>`:
  - mindestens 5 Zeichen
    * alphanumerisch
    * keine Umlaute
    * - und \_ sind nur zwischen sonst gültigen Zeichen erlaubt (RegEx: [a-zA-Z0-9]-|_[a-zA-Z0-9])
  - Blacklist für Schlüsselworte, die frei definiert werden können
  - vordefinierte/reservierte System relevante Namen dürfen maximal aus 4 Zeichen bestehen


Nutzerprofil mit Bild und persönlichen Angeboten

## Anwendungsfälle

### neuen Benutzer anlegen

### Benutzer bearbeiten

### Benutzer löschen

### Benutzer authentifizieren

### Benutzer authorisieren

### Benutzer bekanntgeben
