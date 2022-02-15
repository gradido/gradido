export const accountActivation = {
  de: {
    subject: 'Gradido: E-Mail Überprüfung',
    text: (data: { link: string; firstName: string; lastName: string; email: string }): string =>
      `Hallo ${data.firstName} ${data.lastName},

Deine E-Mail-Adresse wurde soeben bei Gradido registriert.

Klicke bitte auf diesen Link, um die Registrierung abzuschließen und dein Gradido-Konto zu aktivieren:
${data.link}
oder kopiere den obigen Link in dein Browserfenster.

Mit freundlichen Grüßen,
dein Gradido-Team`,
  },
}
