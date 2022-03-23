export const accountActivation = {
  de: {
    subject: 'Gradido: E-Mail Überprüfung',
    text: (data: {
      link: string
      firstName: string
      lastName: string
      email: string
      duration: string
      resendLink: string
    }): string =>
      `Hallo ${data.firstName} ${data.lastName},

Deine E-Mail-Adresse wurde soeben bei Gradido registriert.

Klicke bitte auf diesen Link, um die Registrierung abzuschließen und dein Gradido-Konto zu aktivieren:
${data.link}
oder kopiere den obigen Link in dein Browserfenster.
Der Link hat eine Gültigkeit von ${data.duration
        .replace('hours', 'Stunden')
        .replace('minutes', 'Minuten')
        .replace(
          ' and ',
          ' und ',
        )}. Sollte die Gültigkeit des Links bereits abgelaufen sein, kannst du dir hier einen neuen Link schicken lassen, in dem du deine E-Mail-Adresse eingibst:
${data.resendLink}

Mit freundlichen Grüßen,
dein Gradido-Team`,
  },
}
