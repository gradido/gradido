export const accountMultiRegistration = {
  de: {
    subject: 'Gradido: Erneuter Registrierungsversuch mit deiner E-Mail',
    text: (data: {
      firstName: string
      lastName: string
      email: string
      resendLink: string
    }): string =>
      `Hallo ${data.firstName} ${data.lastName},

Deine E-Mail-Adresse wurde soeben erneut benutzt, um bei Gradido ein Konto zu registrieren.
Es existiert jedoch zu deiner E-Mail-Adresse schon ein Konto.

Klicke bitte auf den folgenden Link, falls du dein Passwort vergessen haben solltest:
${data.resendLink}
oder kopiere den obigen Link in dein Browserfenster.

Wenn du nicht derjenige bist, der sich versucht hat erneut zu registrieren, wende dich bitte an unseren support:
https://gradido.net/de/contact/

Mit freundlichen Grüßen,
dein Gradido-Team`,
  },
}
