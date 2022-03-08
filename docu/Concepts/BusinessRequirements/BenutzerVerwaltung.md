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
* Nutzerprofil mit Bild und persönlichen Angeboten

## Gradido-ID {Gradido-Id}

Die GradidoID dient zur eindeutigen Identifizierung eines Nutzers. Sie soll einerseits *human readable* , aber auch die maschinelle Weiterverarbeitung bzw. Nutzung ermöglichen. Um dies zu ermöglichen wird es für einen Nutzer mehrere Schlüssel-Attribute zur eindeutigen Identifikation geben:

* technischer Key als UUID
* Email-Adresse(n)
* User-Alias

Der Aufbau einer Gradido-ID aus den Anteilen `<communityname>` und `<user-key>` kann für den `<user-key>` folgende Ausprägungen annehmen:

* mit technischem Key:  `<communityname>`/`<UUID>`
* mit Email-Adresse: `<communityname>`/`<email@adresse.ex>`
* mit User-Alias: `<communityname>`/`<useralias>`

Für die Anteile der Gradido-ID werden folgende Regeln festgelegt:

* `<communityname>`

  - Zeichen, die in einer URL erlaubt sind:
    * A-Z, a-z, 0-9
    * '-', '.', '_', '~'
* `<UUID>`

  * basierend auf (Pseudo)zufällig generierte UUID  (Version 4)
  * Konfliktfreiheit bei ![2^{{122}}\approx 5{,}3169\cdot 10^{{36}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/1924927d783e2d3969734633e134f643b6f9a8cd)
  * ist eine Zahl aus 16 Byte
  * ist hexadezimal notiert
  * in fünf Gruppen durch Bindestriche nach dem Muster `550e8400-e29b-11d4-a716-446655440000` unterteilt
* `<email@adresse.ex>`

  * alle Zeichen, die in einer gültigen E-Mail-Adresse erlaubt sind
  * allgemein gültiges Email-Format
* `<useralias>`:

  - mindestens 5 Zeichen
    * alphanumerisch
    * keine Umlaute
    * nach folgender Regel erlaubt (RegEx: [a-zA-Z0-9]-|_[a-zA-Z0-9])
  - Blacklist für Schlüsselworte, die frei definiert werden können
  - vordefinierte/reservierte System relevante Namen dürfen maximal aus 4 Zeichen bestehen


## Anwendungsfälle

### neuen Benutzer anlegen

### Benutzer bearbeiten

### Benutzer löschen

### Benutzer authentifizieren

### Benutzer authorisieren

### Benutzer bekanntgeben
