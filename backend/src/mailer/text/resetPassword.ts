export const resetPassword = {
  de: {
    subject: 'Gradido: Passwort zurücksetzen',
    text: (data: {
      link: string
      firstName: string
      lastName: string
      email: string
      duration: string
      resendLink: string
    }): string =>
      `Hallo ${data.firstName} ${data.lastName},

Du oder jemand anderes hat für dieses Konto ein Zurücksetzen des Passworts angefordert.
Wenn du es warst, klicke bitte auf den Link: ${data.link}
oder kopiere den obigen Link in Dein Browserfenster.

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
